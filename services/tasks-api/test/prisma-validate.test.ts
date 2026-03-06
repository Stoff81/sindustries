import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('prisma schema', () => {
  it('validates successfully', () => {
    const cwd = path.resolve(__dirname, '..');
    const output = execSync('npx prisma validate --schema prisma/schema.prisma', {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sindustries_tasks?schema=tasks_api'
      }
    });

    expect(output).toContain('The schema at prisma/schema.prisma is valid');
  });
});
