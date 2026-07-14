import type { GraphQLContext } from '../../../context.js'
import type { PostStatus } from '../../../../../domain/shared/types/index.js'
import { PrismaPostRepository } from '../../../../../infrastructure/database/repositories/prisma-post.repository.js'
import { CreatePostUseCase } from '../../../../../application/blog/use-cases/create-post.use-case.js'
import { GetPostsUseCase } from '../../../../../application/blog/use-cases/get-posts.use-case.js'
import { GetPostBySlugUseCase } from '../../../../../application/blog/use-cases/get-post-by-slug.use-case.js'
import { UpdatePostUseCase } from '../../../../../application/blog/use-cases/update-post.use-case.js'
import { DeletePostUseCase } from '../../../../../application/blog/use-cases/delete-post.use-case.js'

const repo = new PrismaPostRepository()
const createPost = new CreatePostUseCase(repo)
const getPosts = new GetPostsUseCase(repo)
const getPostBySlug = new GetPostBySlugUseCase(repo)
const updatePost = new UpdatePostUseCase(repo)
const deletePost = new DeletePostUseCase(repo)

export const postResolvers = {
  Query: {
    posts: async (_: unknown, args: { limit?: number; offset?: number; status?: string }, _ctx: GraphQLContext) => {
      const { posts } = await getPosts.execute({
        limit: args.limit,
        offset: args.offset,
        status: args.status as PostStatus | undefined,
      })
      return posts
    },
    post: async (_: unknown, args: { id: string }, _ctx: GraphQLContext) => {
      return repo.findById(args.id)
    },
    postBySlug: async (_: unknown, args: { slug: string }, _ctx: GraphQLContext) => {
      return getPostBySlug.execute(args.slug)
    },
  },
  Mutation: {
    createPost: async (_: unknown, args: { input: Parameters<CreatePostUseCase['execute']>[0] }, _ctx: GraphQLContext) => {
      return createPost.execute(args.input)
    },
    updatePost: async (
      _: unknown,
      args: { id: string; input: Parameters<UpdatePostUseCase['execute']>[1] },
      _ctx: GraphQLContext,
    ) => {
      return updatePost.execute(args.id, args.input)
    },
    deletePost: async (_: unknown, args: { id: string }, _ctx: GraphQLContext) => {
      await deletePost.execute(args.id)
      return true
    },
  },
  Post: {
    author: async (parent: { authorId: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.user.load(parent.authorId)
    },
    category: async (parent: { categoryId: string | null }, _args: unknown, ctx: GraphQLContext) => {
      if (!parent.categoryId) return null
      return ctx.loaders.category.load(parent.categoryId)
    },
    tags: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: parent.id },
        include: { tags: true },
      })
      return post?.tags ?? []
    },
  },
}
