import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PushService } from './push.service';

const registerSchema = z.object({
  pushToken: z.string().min(8).max(512),
  platform: z.string().min(1).max(32).optional(),
});

const unregisterSchema = z.object({
  pushToken: z.string().min(8).max(512),
});

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly push: PushService) {}

  @Post('register')
  register(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(registerSchema))
    body: z.infer<typeof registerSchema>,
  ) {
    return this.push.registerDevice(user.id, body);
  }

  @Delete('unregister')
  unregister(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(unregisterSchema))
    body: z.infer<typeof unregisterSchema>,
  ) {
    return this.push.unregisterDevice(user.id, body.pushToken);
  }
}
