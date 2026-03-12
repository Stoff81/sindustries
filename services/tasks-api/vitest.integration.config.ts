import { defineConfig } from 'vitest/config';

const defaultDevDatabaseUrl = 'postgresql://postgres:postgres@localhost:6432/sindustries_dev?schema=tasks_api';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/db-integration.test.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || defaultDevDatabaseUrl
    }
  }
});
