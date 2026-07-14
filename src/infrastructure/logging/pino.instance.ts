import pino from 'pino'
import { loggerConfig } from '../../config/modules/logger.config.js'

let transport: pino.TransportSingleOptions | undefined

if (loggerConfig.isPretty) {
  transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  }
}

export const logger = pino({
  level: loggerConfig.level,
  ...(transport ? { transport } : {}),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'refreshToken'],
    censor: '[REDACTED]',
  },
})
