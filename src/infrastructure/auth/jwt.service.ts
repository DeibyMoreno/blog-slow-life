import { SignJWT, jwtVerify } from 'jose'
import { env } from '../../config/env.js'

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET)
const REFRESH_SECRET = new TextEncoder().encode(env.REFRESH_TOKEN_SECRET)

export interface AccessTokenPayload {
  sub: string
  role: string
}

export interface RefreshTokenPayload {
  sub: string
  jti: string
}

export class JWTService {
  async signAccessToken(userId: string, role: string): Promise<string> {
    return new SignJWT({ sub: userId, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(env.JWT_EXPIRES_IN)
      .setIssuer('slowlife-blog')
      .sign(JWT_SECRET)
  }

  async signRefreshToken(userId: string, sessionId: string): Promise<string> {
    return new SignJWT({ sub: userId, jti: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(env.REFRESH_TOKEN_EXPIRES_IN)
      .setIssuer('slowlife-blog')
      .sign(REFRESH_SECRET)
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'slowlife-blog',
    })
    return payload as unknown as AccessTokenPayload
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const { payload } = await jwtVerify(token, REFRESH_SECRET, {
      issuer: 'slowlife-blog',
    })
    return payload as unknown as RefreshTokenPayload
  }
}
