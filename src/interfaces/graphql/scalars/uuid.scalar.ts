import { GraphQLScalarType, Kind } from 'graphql'
import { validate as isUUID } from 'uuid'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'

export const UUIDScalar = new GraphQLScalarType({
  name: 'UUID',
  description: 'Universally Unique Identifier',
  serialize(value: unknown) {
    if (typeof value === 'string' && isUUID(value)) return value
    if (value instanceof UUID) return value.value
    throw new TypeError('Value must be a valid UUID string')
  },
  parseValue(value: unknown) {
    if (typeof value === 'string' && isUUID(value)) return value
    throw new TypeError('Value must be a valid UUID string')
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING && isUUID(ast.value)) return ast.value
    return null
  },
})
