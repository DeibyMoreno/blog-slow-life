import bcrypt from 'bcrypt'
import type { PasswordHasher } from '../../application/shared/ports/outbound/password-hasher.port.js'

const SALT_ROUNDS = 12

export class PasswordService implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
