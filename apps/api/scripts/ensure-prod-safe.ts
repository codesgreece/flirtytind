/**
 * Production safety checks for seed / destructive scripts.
 *
 * - Full user seed (prisma/seed.ts) refuses NODE_ENV=production and
 *   DATABASE_URL values that look like production hosts.
 * - Catalog-only seed (prisma/seed-plans.ts) is safe for staging and only
 *   upserts SubscriptionPlan + Interest — never users.
 *
 * Override (local emergency only): ALLOW_UNSAFE_SEED=1
 */
export function assertNotProductionSeed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REFUSING to seed in production');
  }
  const dbUrl = (process.env.DATABASE_URL ?? '').toLowerCase();
  const markers = ['prod', 'production', 'rds.amazonaws.com'];
  if (
    markers.some((m) => dbUrl.includes(m)) &&
    process.env.ALLOW_UNSAFE_SEED !== '1'
  ) {
    throw new Error('REFUSING to seed: DATABASE_URL looks like production');
  }
}

if (require.main === module) {
  try {
    assertNotProductionSeed();
    console.log('Environment looks safe for full seed (dev/staging).');
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
