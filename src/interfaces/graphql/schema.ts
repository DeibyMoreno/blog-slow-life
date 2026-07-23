import { mergeTypeDefs } from '@graphql-tools/merge'
import { loadFilesSync } from '@graphql-tools/load-files'
import { createSchema } from 'graphql-yoga'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DateTimeScalar } from './scalars/datetime.scalar.js'
import { EmailScalar } from './scalars/email.scalar.js'
import { UUIDScalar } from './scalars/uuid.scalar.js'
import { resolvers as baseResolvers } from './resolvers/base.resolver.js'
import { resolvers as blogResolvers } from './modules/blog/resolvers/index.js'
import { resolvers as adminResolvers } from './modules/administration/resolvers/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, './typeDefs/**/*.graphql')),
)

const { Query: _bQ, Mutation: _bM, ...blogTypeResolvers } = blogResolvers
const { Query: _aQ, Mutation: _aM, ...adminTypeResolvers } = adminResolvers

export const schema = createSchema({
  typeDefs,
  resolvers: {
    DateTime: DateTimeScalar,
    UUID: UUIDScalar,
    Email: EmailScalar,
    Query: {
      ...baseResolvers.Query,
      ...blogResolvers.Query,
      ...adminResolvers.Query,
    },
    Mutation: {
      ...baseResolvers.Mutation,
      ...blogResolvers.Mutation,
      ...adminResolvers.Mutation,
    },
    ...blogTypeResolvers,
    ...adminTypeResolvers,
  },
})
