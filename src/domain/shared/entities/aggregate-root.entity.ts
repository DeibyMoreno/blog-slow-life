import type { DomainEvent } from '../events/domain-event.js'
import { BaseEntity } from './base.entity.js'

export abstract class AggregateRoot extends BaseEntity {
  private _domainEvents: DomainEvent[] = []

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  public clearEvents(): DomainEvent[] {
    const events = [...this._domainEvents]
    this._domainEvents = []
    return events
  }
}
