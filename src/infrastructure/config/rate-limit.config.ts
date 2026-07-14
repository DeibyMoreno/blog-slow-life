import rateLimit from 'express-rate-limit'
import { serverConfig } from '../../config/modules/server.config.js'

export const rateLimitMiddleware = rateLimit({
  windowMs: serverConfig.rateLimit.windowMs,
  max: serverConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
})
