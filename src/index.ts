import express from 'express'
import { serverConfig } from './config/modules/server.config.js'
import { logger } from './infrastructure/logging/index.js'
import { httpLogger } from './infrastructure/logging/index.js'
import { helmetMiddleware } from './infrastructure/config/helmet.config.js'
import { corsMiddleware } from './infrastructure/config/cors.config.js'
import { rateLimitMiddleware } from './infrastructure/config/rate-limit.config.js'
import { prismaClient } from './infrastructure/database/prisma/client.js'
import { healthRouter } from './interfaces/http/health.controller.js'
import { createGraphQLServer } from './interfaces/graphql/server.js'

async function bootstrap() {
  const app = express()

  app.use(helmetMiddleware)
  app.use(corsMiddleware)
  app.use(httpLogger)
  app.use(rateLimitMiddleware)
  app.use(express.json({ limit: '10kb' }))

  app.use(healthRouter)

  const yoga = createGraphQLServer(logger, prismaClient)
  app.use(yoga.graphqlEndpoint, yoga)

  app.listen(serverConfig.port, serverConfig.host, () => {
    logger.info(
      {
        port: serverConfig.port,
        host: serverConfig.host,
        env: serverConfig.nodeEnv,
        graphql: `http://${serverConfig.host}:${serverConfig.port}${yoga.graphqlEndpoint}`,
        health: `http://${serverConfig.host}:${serverConfig.port}/health`,
      },
      'Server started',
    )
  })

  const shutdown = async () => {
    logger.info('Shutting down gracefully...')
    await prismaClient.$disconnect()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('unhandledRejection', (reason) => {
    logger.fatal(reason, 'Unhandled rejection')
    process.exit(1)
  })
  process.on('uncaughtException', (error) => {
    logger.fatal(error, 'Uncaught exception')
    process.exit(1)
  })
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Failed to start server')
  process.exit(1)
})