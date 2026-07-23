import type { UserRepository } from '../../shared/ports/outbound/user.repository.js'
import type { PasswordService } from '../../../infrastructure/auth/password.service.js'
import { User } from '../../../domain/administration/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { Email } from '../../../domain/shared/value-objects/email.vo.js'
import { EmailAlreadyExistsError } from '../../../domain/administration/errors/index.js'
import { CreateUserSchema, type CreateUserDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

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

    const hashedPassword = await this.passwordService.hash(data.password)

    const user = new User(
      undefined,
      undefined,
      undefined,
      Email.create(data.email),
      hashedPassword,
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
