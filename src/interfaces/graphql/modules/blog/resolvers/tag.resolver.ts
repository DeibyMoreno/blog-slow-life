import { PrismaTagRepository } from '../../../../../infrastructure/database/repositories/prisma-tag.repository.js'

const repo = new PrismaTagRepository()

export const tagResolvers = {
  Query: {
    tags: async () => repo.findMany(),
    tag: async (_: unknown, args: { id: string }) => repo.findById(args.id),
  },
  Mutation: {
    createTag: async (_: unknown, args: { input: { name: string } }) => {
      const { UUID } = await import('../../../../../domain/shared/value-objects/uuid.vo.js')
      const { Slug } = await import('../../../../../domain/shared/value-objects/slug.vo.js')
      const tag = {
        id: UUID.create(),
        name: args.input.name,
        slug: Slug.create(args.input.name),
        createdAt: new Date(),
      }
      return repo.save(tag)
    },
  },
}
