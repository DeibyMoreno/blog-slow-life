import { GraphQLScalarType, Kind } from 'graphql'
import { Email } from '../../../domain/shared/value-objects/email.vo.js'

export const EmailScalar = new GraphQLScalarType({
  name: 'Email',
  description: 'Email address',
  serialize(value: unknown) {
    if (typeof value === 'string') return value
    if (value instanceof Email) return value.value
    throw new TypeError('Email must be a valid email string')
  },
  parseValue(value: unknown) {
    if (typeof value === 'string') return Email.create(value)
    throw new TypeError('Email must be a string')
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return Email.create(ast.value)
    return null
  },
})
