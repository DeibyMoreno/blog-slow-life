import { GraphQLScalarType, Kind } from 'graphql'

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 formatted date string',
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string') return value
    throw new TypeError('DateTime must be a Date object or ISO string')
  },
  parseValue(value: unknown) {
    if (typeof value === 'string') {
      const date = new Date(value)
      if (isNaN(date.getTime())) throw new TypeError('Invalid DateTime')
      return date
    }
    throw new TypeError('DateTime must be a string')
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value)
      if (isNaN(date.getTime())) throw new TypeError('Invalid DateTime')
      return date
    }
    return null
  },
})
