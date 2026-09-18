import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { updateProfileSchema, UpdateProfileInput } from '@flirty/validation';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProfilesService } from './profiles.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('profiles/me')
  me(@CurrentUser() user: AuthUser) {
    return this.profiles.getMyProfile(user.id);
  }

  @Patch('profiles/me')
  update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.profiles.updateProfile(user.id, body);
  }

  @Get('profiles/:userId')
  byUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.profiles.getPublicProfile(user.id, userId);
  }

  @Get('interests')
  interests() {
    return this.profiles.listInterests();
  }
}
