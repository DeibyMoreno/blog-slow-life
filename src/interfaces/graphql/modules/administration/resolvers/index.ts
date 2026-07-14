import { userResolvers } from './user.resolver.js'
import { roleResolvers } from './role.resolver.js'
import { authResolvers } from './auth.resolver.js'

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...roleResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...roleResolvers.Mutation,
    ...authResolvers.Mutation,
  },
  User: userResolvers.User,
  Role: roleResolvers.Role,
}
