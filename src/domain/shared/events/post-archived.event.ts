import { DomainEvent } from './domain-event.js'

export class PostArchivedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly title: string,
    public readonly archivedAt: Date,
  ) {
    super('post.archived', aggregateId)
  }
}
