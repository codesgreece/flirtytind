import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { reportSchema } from '@flirty/validation';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.reports.myReports(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(reportSchema)) body: z.infer<typeof reportSchema>,
  ) {
    return this.reports.create(user.id, body);
  }
}
