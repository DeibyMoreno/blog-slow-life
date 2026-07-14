import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import { PostNotFoundError } from '../../../domain/blog/errors/index.js'
import { UpdatePostSchema, type UpdatePostDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class UpdatePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string, input: UpdatePostDTO) {
    const parsed = UpdatePostSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const post = await this.postRepository.findById(id)
    if (!post) {
      throw new PostNotFoundError(id)
    }

    const data = parsed.data
    if (data.title !== undefined) post.title = data.title
    if (data.content !== undefined) post.content = data.content
    if (data.excerpt !== undefined) post.excerpt = data.excerpt
    if (data.coverImage !== undefined) post.coverImage = data.coverImage
    if (data.status !== undefined) post.status = data.status

    post.touch()

    return this.postRepository.update(post)
  }
}
