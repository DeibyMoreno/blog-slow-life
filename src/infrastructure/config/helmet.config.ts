import helmet from 'helmet'
import { serverConfig } from '../../config/modules/server.config.js'

export const helmetMiddleware = helmet({
  contentSecurityPolicy: serverConfig.isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
})
