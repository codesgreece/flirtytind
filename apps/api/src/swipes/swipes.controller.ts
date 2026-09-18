import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { swipeSchema, SwipeInput } from '@flirty/validation';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SwipesService } from './swipes.service';

@Controller('swipes')
@UseGuards(JwtAuthGuard)
export class SwipesController {
  constructor(private readonly swipes: SwipesService) {}

  @Post()
  swipe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(swipeSchema)) body: SwipeInput,
  ) {
    return this.swipes.swipe(user.id, body);
  }

  @Post('rewind')
  rewind(@CurrentUser() user: AuthUser) {
    return this.swipes.rewind(user.id);
  }
}
