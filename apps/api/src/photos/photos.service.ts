import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ProfilesService } from '../profiles/profiles.service';

const MAX_PHOTOS = 6;

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly profiles: ProfilesService,
  ) {}

  async list(userId: string) {
    return this.prisma.profilePhoto.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File required');
    const count = await this.prisma.profilePhoto.count({ where: { userId } });
    if (count >= MAX_PHOTOS) {
      throw new BadRequestException(`Maximum ${MAX_PHOTOS} photos`);
    }

    const stored = await this.storage.upload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      folder: `users/${userId}`,
    });

    const photo = await this.prisma.profilePhoto.create({
      data: {
        userId,
        key: stored.key,
        url: stored.url,
        sortOrder: count,
        isPrimary: count === 0,
        mimeType: stored.mimeType,
        bytes: stored.bytes,
      },
    });

    await this.syncCompletion(userId);
    return photo;
  }

  async delete(userId: string, photoId: string) {
    const photo = await this.prisma.profilePhoto.findFirst({
      where: { id: photoId, userId },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    await this.storage.delete(photo.key);
    await this.prisma.profilePhoto.delete({ where: { id: photoId } });

    const remaining = await this.prisma.profilePhoto.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });
    await Promise.all(
      remaining.map((p, idx) =>
        this.prisma.profilePhoto.update({
          where: { id: p.id },
          data: { sortOrder: idx, isPrimary: idx === 0 },
        }),
      ),
    );
    await this.syncCompletion(userId);
    return { ok: true };
  }

  async reorder(userId: string, photoIds: string[]) {
    const photos = await this.prisma.profilePhoto.findMany({ where: { userId } });
    if (photos.length !== photoIds.length) {
      throw new BadRequestException('photoIds must include all photos');
    }
    const set = new Set(photos.map((p) => p.id));
    for (const id of photoIds) {
      if (!set.has(id)) throw new BadRequestException('Invalid photo id');
    }

    await this.prisma.$transaction(
      photoIds.map((id, idx) =>
        this.prisma.profilePhoto.update({
          where: { id },
          data: { sortOrder: idx, isPrimary: idx === 0 },
        }),
      ),
    );
    return this.list(userId);
  }

  private async syncCompletion(userId: string) {
    const pct = await this.profiles.recomputeCompletion(userId);
    await this.prisma.profile.update({
      where: { userId },
      data: { completionPercent: pct },
    });
  }
}
