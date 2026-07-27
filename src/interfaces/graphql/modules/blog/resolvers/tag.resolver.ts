import type { GraphQLContext } from '../../../context.js'
import { container } from '../../../../../infrastructure/container/container.js'

const { createTagUseCase, deleteTagUseCase, getTagsUseCase, tagRepository } = container

export const tagResolvers = {
  Query: {
    tags: async () => getTagsUseCase.execute(),
    tag: async (_: unknown, args: { id: string }) => tagRepository.findById(args.id),
    tagBySlug: async (_: unknown, args: { slug: string }) => tagRepository.findBySlug(args.slug),
  },
  Mutation: {
    createTag: async (_: unknown, args: { input: { name: string } }) => {
      return createTagUseCase.execute(args.input)
    },
    deleteTag: async (_: unknown, args: { id: string }) => {
      await deleteTagUseCase.execute(args.id)
      return true
    },
  },
  Tag: {
    posts: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.postsByTagId.load(parent.id.toString())
    },
  },
}
