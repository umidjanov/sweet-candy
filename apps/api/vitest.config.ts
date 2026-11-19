import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://sweetmarket:sweetmarket_pass@localhost:5432/sweetmarket_db?schema=public',
      JWT_ACCESS_SECRET: 'test_secret_for_jwt_access_must_be_long_enough',
      JWT_REFRESH_SECRET: 'test_secret_for_jwt_refresh_must_be_long_enough',
      NODE_ENV: 'test',
    },
  },
});
