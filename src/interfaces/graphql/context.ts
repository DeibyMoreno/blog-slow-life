import type { PrismaClient } from '@prisma/client'
import type { Logger } from 'pino'
import type { User } from '../../domain/administration/entities/index.js'
import DataLoader from 'dataloader'
import { JWTService } from '../../infrastructure/auth/jwt.service.js'
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository.js'

const jwtService = new JWTService()
const userRepository = new PrismaUserRepository()

export interface GraphQLContext {
  requestId: string
  logger: Logger
  prisma: PrismaClient
  user: User | null
  request?: Request
  loaders: {
    user: DataLoader<string, unknown>
    post: DataLoader<string, unknown>
    category: DataLoader<string, unknown>
  }
}

export interface ContextFactoryParams {
  requestId: string
  logger: Logger
  prisma: PrismaClient
}

export function createContextFactory(params: ContextFactoryParams) {
  return async function buildContext(request: Request): Promise<GraphQLContext> {
    let user: User | null = null

    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      try {
        const payload = await jwtService.verifyAccessToken(token)
        const found = await userRepository.findById(payload.sub)
        if (found && found.isActive && !found.isDeleted()) {
          user = found
        }
      } catch {
        // Handle token verification errors
      }
    }

    const loaders = {
      user: new DataLoader<string, unknown>(async (ids) => {
        const users = await params.prisma.user.findMany({
          where: { id: { in: [...ids] } },
        })
        return ids.map((id) => users.find((u) => u.id === id) ?? null)
      }),
      post: new DataLoader<string, unknown>(async (ids) => {
        const posts = await params.prisma.post.findMany({
          where: { id: { in: [...ids] } },
        })
        return ids.map((id) => posts.find((p) => p.id === id) ?? null)
      }),
      category: new DataLoader<string, unknown>(async (ids) => {
        const categories = await params.prisma.category.findMany({
          where: { id: { in: [...ids] } },
        })
        return ids.map((id) => categories.find((c) => c.id === id) ?? null)
      }),
    }

    return {
      requestId: params.requestId,
      logger: params.logger.child({ requestId: params.requestId }),
      prisma: params.prisma,
      user,
      request,
      loaders,
    }
  }
}