import type { CreateTagDTO } from '../../../blog/dto/index.js'

export interface CreateTagUseCasePort {
  execute(input: CreateTagDTO): Promise<unknown>
}

export interface DeleteTagUseCasePort {
  execute(id: string): Promise<void>
}

export interface GetTagsUseCasePort {
  execute(): Promise<unknown[]>
}
