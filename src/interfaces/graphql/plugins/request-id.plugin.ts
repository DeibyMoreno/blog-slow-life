import type { Plugin } from 'graphql-yoga'
import { v4 as uuidv4 } from 'uuid'

export function useRequestId(): Plugin {
  return {
    onParse({ context }) {
      (context as Record<string, unknown>).requestId = uuidv4()
    },
  }
}
