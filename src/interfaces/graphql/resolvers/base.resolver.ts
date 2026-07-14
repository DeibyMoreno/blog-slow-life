import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let pkgVersion = '0.0.0'
try {
  const pkgPath = resolve(__dirname, '..', '..', '..', '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkgVersion = pkg.version
} catch {
  pkgVersion = '0.0.0'
}

export const resolvers = {
  Query: {
    health: () => ({
      status: 'ok',
      timestamp: new Date(),
      version: pkgVersion,
      uptime: process.uptime(),
    }),
  },
  Mutation: {},
}
