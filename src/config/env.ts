import { z } from 'zod'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const envFile = process.env.NODE_ENV === 'test' ? '.env.test'
  : process.env.NODE_ENV === 'production' ? '.env.production'
  : '.env.development'

dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) })
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().transform((val) => val.split(',').map((s) => s.trim())),
  CORS_METHODS: z.string().default('GET,POST,PUT,PATCH,DELETE,OPTIONS'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:') // eslint-disable-line no-console
    const { fieldErrors } = result.error.flatten()
    for (const [key, messages] of Object.entries(fieldErrors)) {
      console.error(`  ${key}: ${messages?.join(', ')}`) // eslint-disable-line no-console
    }
    process.exit(1) // eslint-disable-line no-process-exit
  }
  return result.data
}

export const env = validateEnv()
