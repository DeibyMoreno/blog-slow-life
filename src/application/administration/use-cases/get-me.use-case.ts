import type { UserRepository } from '../../shared/ports/outbound/user.repository.js'
import type { GetMeDTO } from '../dto/index.js'
import { GetMeSchema } from '../dto/index.js'
import { UserNotFoundError } from '../../../domain/administration/errors/index.js'
import { ValidationError, UnauthorizedError } from '../../../domain/shared/errors/index.js'

export class GetMeUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GetMeDTO) {
    const parsed = GetMeSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const { userId } = parsed.data
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    if (!user.isActive || user.isDeleted()) {
      throw new UnauthorizedError('User account is inactive or deleted')
    }

    return user
  }
}