import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PassportService, passportSchema } from './passport.service';

@Controller('passport')
@UseGuards(JwtAuthGuard)
export class PassportController {
  constructor(private readonly passport: PassportService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.passport.get(user.id);
  }

  @Put()
  set(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(passportSchema)) body: z.infer<typeof passportSchema>,
  ) {
    return this.passport.set(user.id, body);
  }

  @Delete()
  clear(@CurrentUser() user: AuthUser) {
    return this.passport.clear(user.id);
  }
}
