import type { PrismaClient } from '@prisma/client'
import type { Logger } from 'pino'
import type { User } from '../../domain/administration/entities/index.js'
import DataLoader from 'dataloader'

export interface GraphQLContext {
  requestId: string
  logger: Logger
  prisma: PrismaClient
  user: User | null
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
  return async function buildContext(): Promise<GraphQLContext> {
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
      user: null,
      loaders,
    }
  }
}
