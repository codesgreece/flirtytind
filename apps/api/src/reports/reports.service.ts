import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    reporterId: string,
    input: { reportedUserId: string; category: string; description?: string },
  ) {
    if (reporterId === input.reportedUserId) {
      throw new BadRequestException('Cannot report yourself');
    }
    return this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId: input.reportedUserId,
        category: input.category,
        description: input.description,
      },
    });
  }

  async myReports(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
