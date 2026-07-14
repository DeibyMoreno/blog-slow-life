import { env } from '../env.js'

export const loggerConfig = {
  level: env.LOG_LEVEL,
  format: env.LOG_FORMAT,
  isPretty: env.LOG_FORMAT === 'pretty',
} as const
