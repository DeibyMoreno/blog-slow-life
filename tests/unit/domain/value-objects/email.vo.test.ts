import { describe, it, expect } from 'vitest'
import { Email, InvalidEmailError } from '../../../../src/domain/shared/value-objects/email.vo.js'

describe('Email Value Object', () => {
  it('should create from a valid email', () => {
    const email = Email.create('test@example.com')
    expect(email.value).toBe('test@example.com')
  })

  it('should throw on invalid email', () => {
    expect(() => Email.create('not-an-email')).toThrow(InvalidEmailError)
  })

  it('should throw on empty email', () => {
    expect(() => Email.create('')).toThrow()
  })

  it('should compare equality', () => {
    const email1 = Email.create('test@example.com')
    const email2 = Email.create('test@example.com')
    expect(email1.equals(email2)).toBe(true)
  })

  it('should detect inequality', () => {
    const email1 = Email.create('test1@example.com')
    const email2 = Email.create('test2@example.com')
    expect(email1.equals(email2)).toBe(false)
  })
})
