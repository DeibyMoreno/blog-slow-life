import { createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'
import { schema } from '../../src/interfaces/graphql/schema.js'

export function createTestServer() {
  const yoga = createYoga({
    schema,
    logging: false,
    maskedErrors: false,
  })

  const server = createServer(yoga)

  return {
    yoga,
    server,
    url: `http://localhost:${(server.address() as { port: number })?.port ?? 0}`,
  }
}
