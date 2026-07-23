import type { Session } from '../../../../domain/administration/entities/index.js'

export interface SessionRepository {
  save(session: Session): Promise<Session>
  findByRefreshToken(refreshToken: string): Promise<Session | null>
  deleteByRefreshToken(refreshToken: string): Promise<void>
  deleteExpired(): Promise<void>
}