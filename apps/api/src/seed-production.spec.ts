import { spawnSync } from 'child_process';
import { join } from 'path';

describe('seed production safety', () => {
  it('refuses to run full seed when NODE_ENV=production', () => {
    const seedPath = join(__dirname, '../../prisma/seed.ts');
    const result = spawnSync(
      'pnpm',
      ['exec', 'tsx', seedPath],
      {
        cwd: join(__dirname, '../..'),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          DATABASE_URL:
            process.env.DATABASE_URL ??
            'postgresql://flirty:flirty_dev@localhost:5432/flirty_greece?schema=public',
        },
        encoding: 'utf8',
      },
    );

    expect(result.status).not.toBe(0);
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    expect(output).toMatch(/REFUSING to seed in production/i);
  });
});
