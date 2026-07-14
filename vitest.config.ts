import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/**/*.graphql',
        'src/**/*.config.ts',
        'src/infrastructure/database/prisma/client.ts',
      ],
    },
    setupFiles: ['./tests/helpers/setup.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, 'src/config'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces'),
    },
  },
})
