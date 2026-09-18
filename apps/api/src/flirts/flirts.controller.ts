import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FlirtsService, flirtSchema } from './flirts.service';

@Controller('flirts')
@UseGuards(JwtAuthGuard)
export class FlirtsController {
  constructor(private readonly flirts: FlirtsService) {}

  @Post()
  send(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(flirtSchema)) body: z.infer<typeof flirtSchema>,
  ) {
    return this.flirts.send(user.id, body);
  }

  @Get('received')
  received(@CurrentUser() user: AuthUser) {
    return this.flirts.received(user.id);
  }
}
