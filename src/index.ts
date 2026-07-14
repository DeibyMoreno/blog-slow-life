import express from 'express'
import { createYoga, useLogger } from 'graphql-yoga'
import { useGraphQlJit } from '@envelop/graphql-jit'
import { serverConfig } from './config/modules/server.config.js'
import { logger } from './infrastructure/logging/index.js'
import { httpLogger } from './infrastructure/logging/index.js'
import { helmetMiddleware } from './infrastructure/config/helmet.config.js'
import { corsMiddleware } from './infrastructure/config/cors.config.js'
import { rateLimitMiddleware } from './infrastructure/config/rate-limit.config.js'
import { prismaClient } from './infrastructure/database/prisma/client.js'
import { schema } from './interfaces/graphql/schema.js'
import { createContextFactory } from './interfaces/graphql/context.js'
import { useRequestId } from './interfaces/graphql/plugins/request-id.plugin.js'
import { healthRouter } from './interfaces/http/health.controller.js'

async function bootstrap() {
  const app = express()

  app.use(helmetMiddleware)
  app.use(corsMiddleware)
  app.use(httpLogger)
  app.use(rateLimitMiddleware)
  app.use(express.json({ limit: '10kb' }))

  app.use(healthRouter)

  const contextFactory = createContextFactory({
    requestId: '',
    logger,
    prisma: prismaClient,
  })

  const yoga = createYoga({
    schema,
    context: async ({ request }) => {
      const requestId = (request as unknown as { id?: string })?.id ?? ''
      const loggerChild = logger.child({ requestId })
      const ctx = await contextFactory()
      return {
        ...ctx,
        requestId,
        logger: loggerChild,
        prisma: prismaClient,
        request,
      }
    },
    plugins: [
      useRequestId(),
      useGraphQlJit(),
      useLogger({
        logFn: (event, args) => {
          if (event === 'execute-start' && args.args.operationName !== 'IntrospectionQuery') {
            logger.info({ operation: args.args.operationName }, 'GraphQL operation started')
          }
        },
      }),
    ],
    maskedErrors: serverConfig.isProd ? { errorMessage: 'Internal server error' } : false,
    graphiql: serverConfig.isDev ? { title: 'Slow Life Blog CMS - GraphQL' } : false,
    logging: false,
  })

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
      '🚀 Server started',
    )
  })

  const shutdown = async () => {
    logger.info('Shutting down gracefully...')
    await prismaClient.$disconnect()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Failed to start server')
  process.exit(1)
})
