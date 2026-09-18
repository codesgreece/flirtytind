/**
 * DEV ONLY seed — creates subscription plans, interests, and clearly marked
 * seed users (emails @flirty.local). Never treat these as production data.
 *
 * For staging catalog-only: use prisma/seed-plans.ts instead.
 */
import { PrismaClient, Gender, ShowMe, LookingFor } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedPlansAndInterests } from './seed-plans';

const prisma = new PrismaClient();

function refuseUnsafeSeed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('REFUSING to seed in production');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL ?? '';
  const markers = ['prod', 'production', 'rds.amazonaws.com', 'neon.tech/prod'];
  const lower = dbUrl.toLowerCase();
  if (markers.some((m) => lower.includes(m)) && process.env.ALLOW_UNSAFE_SEED !== '1') {
    console.error('REFUSING to seed: DATABASE_URL looks like production');
    process.exit(1);
  }
}

async function main() {
  refuseUnsafeSeed();

  console.log('Seeding Flirty Greece (DEV ONLY)...');

  await seedPlansAndInterests(prisma);
  console.log('  ✓ subscription plans + interests');

  const passwordHash = await bcrypt.hash('SeedPass123!', 12);
  const interestRows = await prisma.interest.findMany({ take: 8 });

  const seedUsers = [
    {
      email: 'seed.alice@flirty.local',
      firstName: 'Alice',
      gender: Gender.WOMAN,
      showMe: ShowMe.MEN,
      city: 'Athens',
      latitude: 37.9838,
      longitude: 23.7275,
      bio: 'Seed user Alice — DEV ONLY. Loves beaches and Greek coffee.',
      lookingFor: LookingFor.LONG_TERM,
      birthDate: new Date('1995-04-12'),
    },
    {
      email: 'seed.bob@flirty.local',
      firstName: 'Bob',
      gender: Gender.MAN,
      showMe: ShowMe.WOMEN,
      city: 'Thessaloniki',
      latitude: 40.6401,
      longitude: 22.9444,
      bio: 'Seed user Bob — DEV ONLY. Into hiking and live music.',
      lookingFor: LookingFor.SHORT_TERM_OPEN,
      birthDate: new Date('1992-08-21'),
    },
    {
      email: 'seed.cara@flirty.local',
      firstName: 'Cara',
      gender: Gender.NON_BINARY,
      showMe: ShowMe.EVERYONE,
      city: 'Athens',
      latitude: 37.9755,
      longitude: 23.7348,
      bio: 'Seed user Cara — DEV ONLY. Art, film, and late-night gyros.',
      lookingFor: LookingFor.FRIENDS,
      birthDate: new Date('1998-01-30'),
    },
  ];

  for (const u of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            firstName: u.firstName,
            gender: u.gender,
            bio: u.bio,
            lookingFor: u.lookingFor,
            birthDate: u.birthDate,
            city: u.city,
            latitude: u.latitude,
            longitude: u.longitude,
            isDiscoverable: true,
            completionPercent: 80,
          },
        },
        preferences: {
          create: {
            showMe: u.showMe,
            minAge: 21,
            maxAge: 40,
            maxDistanceKm: 80,
            latitude: u.latitude,
            longitude: u.longitude,
          },
        },
        entitlementWallet: { create: {} },
      },
      update: {},
    });

    for (const interest of interestRows.slice(0, 5)) {
      await prisma.profileInterest.upsert({
        where: {
          userId_interestId: { userId: user.id, interestId: interest.id },
        },
        create: { userId: user.id, interestId: interest.id },
        update: {},
      });
    }

    const existingPhoto = await prisma.profilePhoto.findFirst({
      where: { userId: user.id },
    });
    if (!existingPhoto) {
      await prisma.profilePhoto.create({
        data: {
          userId: user.id,
          key: `seed/${user.id}.png`,
          url: `${process.env.STORAGE_PUBLIC_BASE_URL ?? 'http://localhost:3001/uploads'}/seed/placeholder.png`,
          sortOrder: 0,
          isPrimary: true,
          mimeType: 'image/png',
          bytes: 70,
        },
      });
    }
  }
  console.log('  ✓ seed users (seed.*@flirty.local / SeedPass123!)');

  await prisma.user.upsert({
    where: { email: 'seed.admin@flirty.local' },
    create: {
      email: 'seed.admin@flirty.local',
      passwordHash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
      profile: { create: { firstName: 'Admin', isDiscoverable: false } },
      preferences: { create: {} },
      entitlementWallet: { create: {} },
    },
    update: { role: 'ADMIN' },
  });
  console.log('  ✓ seed.admin@flirty.local (ADMIN)');

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
