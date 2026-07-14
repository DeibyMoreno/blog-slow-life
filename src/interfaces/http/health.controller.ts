import { Router } from 'express'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let pkgVersion = '0.0.0'
try {
  const pkgPath = resolve(__dirname, '..', '..', '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkgVersion = pkg.version
} catch {
  pkgVersion = '0.0.0'
}

function createHealthRouter(): Router {
  const router = Router()

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: pkgVersion,
      uptime: process.uptime(),
    })
  })

  router.get('/version', (_req, res) => {
    res.json({
      version: pkgVersion,
      name: '@slowlife/blog-backend',
      nodeVersion: process.version,
    })
  })

  return router
}

export const healthRouter = createHealthRouter()
