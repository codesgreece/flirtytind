import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, ReportStatus, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(params: { q?: string; status?: AccountStatus; take?: number; skip?: number }) {
    const take = Math.min(params.take ?? 50, 100);
    const skip = params.skip ?? 0;
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.q
        ? {
            OR: [
              { email: { contains: params.q, mode: 'insensitive' as const } },
              { profile: { firstName: { contains: params.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          profile: { select: { firstName: true, verificationStatus: true, city: true } },
          subscription: { include: { plan: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async setUserStatus(adminId: string, userId: string, status: AccountStatus) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'admin.user.status',
        meta: { targetUserId: userId, status },
      },
    });
    return user;
  }

  async listReports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporter: { select: { id: true, email: true } },
        reportedUser: { select: { id: true, email: true } },
      },
    });
  }

  async resolveReport(
    adminId: string,
    reportId: string,
    input: { status: ReportStatus; resolverNote?: string },
  ) {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: input.status,
        resolverNote: input.resolverNote,
        resolvedAt: new Date(),
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'admin.report.resolve',
        meta: { reportId, status: input.status },
      },
    });
    return report;
  }

  async listVerifications(status?: VerificationStatus) {
    return this.prisma.verification.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
    });
  }

  async reviewVerification(
    adminId: string,
    verificationId: string,
    input: { status: VerificationStatus; note?: string },
  ) {
    const v = await this.prisma.verification.findUnique({ where: { id: verificationId } });
    if (!v) throw new NotFoundException('Verification not found');

    const updated = await this.prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: input.status,
        note: input.note,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.profile.update({
      where: { userId: v.userId },
      data: { verificationStatus: input.status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'admin.verification.review',
        meta: { verificationId, status: input.status },
      },
    });

    return updated;
  }

  async listAudit(take = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 200),
      include: { user: { select: { id: true, email: true } } },
    });
  }
}
