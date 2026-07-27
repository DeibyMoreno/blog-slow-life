import type { Plugin } from 'graphql-yoga'
import { v4 as uuidv4 } from 'uuid'

export function useRequestId(): Plugin {
  return {
    onParse({ context }) {
      const ctx = context as Record<string, unknown>
      const request = ctx.request as { id?: string } | undefined
      ctx.requestId = request?.id ?? uuidv4()
    },
  }
}
