# AGENTS.md — Blog Slow Life Backend

## Commands

```bash
pnpm install              # install deps (pnpm, NOT npm); runs husky prepare
pnpm dev                  # dev server (tsx watch, port 4000)
pnpm build                # tsc -p tsconfig.build.json + tsc-alias + copyfiles → dist/
pnpm start                # node dist/index.js

pnpm lint                 # ESLint src/
pnpm lint:fix             # ESLint --fix
pnpm format               # Prettier src/
pnpm typecheck            # tsc --noEmit

pnpm test                 # vitest run (requires PostgreSQL)
pnpm test:watch           # vitest watch
pnpm test:coverage        # vitest run --coverage (v8)

pnpm db:generate          # prisma generate
pnpm db:migrate           # prisma migrate dev
pnpm db:reset             # prisma migrate reset
pnpm db:seed              # tsx prisma/seed.ts
```

**Verification order:** `pnpm lint → pnpm typecheck → pnpm test`
**Pre-commit hook** runs `npm test` (note: uses npm, not pnpm); commit-msg hook runs commitlint.

## Architecture (Hexagonal + DDD)

```
interfaces → application → domain
        ↘ infrastructure ↗
```

Layer responsibilities:
- **`src/config/`** — Env loading, module configs (server, database, logger).
- **`src/domain/`** — Entities, value objects, enums, errors. Zero external deps.
- **`src/application/`** — Use cases + repository port interfaces (`shared/ports/outbound/`). No infra imports.
- **`src/infrastructure/`** — Prisma repositories, mappers, config (HTTP middleware), auth (JWT, password), logging, DI container.
- **`src/interfaces/`** — GraphQL (resolvers, typeDefs, context, scalars, plugins, modules) + HTTP (health).

### Path aliases (tsconfig + vitest resolve.alias)

`@config/`, `@domain/`, `@application/`, `@infrastructure/`, `@interfaces/`

### GraphQL

- **graphql-yoga** with `@envelop/graphql-jit`
- **Schema-first:** `.graphql` files in `src/interfaces/graphql/typeDefs/` loaded by `@graphql-tools/load-files`
- **Modules:** `src/interfaces/graphql/modules/{blog,administration}/` each have `resolvers/`, `typeDefs/`, `loaders/` (per-module `typeDefs/` and `loaders/` are unused; actual typeDefs live in `src/interfaces/graphql/typeDefs/` and loaders are constructed inline in `context.ts`)
- **Wiring:** `src/interfaces/graphql/schema.ts` merges typeDefs and spreads resolvers from `base.resolver.ts` + module index files
- **Context:** `src/interfaces/graphql/context.ts` — provides `requestId`, `logger`, `prisma`, `user`, `loaders`
- **DataLoaders** (user, category, tag, postsByTagId, postsByCategoryId, tagsByPostId) in context for N+1 prevention
- **Plugins:** `src/interfaces/graphql/plugins/` — auth directive, error mask, request-id
- **Scalars:** `src/interfaces/graphql/scalars/` — DateTime, Email, UUID

### DI Container

`src/infrastructure/container/container.ts` — Singleton `Container` class with wired use cases and repositories. **All resolvers use the container** to access use cases.

### Prisma

- Uses `@prisma/adapter-pg` (PrismaPg) — NOT the default query engine
- Client singleton with global caching in dev: `src/infrastructure/database/prisma/client.ts`
- Mappers: `src/infrastructure/database/prisma/mappers/` convert between domain entities and Prisma models
- Soft deletes on `User` and `Post` via `deletedAt` column

## Key Patterns

- **Entities** extend `BaseEntity` (UUID id, createdAt, updatedAt)
- **Value objects:** `UUID`, `Slug`, `Email` (in `domain/shared/value-objects/`)
- **DTOs** validated with Zod schemas (`application/*/dto/`)
- **Repositories:** interface in `ports/outbound/`, Prisma impl in `infrastructure/database/repositories/`
- **Mappers:** `toDomain()` / `toPrisma()` static methods
- **ESM throughout:** `"type": "module"`, all imports use `.js` extension
- **Node >= 22** required

## Code Style

- No semicolons, single quotes, trailing commas
- 100 char print width, 2-space indent
- `type` imports enforced: `import type { X } from '...'` (ESLint rule)
- Unused vars must be prefixed with `_`

## Commit Conventions

Conventional commits. **Scopes (required):**
`config`, `domain`, `application`, `infrastructure`, `graphql`, `database`, `blog`, `admin`, `auth`, `testing`, `ci`, `docker`, `logging`, `deps`

## Testing

- **Vitest** with globals, `tests/helpers/setup.ts` sets `NODE_ENV=test`
- Tests in `tests/` mirror `src/` structure: `tests/unit/domain/`, `tests/unit/application/`, etc.
- Requires a running PostgreSQL instance (see `.env.test` for connection)
- Coverage excludes `src/index.ts`, `*.graphql`, `*.config.ts`, `prisma/client.ts`
- Import test subjects from `../../../../src/...` (not via aliases)

## Gotchas

- **Dockerfile is broken:** `docker/Dockerfile` references `package-lock.json` and uses `npm ci`/`npm run build` but project uses pnpm (`pnpm-lock.yaml`)
- **Auth is partially stubbed:** `login()` is implemented (delegates to container), but `refreshToken()` and `logout()` throw "Not implemented yet"
- **Pre-commit** runs `npm test` (not `pnpm test`) — may cause issues if npm isn't available