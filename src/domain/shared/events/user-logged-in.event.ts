import { DomainEvent } from './domain-event.js'

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly ipAddress: string | null,
  ) {
    super('user.logged_in', aggregateId)
  }
}
