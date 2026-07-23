import type { Session as PrismaSession } from '@prisma/client'
import { Session } from '../../../../domain/administration/entities/index.js'
import { UUID } from '../../../../domain/shared/value-objects/uuid.vo.js'

export class SessionMapper {
  static toDomain(prismaSession: PrismaSession): Session {
    return new Session(
      UUID.from(prismaSession.id),
      prismaSession.createdAt,
      prismaSession.createdAt,
      UUID.from(prismaSession.userId),
      prismaSession.refreshToken,
      prismaSession.ipAddress,
      prismaSession.userAgent,
      prismaSession.expiresAt,
    )
  }

  static toPrisma(session: Session): Omit<PrismaSession, 'createdAt' | 'user'> {
    return {
      id: session.id.toString(),
      userId: session.userId.toString(),
      refreshToken: session.refreshToken,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
    }
  }
}