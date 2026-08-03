import { container } from '../../../../../infrastructure/container/container.js'
import type { CreateUserDTO } from '../../../../../application/administration/dto/index.js'
import type { GraphQLContext } from '../../../context.js'

export const userResolvers = {
  Query: {
    users: async () => container.userRepository.findMany(),
    user: async (_: unknown, args: { id: string }) => container.userRepository.findById(args.id),
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      return container.getMeUseCase.execute({ userId: ctx.user!.id.toString() })
    },
  },
  Mutation: {
    createUser: async (_: unknown, args: { input: CreateUserDTO }) => {
      return container.createUserUseCase.execute(args.input)
    },
  },
  User: {
    fullName: (parent: { firstName: string; lastName: string }) => `${parent.firstName} ${parent.lastName}`
  },
}
