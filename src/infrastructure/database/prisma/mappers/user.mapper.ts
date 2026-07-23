import type { User as PrismaUser, Role as PrismaRole } from '@prisma/client'
import { Permission, Role, User } from '../../../../domain/administration/entities/index.js'
import { UUID } from '../../../../domain/shared/value-objects/uuid.vo.js'
import { Email } from '../../../../domain/shared/value-objects/email.vo.js'

export class UserMapper {
  static toDomain(prismaUser: PrismaUser & { role?: PrismaRole & { permissions?: { id: string; resource: string; action: string; description: string | null; createdAt: Date }[] } }): User {
    const prismaRole = prismaUser.role
    const domainRole = prismaRole
      ? new Role(
        UUID.from(prismaRole.id),
        prismaRole.createdAt,
        prismaRole.updatedAt,
        prismaRole.name,
        prismaRole.description,
        (prismaRole.permissions ?? []).map(
          (p) => new Permission(UUID.from(p.id), p.resource, p.action, p.description, p.createdAt),
        ),
      )
      : null

    return new User(
      UUID.from(prismaUser.id),
      prismaUser.createdAt,
      prismaUser.updatedAt,
      Email.create(prismaUser.email),
      prismaUser.passwordHash,
      prismaUser.firstName,
      prismaUser.lastName,
      prismaUser.avatarUrl,
      prismaUser.isActive,
      UUID.from(prismaUser.roleId),
      prismaUser.deletedAt,
      domainRole,
    )
  }

  static toPrisma(domainUser: User): PrismaUser {
    return {
      id: domainUser.id.toString(),
      email: domainUser.email.toString(),
      passwordHash: domainUser.passwordHash,
      firstName: domainUser.firstName,
      lastName: domainUser.lastName,
      avatarUrl: domainUser.avatarUrl,
      isActive: domainUser.isActive,
      roleId: domainUser.roleId.toString(),
      deletedAt: domainUser.deletedAt,
      createdAt: domainUser.createdAt,
      updatedAt: domainUser.updatedAt,
    } as PrismaUser
  }
}
