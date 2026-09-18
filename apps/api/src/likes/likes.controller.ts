import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { LikesService } from './likes.service';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Get('received')
  received(@CurrentUser() user: AuthUser) {
    return this.likes.whoLikesYou(user.id);
  }
}
