import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

export const passportSchema = z.object({
  city: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

@Injectable()
export class PassportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async get(userId: string) {
    return this.prisma.passport.findUnique({ where: { userId } });
  }

  async set(userId: string, input: z.infer<typeof passportSchema>) {
    await this.entitlements.assertCanPassport(userId);

    const passport = await this.prisma.passport.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });

    await this.prisma.preference.update({
      where: { userId },
      data: {
        passportCity: input.city,
        passportLat: input.latitude,
        passportLng: input.longitude,
      },
    });

    return passport;
  }

  async clear(userId: string) {
    await this.prisma.passport.deleteMany({ where: { userId } });
    await this.prisma.preference.update({
      where: { userId },
      data: {
        passportCity: null,
        passportLat: null,
        passportLng: null,
      },
    });
    return { ok: true };
  }
}
