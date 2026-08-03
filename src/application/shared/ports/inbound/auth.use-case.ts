import type { LoginDTO } from '../../../administration/dto/index.js'

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: unknown
}

export interface AuthUseCase {
  execute(input: LoginDTO, metadata?: { ipAddress?: string; userAgent?: string }): Promise<LoginResult>
}
