import { createYoga, useLogger } from 'graphql-yoga'
import { useGraphQlJit } from '@envelop/graphql-jit'
import type { Logger } from 'pino'
import type { PrismaClient } from '@prisma/client'
import { schema } from './schema.js'
import { createContextFactory } from './context.js'
import { useRequestId } from './plugins/request-id.plugin.js'
import { errorMaskConfig } from './plugins/error-mask.plugin.js'
import { serverConfig } from '@config/modules/server.config.js'
import { validateSchema } from 'graphql'

export function createGraphQLServer(logger: Logger, prisma: PrismaClient) {
  const schemaValidationErrors = validateSchema(schema)
  if (schemaValidationErrors.length > 0) {
    throw new Error(
      `Schema validation failed:\n${schemaValidationErrors.map((e) => `  - ${e.message}`).join('\n')}`,
    )
  }

  return createYoga({
    schema,
    context: async ({ request }) => {
      const requestId = (request as unknown as { id?: string })?.id ?? ''
      const loggerChild = logger.child({ requestId })
      const ctx = await createContextFactory({
        requestId,
        logger,
        prisma,
      })(request)

      return {
        ...ctx,
        requestId,
        logger: loggerChild,
        prisma,
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
    maskedErrors: errorMaskConfig,
    graphiql: serverConfig.isDev ? { title: 'Slow Life Blog CMS - GraphQL' } : false,
    logging: false,
  })
}