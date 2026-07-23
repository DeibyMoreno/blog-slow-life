import { PrismaRoleRepository } from '../../../../../infrastructure/database/repositories/prisma-role.repository.js'
import type { Role } from '../../../../../domain/administration/entities/index.js'
import { container } from '@infrastructure/container/container.js'

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
      return container.createRoleUseCase.execute(args.input)
    },
  },
  Role: {
    permissions: (parent: Role) => parent.permissions,
  },
}
