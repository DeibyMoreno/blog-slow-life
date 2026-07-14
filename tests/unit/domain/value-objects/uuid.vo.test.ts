import { describe, it, expect } from 'vitest'
import { UUID, InvalidUUIDError } from '../../../../src/domain/shared/value-objects/uuid.vo.js'

describe('UUID Value Object', () => {
  it('should create a valid UUID', () => {
    const uuid = UUID.create()
    expect(uuid.value).toBeDefined()
    expect(uuid.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('should create from a valid UUID string', () => {
    const value = '550e8400-e29b-41d4-a716-446655440000'
    const uuid = UUID.from(value)
    expect(uuid.value).toBe(value)
  })

  it('should throw on invalid UUID string', () => {
    expect(() => UUID.from('not-a-uuid')).toThrow(InvalidUUIDError)
  })

  it('should compare equality', () => {
    const value = '550e8400-e29b-41d4-a716-446655440000'
    const uuid1 = UUID.from(value)
    const uuid2 = UUID.from(value)
    expect(uuid1.equals(uuid2)).toBe(true)
  })

  it('should detect inequality', () => {
    const uuid1 = UUID.create()
    const uuid2 = UUID.create()
    expect(uuid1.equals(uuid2)).toBe(false)
  })
})
