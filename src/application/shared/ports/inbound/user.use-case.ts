import type { CreateUserDTO, GetMeDTO } from '../../../administration/dto/index.js'

export interface CreateUserUseCasePort {
  execute(input: CreateUserDTO): Promise<unknown>
}

export interface GetMeUseCasePort {
  execute(input: GetMeDTO): Promise<unknown>
}
