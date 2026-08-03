import type { DomainEvent } from '../../../../domain/shared/events/domain-event.js'

export interface EventBus {
  publish(event: DomainEvent): void
  publishAll(events: DomainEvent[]): void
}
