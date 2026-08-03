export interface TokenService {
  signAccessToken(userId: string, role: string): Promise<string>
  signRefreshToken(userId: string, sessionId: string): Promise<string>
  verifyAccessToken(token: string): Promise<{ sub: string; role: string }>
}
