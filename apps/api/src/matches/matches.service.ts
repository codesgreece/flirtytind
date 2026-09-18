import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        unmatchedAt: null,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        userA: {
          select: {
            id: true,
            profile: true,
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
        userB: {
          select: {
            id: true,
            profile: true,
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
    });

    return matches.map((m) => {
      const other = m.userAId === userId ? m.userB : m.userA;
      return {
        id: m.id,
        createdAt: m.createdAt,
        conversationId: m.conversation?.id ?? null,
        lastMessage: m.conversation?.messages[0] ?? null,
        otherUser: {
          id: other.id,
          firstName: other.profile?.firstName ?? null,
          photo: other.photos[0] ?? null,
          verificationStatus: other.profile?.verificationStatus ?? null,
        },
      };
    });
  }
}
