import type { GraphQLContext } from '../../../context.js'
import { container } from '../../../../../infrastructure/container/container.js'

const {
  createCategoryUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase,
  getCategoriesUseCase,
  categoryRepository,
} = container

export const categoryResolvers = {
  Query: {
    categories: async () => getCategoriesUseCase.execute(),
    category: async (_: unknown, args: { id: string }) => categoryRepository.findById(args.id),
  },
  Mutation: {
    createCategory: async (_: unknown, args: { input: { name: string; description?: string | null } }) => {
      return createCategoryUseCase.execute(args.input)
    },
    updateCategory: async (
      _: unknown,
      args: { id: string; input: { name?: string; description?: string | null } },
    ) => {
      return updateCategoryUseCase.execute(args.id, args.input)
    },
    deleteCategory: async (_: unknown, args: { id: string }) => {
      await deleteCategoryUseCase.execute(args.id)
      return true
    },
  },
  Category: {
    posts: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.postsByCategoryId.load(parent.id.toString())
    },
  },
}
