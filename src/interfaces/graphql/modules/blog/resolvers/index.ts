import { postResolvers } from './post.resolver.js'
import { categoryResolvers } from './category.resolver.js'
import { tagResolvers } from './tag.resolver.js'

export const resolvers = {
  Query: {
    ...postResolvers.Query,
    ...categoryResolvers.Query,
    ...tagResolvers.Query,
  },
  Mutation: {
    ...postResolvers.Mutation,
    ...categoryResolvers.Mutation,
    ...tagResolvers.Mutation,
  },
  Post: postResolvers.Post,
  Category: categoryResolvers.Category,
}
