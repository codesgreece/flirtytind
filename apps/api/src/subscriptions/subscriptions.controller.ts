import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { subscribeSchema } from '@flirty/validation';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('plans')
  plans() {
    return this.subscriptions.listPlans();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.subscriptions.mySubscription(user.id);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(subscribeSchema))
    body: z.infer<typeof subscribeSchema>,
  ) {
    return this.subscriptions.subscribe(user.id, body.planCode);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: AuthUser) {
    return this.subscriptions.cancel(user.id);
  }
}
