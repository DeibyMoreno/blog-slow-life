import type { UserRepository } from '../../shared/ports/outbound/user.repository.js'
import type { SessionRepository } from '../../shared/ports/outbound/session.repository.js'
import type { PasswordHasher } from '../../shared/ports/outbound/password-hasher.port.js'
import type { TokenService } from '../../shared/ports/outbound/token-service.port.js'
import type { EventBus } from '../../shared/ports/outbound/event-bus.port.js'
import { LoginSchema, type LoginDTO } from '../dto/index.js'
import { InvalidCredentialsError } from '../../../domain/administration/errors/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'
import { Session } from '../../../domain/administration/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { UserLoggedInEvent } from '../../../domain/shared/events/user-logged-in.event.js'

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly eventBus: EventBus,
  ) { }

  async execute(input: LoginDTO, metadata?: { ipAddress?: string; userAgent?: string }) {
    const parsed = LoginSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const { email, password } = parsed.data

    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new InvalidCredentialsError()
    }

    if (!user.isActive || user.isDeleted()) {
      throw new InvalidCredentialsError()
    }

    const isValid = await this.passwordHasher.compare(password, user.passwordHash)
    if (!isValid) {
      throw new InvalidCredentialsError()
    }

    const accessToken = await this.tokenService.signAccessToken(
      user.id.toString(),
      user.role?.name ?? 'VIEWER',
    )
    const sessionId = UUID.create()
    const refreshToken = await this.tokenService.signRefreshToken(
      user.id.toString(),
      sessionId.toString(),
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const session = Session.create({
      userId: user.id,
      refreshToken,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      expiresAt,
    })
    await this.sessionRepository.save(session)

    this.eventBus.publish(new UserLoggedInEvent(
      user.id.toString(),
      user.email.toString(),
      metadata?.ipAddress ?? null,
    ))

    return {
      accessToken,
      refreshToken,
      user,
    }
  }
}
