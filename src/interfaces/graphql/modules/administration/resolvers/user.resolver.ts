import { PrismaUserRepository } from '../../../../../infrastructure/database/repositories/prisma-user.repository.js'
import { CreateUserUseCase } from '../../../../../application/administration/use-cases/create-user.use-case.js'

const repo = new PrismaUserRepository()
const createUser = new CreateUserUseCase(repo)

export const userResolvers = {
  Query: {
    users: async () => repo.findMany(),
    user: async (_: unknown, args: { id: string }) => repo.findById(args.id),
    me: async (_: unknown, __: unknown, ctx: { user?: unknown }) => {
      return ctx.user
    },
  },
  Mutation: {
    createUser: async (
      _: unknown,
      args: { input: Parameters<CreateUserUseCase['execute']>[0] },
    ) => {
      return createUser.execute(args.input)
    },
  },
  User: {
    fullName: (parent: { firstName: string; lastName: string }) => `${parent.firstName} ${parent.lastName}`
  },
}
