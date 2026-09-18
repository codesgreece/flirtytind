import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SwipeAction } from '@prisma/client';
import { SwipeInput } from '@flirty/validation';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { orderedMatchPair } from '../common/utils/geo';
import { RealtimeEmitter } from '../realtime/realtime.emitter';
import { REALTIME_EVENTS } from '@flirty/shared';

@Injectable()
export class SwipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly realtime: RealtimeEmitter,
  ) {}

  async swipe(userId: string, input: SwipeInput) {
    if (input.targetUserId === userId) {
      throw new BadRequestException('Cannot swipe yourself');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: input.targetUserId, status: 'ACTIVE' },
      include: { profile: true },
    });
    if (!target) throw new NotFoundException('Target user not found');

    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: input.targetUserId },
          { blockerId: input.targetUserId, blockedId: userId },
        ],
      },
    });
    if (blocked) throw new BadRequestException('Cannot swipe blocked user');

    const existing = await this.prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: input.targetUserId,
        },
      },
    });
    if (existing && !existing.undoneAt) {
      throw new BadRequestException('Already swiped this user');
    }

    if (input.action === SwipeAction.LIKE || input.action === SwipeAction.SUPER_LIKE) {
      await this.entitlements.assertCanLike(userId);
    }

    let useWalletSuper = false;
    if (input.action === SwipeAction.SUPER_LIKE) {
      const check = await this.entitlements.assertCanSuperLike(userId);
      useWalletSuper = check.useWallet;
    }

    const isSuper = input.action === SwipeAction.SUPER_LIKE;
    const isLike =
      input.action === SwipeAction.LIKE || input.action === SwipeAction.SUPER_LIKE;

    const result = await this.prisma.$transaction(async (tx) => {
      const swipe = existing
        ? await tx.swipe.update({
            where: { id: existing.id },
            data: { action: input.action, undoneAt: null, createdAt: new Date() },
          })
        : await tx.swipe.create({
            data: {
              fromUserId: userId,
              toUserId: input.targetUserId,
              action: input.action,
            },
          });

      let like = null;
      let match = null;
      let conversation = null;

      if (isLike) {
        like = await tx.like.upsert({
          where: {
            fromUserId_toUserId: {
              fromUserId: userId,
              toUserId: input.targetUserId,
            },
          },
          create: {
            fromUserId: userId,
            toUserId: input.targetUserId,
            isSuper,
          },
          update: { isSuper },
        });

        const reciprocal = await tx.like.findUnique({
          where: {
            fromUserId_toUserId: {
              fromUserId: input.targetUserId,
              toUserId: userId,
            },
          },
        });

        if (reciprocal) {
          const [userAId, userBId] = orderedMatchPair(userId, input.targetUserId);
          match = await tx.match.upsert({
            where: { userAId_userBId: { userAId, userBId } },
            create: { userAId, userBId },
            update: { unmatchedAt: null },
          });

          conversation = await tx.conversation.upsert({
            where: { matchId: match.id },
            create: {
              matchId: match.id,
              isDirect: false,
              participants: {
                create: [{ userId: userAId }, { userId: userBId }],
              },
            },
            update: {},
            include: { participants: true },
          });

          // Ensure both participants exist (if conversation already existed)
          for (const uid of [userAId, userBId]) {
            await tx.conversationParticipant.upsert({
              where: {
                conversationId_userId: {
                  conversationId: conversation.id,
                  userId: uid,
                },
              },
              create: { conversationId: conversation.id, userId: uid },
              update: { leftAt: null },
            });
          }

          const myName =
            (
              await tx.profile.findUnique({
                where: { userId },
                select: { firstName: true },
              })
            )?.firstName ?? 'Someone';
          const theirName = target.profile?.firstName ?? 'Someone';

          await tx.notification.createMany({
            data: [
              {
                userId,
                type: 'MATCH',
                title: 'New match!',
                body: `You matched with ${theirName}`,
                data: { matchId: match.id, conversationId: conversation.id },
              },
              {
                userId: input.targetUserId,
                type: 'MATCH',
                title: 'New match!',
                body: `You matched with ${myName}`,
                data: { matchId: match.id, conversationId: conversation.id },
              },
            ],
          });
        } else {
          await tx.notification.create({
            data: {
              userId: input.targetUserId,
              type: isSuper ? 'SUPER_LIKE' : 'LIKE',
              title: isSuper ? 'Someone super liked you' : 'Someone liked you',
              body: isSuper ? 'You received a super like' : 'You have a new like',
              data: { fromUserId: userId, isSuper },
            },
          });
        }
      }

      return { swipe, like, match, conversation };
    });

    if (isLike) {
      await this.entitlements.recordLikeUsage(userId);
    }
    if (input.action === SwipeAction.SUPER_LIKE) {
      await this.entitlements.recordSuperLikeUsage(userId, useWalletSuper);
    }

    if (result.match && result.conversation) {
      const payload = {
        matchId: result.match.id,
        conversationId: result.conversation.id,
        userIds: [userId, input.targetUserId],
      };
      this.realtime.emitToUser(userId, REALTIME_EVENTS.MATCH_CREATED, payload);
      this.realtime.emitToUser(
        input.targetUserId,
        REALTIME_EVENTS.MATCH_CREATED,
        payload,
      );
      this.realtime.emitToUser(input.targetUserId, REALTIME_EVENTS.NOTIFICATION_CREATED, {
        type: 'MATCH',
      });
    } else if (isLike) {
      this.realtime.emitToUser(
        input.targetUserId,
        isSuper ? REALTIME_EVENTS.SUPERLIKE_CREATED : REALTIME_EVENTS.LIKE_CREATED,
        { fromUserId: userId },
      );
      this.realtime.emitToUser(input.targetUserId, REALTIME_EVENTS.NOTIFICATION_CREATED, {
        type: isSuper ? 'SUPER_LIKE' : 'LIKE',
      });
    }

    return {
      swipe: result.swipe,
      matched: !!result.match,
      match: result.match,
      conversationId: result.conversation?.id ?? null,
    };
  }

  async rewind(userId: string) {
    await this.entitlements.assertCanRewind(userId);

    const last = await this.prisma.swipe.findFirst({
      where: { fromUserId: userId, undoneAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!last) throw new NotFoundException('No swipe to rewind');

    await this.prisma.$transaction(async (tx) => {
      await tx.swipe.update({
        where: { id: last.id },
        data: { undoneAt: new Date() },
      });

      if (last.action === SwipeAction.LIKE || last.action === SwipeAction.SUPER_LIKE) {
        await tx.like.deleteMany({
          where: { fromUserId: userId, toUserId: last.toUserId },
        });

        const [userAId, userBId] = orderedMatchPair(userId, last.toUserId);
        const match = await tx.match.findUnique({
          where: { userAId_userBId: { userAId, userBId } },
          include: { conversation: true },
        });
        if (match && !match.unmatchedAt) {
          // Only unmatch if the other person hasn't also liked us still... 
          // After deleting our like, reciprocal may still exist from them.
          // Match should only exist if both liked; we removed ours, so unmatch.
          await tx.match.update({
            where: { id: match.id },
            data: { unmatchedAt: new Date() },
          });
        }
      }
    });

    await this.entitlements.recordRewindUsage(userId);
    return { ok: true, undoneSwipeId: last.id, targetUserId: last.toUserId };
  }
}
