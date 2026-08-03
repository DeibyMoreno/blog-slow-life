import { DomainEvent } from './domain-event.js'

export class PostPublishedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly title: string,
    public readonly publishedAt: Date,
  ) {
    super('post.published', aggregateId)
  }
}
