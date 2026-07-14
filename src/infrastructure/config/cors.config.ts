import cors from 'cors'
import { serverConfig } from '../../config/modules/server.config.js'

export const corsMiddleware = cors({
  origin: serverConfig.cors.origins,
  methods: serverConfig.cors.methods,
  credentials: true,
  optionsSuccessStatus: 204,
})
