import type { UserRepository } from '../../../application/shared/ports/outbound/user.repository.js'
import type { User } from '../../../domain/administration/entities/index.js'
import { UserMapper } from '../prisma/mappers/user.mapper.js'
import { prismaClient } from '../prisma/client.js'

export class PrismaUserRepository implements UserRepository {
  async findMany(): Promise<User[]> {
    const users = await prismaClient.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return users.map(UserMapper.toDomain)
  }

  async findById(id: string): Promise<User | null> {
    const user = await prismaClient.user.findFirst({
      where: { id, deletedAt: null },
    })
    return user ? UserMapper.toDomain(user) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prismaClient.user.findFirst({
      where: { email, deletedAt: null },
    })
    return user ? UserMapper.toDomain(user) : null
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPrisma(user)
    const created = await prismaClient.user.create({ data })
    return UserMapper.toDomain(created)
  }

  async update(user: User): Promise<User> {
    const data = UserMapper.toPrisma(user)
    const updated = await prismaClient.user.update({
      where: { id: user.id.toString() },
      data,
    })
    return UserMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await prismaClient.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
