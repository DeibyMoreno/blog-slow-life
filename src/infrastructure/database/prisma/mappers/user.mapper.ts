import type { User as PrismaUser } from '@prisma/client'
import { User } from '../../../../domain/administration/entities/index.js'
import { UUID } from '../../../../domain/shared/value-objects/uuid.vo.js'
import { Email } from '../../../../domain/shared/value-objects/email.vo.js'

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
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
