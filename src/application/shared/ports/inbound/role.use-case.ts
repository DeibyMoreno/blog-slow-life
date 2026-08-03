import type { CreateRoleDTO } from '../../../administration/dto/index.js'

export interface CreateRoleUseCasePort {
  execute(input: CreateRoleDTO): Promise<unknown>
}
