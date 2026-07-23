import type { SessionRepository } from '../../../application/shared/ports/outbound/session.repository.js'
import type { Session } from '../../../domain/administration/entities/index.js'
import { SessionMapper } from '../prisma/mappers/session.mapper.js'
import { prismaClient } from '../prisma/client.js'

export class PrismaSessionRepository implements SessionRepository {
  async save(session: Session): Promise<Session> {
    const data = SessionMapper.toPrisma(session)
    const created = await prismaClient.session.create({ data })
    return SessionMapper.toDomain(created)
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const session = await prismaClient.session.findUnique({
      where: { refreshToken },
    })
    return session ? SessionMapper.toDomain(session) : null
  }

  async deleteByRefreshToken(refreshToken: string): Promise<void> {
    await prismaClient.session.deleteMany({
      where: { refreshToken },
    })
  }

  async deleteExpired(): Promise<void> {
    await prismaClient.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  }
}