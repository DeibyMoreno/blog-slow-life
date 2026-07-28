import type { GraphQLContext } from '../../../context.js'
import type { PostStatus } from '../../../../../domain/shared/types/index.js'
import type { CreatePostDTO, UpdatePostDTO } from '../../../../../application/blog/dto/index.js'
import { container } from '../../../../../infrastructure/container/container.js'

const {
  createPostUseCase,
  getPostsUseCase,
  getPostBySlugUseCase,
  updatePostUseCase,
  deletePostUseCase,
  postRepository,
} = container

export const postResolvers = {
  Query: {
    posts: async (_: unknown, args: { limit?: number; offset?: number; status?: string }, _ctx: GraphQLContext) => {
      const { posts } = await getPostsUseCase.execute({
        limit: args.limit,
        offset: args.offset,
        status: args.status as PostStatus | undefined,
      })
      return posts
    },
    post: async (_: unknown, args: { id: string }, _ctx: GraphQLContext) => {
      return postRepository.findById(args.id)
    },
    postBySlug: async (_: unknown, args: { slug: string }, _ctx: GraphQLContext) => {
      return getPostBySlugUseCase.execute(args.slug)
    },
  },
  Mutation: {
    createPost: async (
      _: unknown,
      args: { input: CreatePostDTO },
      ctx: GraphQLContext,
    ) => {
      return createPostUseCase.execute(args.input, ctx.user!.id.toString())
    },
    updatePost: async (
      _: unknown,
      args: { id: string; input: UpdatePostDTO },
      _ctx: GraphQLContext,
    ) => {
      return updatePostUseCase.execute(args.id, args.input)
    },
    deletePost: async (_: unknown, args: { id: string }, _ctx: GraphQLContext) => {
      await deletePostUseCase.execute(args.id)
      return true
    },
  },
  Post: {
    author: async (parent: { authorId: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.user.load(parent.authorId.toString())
    },
    category: async (parent: { categoryId: string | null }, _args: unknown, ctx: GraphQLContext) => {
      if (!parent.categoryId) return null
      return ctx.loaders.category.load(parent.categoryId.toString())
    },
    tags: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.tagsByPostId.load(parent.id.toString())
    },
  },
}
