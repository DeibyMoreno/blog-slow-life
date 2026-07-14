import type { User } from '../../../../domain/administration/entities/index.js'

export interface UserRepository {
  findMany(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<User>
  update(user: User): Promise<User>
  delete(id: string): Promise<void>
}
