import { Injectable, NotFoundException } from '@nestjs/common';
import { PreferencesInput } from '@flirty/validation';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class PreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async get(userId: string) {
    const prefs = await this.prisma.preference.findUnique({ where: { userId } });
    if (!prefs) throw new NotFoundException('Preferences not found');
    return prefs;
  }

  async update(userId: string, input: PreferencesInput) {
    if (input.incognito === true) {
      await this.entitlements.assertCanIncognito(userId);
    }
    if (
      input.passportCity != null ||
      input.passportLat != null ||
      input.passportLng != null
    ) {
      await this.entitlements.assertCanPassport(userId);
    }

    return this.prisma.preference.upsert({
      where: { userId },
      create: { userId, ...normalizePrefs(input) },
      update: normalizePrefs(input),
    });
  }
}

function normalizePrefs(input: PreferencesInput) {
  const data: Record<string, unknown> = { ...input };
  // Convert nullables for prisma
  if (input.passportCity === null) data.passportCity = null;
  if (input.passportLat === null) data.passportLat = null;
  if (input.passportLng === null) data.passportLng = null;
  return data;
}
