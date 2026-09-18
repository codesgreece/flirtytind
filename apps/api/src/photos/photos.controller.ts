import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { reorderPhotosSchema } from '@flirty/validation';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PhotosService } from './photos.service';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.photos.list(user.id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.photos.upload(user.id, file);
  }

  @Patch('reorder')
  reorder(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(reorderPhotosSchema))
    body: z.infer<typeof reorderPhotosSchema>,
  ) {
    return this.photos.reorder(user.id, body.photoIds);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.photos.delete(user.id, id);
  }
}
