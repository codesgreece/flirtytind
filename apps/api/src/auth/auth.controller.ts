import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  RegisterInput,
  LoginInput,
} from '@flirty/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { z } from 'zod';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Req() req: Request,
  ) {
    return this.auth.register(body, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
  ) {
    return this.auth.login(body, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('refresh')
  refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: z.infer<typeof refreshSchema>,
    @Req() req: Request,
  ) {
    return this.auth.refresh(body.refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('logout')
  logout(
    @Body(new ZodValidationPipe(refreshSchema)) body: z.infer<typeof refreshSchema>,
  ) {
    return this.auth.logout(body.refreshToken);
  }
}
