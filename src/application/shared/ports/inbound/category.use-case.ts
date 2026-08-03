import type { CreateCategoryDTO, UpdateCategoryDTO } from '../../../blog/dto/index.js'

export interface CreateCategoryUseCasePort {
  execute(input: CreateCategoryDTO): Promise<unknown>
}

export interface UpdateCategoryUseCasePort {
  execute(id: string, input: UpdateCategoryDTO): Promise<unknown>
}

export interface DeleteCategoryUseCasePort {
  execute(id: string): Promise<void>
}

export interface GetCategoriesUseCasePort {
  execute(): Promise<unknown[]>
}
