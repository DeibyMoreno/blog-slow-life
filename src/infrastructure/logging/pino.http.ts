import { pinoHttp } from 'pino-http'
import { v4 as uuidv4 } from 'uuid'
import { logger } from './pino.instance.js'

export const httpLogger = pinoHttp({
  logger,
  genReqId: () => uuidv4(),
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/version',
  },
  serializers: {
    req: (req: { method: string; url: string; id: string }) => ({
      method: req.method,
      url: req.url,
      requestId: req.id,
    }),
    res: (res: { statusCode: number }) => ({
      statusCode: res.statusCode,
    }),
  },
  customSuccessMessage: (req: { method: string; url: string }, res: { statusCode: number }) => {
    return `${req.method} ${req.url} - ${res.statusCode}`
  },
  customErrorMessage: (req: { method: string; url: string }, res: { statusCode: number }, err: Error) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`
  },
})
