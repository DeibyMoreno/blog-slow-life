import type { UserRepository } from '../../shared/ports/outbound/user.repository.js'
import { User } from '../../../domain/administration/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { Email } from '../../../domain/shared/value-objects/email.vo.js'
import { EmailAlreadyExistsError } from '../../../domain/administration/errors/index.js'
import { CreateUserSchema, type CreateUserDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserDTO) {
    const parsed = CreateUserSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const data = parsed.data
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) {
      throw new EmailAlreadyExistsError(data.email)
    }

    const user = new User(
      undefined,
      undefined,
      undefined,
      Email.create(data.email),
      data.password,
      data.firstName,
      data.lastName,
      null,
      true,
      UUID.from(data.roleId),
      null,
    )

    return this.userRepository.save(user)
  }
}
