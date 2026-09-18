import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountStatus, ReportStatus, Role, VerificationStatus } from '@prisma/client';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminService } from './admin.service';

const statusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

const reportResolveSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  resolverNote: z.string().max(2000).optional(),
});

const verificationSchema = z.object({
  status: z.nativeEnum(VerificationStatus),
  note: z.string().max(2000).optional(),
});

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  users(
    @Query('q') q?: string,
    @Query('status') status?: AccountStatus,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.admin.listUsers({
      q,
      status,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }

  @Patch('users/:id/status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(statusSchema)) body: z.infer<typeof statusSchema>,
  ) {
    return this.admin.setUserStatus(user.id, id, body.status);
  }

  @Get('reports')
  reports(@Query('status') status?: ReportStatus) {
    return this.admin.listReports(status);
  }

  @Patch('reports/:id')
  resolveReport(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reportResolveSchema))
    body: z.infer<typeof reportResolveSchema>,
  ) {
    return this.admin.resolveReport(user.id, id, body);
  }

  @Get('verifications')
  verifications(@Query('status') status?: VerificationStatus) {
    return this.admin.listVerifications(status);
  }

  @Patch('verifications/:id')
  reviewVerification(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(verificationSchema))
    body: z.infer<typeof verificationSchema>,
  ) {
    return this.admin.reviewVerification(user.id, id, body);
  }

  @Get('audit')
  audit(@Query('take') take?: string) {
    return this.admin.listAudit(take ? Number(take) : 100);
  }
}
