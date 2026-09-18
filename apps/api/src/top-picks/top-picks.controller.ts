import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { TopPicksService } from './top-picks.service';

@Controller('top-picks')
@UseGuards(JwtAuthGuard)
export class TopPicksController {
  constructor(private readonly topPicks: TopPicksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.topPicks.list(user.id);
  }
}
