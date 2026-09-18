import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  sendMessageSchema,
  directMessageSchema,
  SendMessageInput,
} from '@flirty/validation';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('conversations')
  conversations(@CurrentUser() user: AuthUser) {
    return this.messages.listConversations(user.id);
  }

  @Get('conversations/:id')
  history(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.history(
      user.id,
      id,
      cursor,
      limit ? Number(limit) : 50,
    );
  }

  @Post()
  send(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageInput,
  ) {
    return this.messages.send(user.id, body);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messages.markRead(user.id, id);
  }

  @Post('direct')
  direct(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(directMessageSchema))
    body: z.infer<typeof directMessageSchema>,
  ) {
    return this.messages.directMessage(user.id, body);
  }
}
