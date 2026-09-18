import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { BoostsService } from './boosts.service';

@Controller('boosts')
@UseGuards(JwtAuthGuard)
export class BoostsController {
  constructor(private readonly boosts: BoostsService) {}

  @Get('me')
  status(@CurrentUser() user: AuthUser) {
    return this.boosts.status(user.id);
  }

  @Post('activate')
  activate(@CurrentUser() user: AuthUser) {
    return this.boosts.activate(user.id);
  }
}
