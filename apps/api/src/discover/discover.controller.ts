import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { DiscoverService } from './discover.service';

@Controller('discover')
@UseGuards(JwtAuthGuard)
export class DiscoverController {
  constructor(private readonly discover: DiscoverService) {}

  @Get('feed')
  feed(
    @CurrentUser() user: AuthUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discover.feed(user.id, {
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
