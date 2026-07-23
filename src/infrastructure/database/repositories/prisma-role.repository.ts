import type { RoleRepository } from '../../../application/shared/ports/outbound/role.repository.js'
import { Permission, Role } from '../../../domain/administration/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { prismaClient } from '../prisma/client.js'

export class PrismaRoleRepository implements RoleRepository {
  async findMany(): Promise<Role[]> {
    const roles = await prismaClient.role.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: true },
    })

    return roles.map((role) => this.toDomain(role))
  }

  async findById(id: string): Promise<Role | null> {
    const role = await prismaClient.role.findUnique({
      where: { id },
      include: { permissions: true },
    })
    return role ? this.toDomain(role) : null
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await prismaClient.role.findUnique({
      where: { name },
      include: { permissions: true },
    })
    return role ? this.toDomain(role) : null
  }

  async save(role: Role): Promise<Role> {
    const created = await prismaClient.role.create({
      data: {
        id: role.id.toString(),
        name: role.name,
        description: role.description,
        permissions: {
          connect: role.permissions.map((p) => ({ id: p.id.toString() })),
        },
      },
      include: { permissions: true },
    })
    return this.toDomain(created)
  }

  async delete(id: string): Promise<void> {
    await prismaClient.role.delete({ where: { id } })
  }

  private toDomain(prismaRole: {
    id: string
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
    permissions: { id: string; resource: string; action: string; description: string | null; createdAt: Date }[]
  }): Role {
    return new Role(
      UUID.from(prismaRole.id),
      prismaRole.createdAt,
      prismaRole.updatedAt,
      prismaRole.name,
      prismaRole.description,
      prismaRole.permissions?.map((p) => this.permissionToDomain(p)),
    )
  }

  private permissionToDomain(prismaPermission: {
    id: string
    resource: string
    action: string
    description: string | null
    createdAt: Date
  }): Permission {
    return new Permission(
      UUID.from(prismaPermission.id),
      prismaPermission.resource,
      prismaPermission.action,
      prismaPermission.description,
      prismaPermission.createdAt,
    )
  }
}
