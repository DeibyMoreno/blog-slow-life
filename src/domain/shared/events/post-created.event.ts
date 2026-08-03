import { DomainEvent } from './domain-event.js'

export class PostCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly title: string,
    public readonly authorId: string,
  ) {
    super('post.created', aggregateId)
  }
}
