import type { TagRepository } from '../../shared/ports/outbound/tag.repository.js'

export class GetTagsUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute() {
    return this.tagRepository.findMany()
  }
}
