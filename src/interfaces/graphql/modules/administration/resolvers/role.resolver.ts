import type { GraphQLContext } from '../../../context.js'
import { PrismaRoleRepository } from '../../../../../infrastructure/database/repositories/prisma-role.repository.js'
import { Role } from '../../../../../domain/administration/entities/index.js'

const repo = new PrismaRoleRepository()

export const roleResolvers = {
  Query: {
    roles: async () => repo.findMany(),
    role: async (_: unknown, args: { id: string }) => repo.findById(args.id),
  },
  Mutation: {
    createRole: async (
      _: unknown,
      args: { input: { name: string; description?: string | null; permissionIds?: string[] } },
    ) => {
      const role = new Role(
        undefined,
        undefined,
        undefined,
        args.input.name,
        args.input.description ?? null,
      )
      return repo.save(role)
    },
  },
  Role: {
    permissions: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.prisma.permission.findMany({
        where: { roles: { some: { id: parent.id } } },
      })
    },
  },
}
