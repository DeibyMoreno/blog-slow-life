import { PrismaRoleRepository } from '../../../../../infrastructure/database/repositories/prisma-role.repository.js'
import { Permission, Role } from '../../../../../domain/administration/entities/index.js'
import { UUID } from '../../../../../domain/shared/value-objects/uuid.vo.js'

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
      const permissions = (args.input.permissionIds ?? []).map(
        (id) => new Permission(UUID.from(id), '', '', null, new Date()),
      )
      const role = new Role(
        undefined,
        undefined,
        undefined,
        args.input.name,
        args.input.description ?? null,
        permissions,
      )
      return repo.save(role)
    },
  },
  Role: {
    permissions: (parent: Role) => parent.permissions,
  },
}
