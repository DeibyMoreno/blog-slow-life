import type { TagRepository } from '../../shared/ports/outbound/tag.repository.js'
import { TagNotFoundError } from '../../../domain/blog/errors/index.js'

export class DeleteTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(id: string): Promise<void> {
    const tag = await this.tagRepository.findById(id)
    if (!tag) {
      throw new TagNotFoundError(id)
    }
    await this.tagRepository.delete(id)
  }
}
