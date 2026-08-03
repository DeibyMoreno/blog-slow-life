import { DomainEvent } from './domain-event.js'

export class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly roleName: string,
  ) {
    super('user.created', aggregateId)
  }
}
