import type { Role } from '../../../../../domain/administration/entities/index.js'
import { container } from '@infrastructure/container/container.js'

export const roleResolvers = {
  Query: {
    roles: async () => container.roleRepository.findMany(),
    role: async (_: unknown, args: { id: string }) => container.roleRepository.findById(args.id),
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
