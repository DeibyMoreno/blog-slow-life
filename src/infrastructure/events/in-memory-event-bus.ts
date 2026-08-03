import type { DomainEvent } from '../../domain/shared/events/domain-event.js'
import type { EventBus } from '../../application/shared/ports/outbound/event-bus.port.js'
import { logger } from '@infrastructure/logging/pino.instance.js'

type EventHandler = (event: DomainEvent) => void | Promise<void>

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, EventHandler[]>()

  subscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName) ?? []
    handlers.push(handler)
    this.handlers.set(eventName, handlers)
  }

  publish(event: DomainEvent): void {
    const handlers = this.handlers.get(event.eventName) ?? []
    for (const handler of handlers) {
      Promise.resolve(handler(event)).catch((err) => {
        logger.error(err, `[EventBus] Error handling ${event.eventName}:`)
      })
    }
  }

  publishAll(events: DomainEvent[]): void {
    for (const event of events) {
      this.publish(event)
    }
  }
}
