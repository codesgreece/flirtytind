import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { purchaseConsumableSchema } from '@flirty/validation';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ConsumablesService } from './consumables.service';

@Controller('consumables')
@UseGuards(JwtAuthGuard)
export class ConsumablesController {
  constructor(private readonly consumables: ConsumablesService) {}

  @Post('purchase')
  purchase(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(purchaseConsumableSchema))
    body: z.infer<typeof purchaseConsumableSchema>,
  ) {
    return this.consumables.purchase(user.id, body.type);
  }

  @Post('activate/boost')
  activateBoost(@CurrentUser() user: AuthUser) {
    return this.consumables.activateBoost(user.id);
  }

  @Post('activate/spotlight')
  activateSpotlight(@CurrentUser() user: AuthUser) {
    return this.consumables.activateSpotlight(user.id);
  }
}
