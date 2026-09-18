import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { EntitlementsService } from './entitlements.service';

@Controller('entitlements')
@UseGuards(JwtAuthGuard)
export class EntitlementsController {
  constructor(private readonly entitlements: EntitlementsService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.entitlements.getStatus(user.id);
  }
}
