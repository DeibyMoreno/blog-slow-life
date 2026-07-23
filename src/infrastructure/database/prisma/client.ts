import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '../../../config/env.js'

declare global {
  var __prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development'
        ? [{ level: 'query', emit: 'event' }, { level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }]
        : [{ level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }],
  })
}

export const prismaClient =
  global.__prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  global.__prisma = prismaClient
}
