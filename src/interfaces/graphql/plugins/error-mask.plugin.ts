import { GraphQLError } from 'graphql'
import type { YogaMaskedErrorOpts } from 'graphql-yoga'
import { env } from '@config/env.js'
import { AppError } from '@domain/shared/errors/index.js'
import { logger } from '@infrastructure/logging/pino.instance.js'

function isGraphQLError(error: unknown): error is GraphQLError {
  return error instanceof GraphQLError
}

export const errorMaskConfig: YogaMaskedErrorOpts = {
  maskError: (error: unknown, message: string, isDev: boolean | undefined) => {
    logger.debug({ error, message, isDev }, 'Error masked')

    const originalError = isGraphQLError(error)
      ? (error as GraphQLError).originalError ?? error
      : error

    if (originalError instanceof AppError) {
      const extensions: Record<string, unknown> = {
        code: originalError.code,
        http: { status: originalError.statusCode },
      }

      return new GraphQLError(originalError.message, { extensions })
    }

    return new GraphQLError(message)
  },
  errorMessage: 'Unexpected error.',
  isDev: env.NODE_ENV !== 'production',
}