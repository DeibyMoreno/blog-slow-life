import type { UserRepository } from '../../shared/ports/outbound/user.repository.js'
import type { PasswordHasher } from '../../shared/ports/outbound/password-hasher.port.js'
import type { EventBus } from '../../shared/ports/outbound/event-bus.port.js'
import { User } from '../../../domain/administration/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { Email } from '../../../domain/shared/value-objects/email.vo.js'
import { EmailAlreadyExistsError } from '../../../domain/administration/errors/index.js'
import { CreateUserSchema, type CreateUserDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
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

    const hashedPassword = await this.passwordHasher.hash(data.password)

    const user = User.create({
      email: Email.create(data.email),
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      roleId: UUID.from(data.roleId),
    })

    const events = user.clearEvents()
    const saved = await this.userRepository.save(user)
    this.eventBus.publishAll(events)

    return saved
  }
}
