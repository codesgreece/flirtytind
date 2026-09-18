import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';

const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
});

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notifications.list(
      user.id,
      cursor,
      limit ? Number(limit) : 30,
    );
  }

  @Patch('read')
  markRead(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(markReadSchema)) body: z.infer<typeof markReadSchema>,
  ) {
    return this.notifications.markRead(user.id, body.ids);
  }
}
