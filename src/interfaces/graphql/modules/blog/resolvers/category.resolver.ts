import type { GraphQLContext } from '../../../context.js'
import { PrismaCategoryRepository } from '../../../../../infrastructure/database/repositories/prisma-category.repository.js'
import { Category } from '../../../../../domain/blog/entities/index.js'
import { Slug } from '../../../../../domain/shared/value-objects/slug.vo.js'

const repo = new PrismaCategoryRepository()

export const categoryResolvers = {
  Query: {
    categories: async () => repo.findMany(),
    category: async (_: unknown, args: { id: string }) => repo.findById(args.id),
  },
  Mutation: {
    createCategory: async (
      _: unknown,
      args: { input: { name: string; description?: string | null } },
    ) => {
      const category = new Category(
        undefined,
        undefined,
        undefined,
        args.input.name,
        Slug.create(args.input.name),
        args.input.description ?? null,
      )
      return repo.save(category)
    },
  },
  Category: {
    posts: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.prisma.post.findMany({
        where: { categoryId: parent.id, deletedAt: null },
      })
    },
  },
}
