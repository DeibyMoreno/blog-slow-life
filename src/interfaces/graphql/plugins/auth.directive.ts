import { UnauthorizedError } from '@domain/shared/errors/index.js'
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'
import { defaultFieldResolver } from 'graphql'
import type { GraphQLSchema } from 'graphql'

export function authDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0]
      if (!authDirective) return

      const originalResolve = fieldConfig.resolve ?? defaultFieldResolver

      fieldConfig.resolve = (source, args, context, info) => {
        if (!context.user) {
          throw new UnauthorizedError('Authentication required');
        }

        const allowedRoles = authDirective.roles as string[] | undefined;
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(context.user.role?.name)) {
          throw new UnauthorizedError('Insufficient permissions');
        }

        return originalResolve(source, args, context, info);
      }

      return fieldConfig
    },
  })
}