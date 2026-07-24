import { container } from '../../../../../infrastructure/container/container.js'
import type { GraphQLContext } from '../../../context.js'

export const authResolvers = {
  Mutation: {
    login: async (
      _: unknown,
      args: { input: { email: string; password: string } },
      ctx: GraphQLContext,
    ) => {
      return container.loginUseCase.execute(args.input, {
        ipAddress: ctx.request?.headers?.get('x-forwarded-for') ?? ctx.request?.headers?.get('x-real-ip') ?? undefined,
        userAgent: ctx.request?.headers?.get('user-agent') ?? undefined,
      })
    },
    refreshToken: async (_: unknown, _args: unknown, _ctx: GraphQLContext) => {
      throw new Error('Not implemented yet')
    },
    logout: async (_: unknown, __: unknown, _ctx: GraphQLContext) => {
      throw new Error('Not implemented yet')
    },
  },
}
