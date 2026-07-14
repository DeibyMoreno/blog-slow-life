import type { GraphQLContext } from '../../../context.js'

export const authResolvers = {
  Mutation: {
    login: async (_: unknown, _args: unknown, _ctx: GraphQLContext) => {
      throw new Error('Not implemented yet')
    },
    refreshToken: async (_: unknown, _args: unknown, _ctx: GraphQLContext) => {
      throw new Error('Not implemented yet')
    },
    logout: async (_: unknown, __: unknown, _ctx: GraphQLContext) => {
      throw new Error('Not implemented yet')
    },
  },
}
