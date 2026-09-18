/**
 * Safe catalog seed — upserts SubscriptionPlan + Interest only.
 * No users. Suitable for staging / production catalog bootstrap.
 *
 * Usage: pnpm --filter @flirty/api exec tsx prisma/seed-plans.ts
 */
import { PrismaClient, PlanCode } from '@prisma/client';
import { DEFAULT_INTERESTS, PLAN_PRICES_EUR } from '@flirty/shared';

const prisma = new PrismaClient();

export async function seedPlansAndInterests(client: PrismaClient = prisma) {
  for (const code of Object.values(PlanCode)) {
    const priceCents = Math.round(PLAN_PRICES_EUR[code as keyof typeof PLAN_PRICES_EUR] * 100);
    await client.subscriptionPlan.upsert({
      where: { code },
      create: {
        code,
        name: code.charAt(0) + code.slice(1).toLowerCase(),
        priceCents,
        currency: 'EUR',
      },
      update: {
        priceCents,
        name: code.charAt(0) + code.slice(1).toLowerCase(),
      },
    });
  }

  for (const name of DEFAULT_INTERESTS) {
    await client.interest.upsert({
      where: { name },
      create: { name, category: 'general' },
      update: {},
    });
  }
}

async function main() {
  console.log('Seeding plans + interests (catalog only)...');
  await seedPlansAndInterests();
  console.log(`  ✓ plans + ${DEFAULT_INTERESTS.length} interests`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
