import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { preferencesSchema, PreferencesInput } from '@flirty/validation';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get('me')
  get(@CurrentUser() user: AuthUser) {
    return this.preferences.get(user.id);
  }

  @Patch('me')
  update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(preferencesSchema)) body: PreferencesInput,
  ) {
    return this.preferences.update(user.id, body);
  }
}
