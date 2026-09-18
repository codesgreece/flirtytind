import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { blockSchema } from '@flirty/validation';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BlocksService } from './blocks.service';

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.blocks.list(user.id);
  }

  @Post()
  block(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(blockSchema)) body: z.infer<typeof blockSchema>,
  ) {
    return this.blocks.block(user.id, body.blockedUserId);
  }

  @Delete(':blockedUserId')
  unblock(
    @CurrentUser() user: AuthUser,
    @Param('blockedUserId') blockedUserId: string,
  ) {
    return this.blocks.unblock(user.id, blockedUserId);
  }
}
