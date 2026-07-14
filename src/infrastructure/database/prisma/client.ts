import { PrismaClient } from '@prisma/client'
import { env } from '../../../config/env.js'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [{ level: 'query', emit: 'event' }, { level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }]
        : [{ level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }],
  })

if (env.NODE_ENV !== 'production') {
  global.__prisma = prismaClient
}
