import type { Role } from '../../../../domain/administration/entities/index.js'

export interface RoleRepository {
  findMany(): Promise<Role[]>
  findById(id: string): Promise<Role | null>
  findByName(name: string): Promise<Role | null>
  save(role: Role): Promise<Role>
  delete(id: string): Promise<void>
}
