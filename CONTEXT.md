# Contexto del Proyecto: Blog Slow Life

## Propósito

Backend CMS para un blog personal estilo "Slow Life" (vida tranquila, escritura pausada, contenido reflexivo). Expone una API GraphQL para gestionar posts, categorías, etiquetas, usuarios y roles.

---

## Stack Tecnológico

| Capa          | Tecnología                            |
|---------------|---------------------------------------|
| Runtime       | Node.js >= 22                         |
| Lenguaje      | TypeScript ^5.6                       |
| HTTP Server   | Express ^4.21                         |
| GraphQL       | graphql-yoga ^5.0 + @envelop/graphql-jit |
| ORM           | Prisma ^7.8                           |
| DB            | PostgreSQL (vía @prisma/adapter-pg)   |
| Validación    | Zod ^3.24                             |
| Logging       | Pino ^9 + pino-http                   |
| N+1 prevention| DataLoader ^2.2                       |
| Testing       | Vitest ^2.0                           |
| Linting       | ESLint + Prettier                     |
| Hooks         | Husky + lint-staged + commitlint      |
| Contenedor    | Docker (node:22-alpine, multi-stage)  |
| Auth          | JWT (preparado pero **no implementado**) |

---

## Arquitectura: Hexagonal (Ports & Adapters) + DDD

```
┌─────────────────────────────────────────────────────────┐
│                    interfaces/                          │  ← Capa más externa
│  ┌─────────────────────────────────────────────────┐   │
│  │  HTTP (health.controller.ts)                    │   │
│  │  GraphQL (resolvers, typeDefs, scalars, schema) │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │ llama                            │
├─────────────────────┼───────────────────────────────────┤
│                     ▼                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              application/                        │   │  ← Casos de uso
│  │                                                  │   │
│  │  ┌──────────────┐     ┌──────────────────────┐   │   │
│  │  │  Use Cases    │────▶│  Ports (interfaces)   │   │   │
│  │  │  (create-post,│     │  PostRepository       │   │   │
│  │  │   get-posts,  │     │  UserRepository       │   │   │
│  │  │   update-post,│     │  CategoryRepository   │   │   │
│  │  │   delete-post,│     │  TagRepository        │   │   │
│  │  │   create-user)│     │  RoleRepository       │   │   │
│  │  └──────────────┘     └──────────┬───────────┘   │   │
│  └──────────────────────────────────┼─────────────────┘   │
│                                     │ implementa           │
├─────────────────────────────────────┼──────────────────────┤
│                                     ▼                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │              infrastructure/                       │    │  ← Adaptadores
│  │                                                    │    │
│  │  ┌──────────────────┐  ┌──────────────────────┐    │    │
│  │  │  PrismaRepositories │  │  Mappers             │    │    │
│  │  │  (implementan    │  │  (toDomain / toPrisma) │    │    │
│  │  │   ports)         │  └──────────────────────┘    │    │
│  │  └──────────────────┘                              │    │
│  │  ┌──────────────────┐  ┌──────────────────────┐    │    │
│  │  │  Container (DI) │  │  Logging (Pino)       │    │    │
│  │  └──────────────────┘  └──────────────────────┘    │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │ usa                                │
├───────────────────────┼────────────────────────────────────┤
│                       ▼                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │               domain/                              │    │  ← Núcleo (cero dependencias externas)
│  │                                                    │    │
│  │  Entidades: Post, Category, Tag, User, Role,       │    │
│  │              Permission, Session                    │    │
│  │  Value Objects: UUID, Email, Slug                   │    │
│  │  Errores: SlowLifeError, DomainError,               │    │
│  │            ApplicationError, InfrastructureError     │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### Regla de dependencias

```
interfaces  ──────▶  application  ──────▶  domain
     │                     │                    ▲
     │                     │                    │
     └──────▶  infrastructure ──────────────────┘
```

- **Domain**: capa más interna. Sin imports de otras capas.
- **Application**: importa domain. Define **puertos** (interfaces de repositorios). Nunca importa infraestructura.
- **Infrastructure**: importa domain + application (implementa puertos).
- **Interfaces**: importa application, infrastructure y domain (solo para tipos).

---

## Flujo de Comunicación (Request/Response)

### Ejemplo: Crear un Post

```
Cliente HTTP
     │
     │ POST /graphql { mutation createPost(input: {...}) }
     ▼
┌──────────────────────────────────────────────────────────┐
│ graphql-yoga                                              │
│  • Middleware: helmet → cors → rate-limit → pino-http     │
│  • Plugin: useRequestId() (inyecta requestId)              │
│  • Plugin: useGraphQlJit() (compila query a JS)           │
│  • Context factory: inyecta logger, prisma, DataLoaders    │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ post.resolver.ts (GraphQL resolver)                      │
│  • Crea instancia de CreatePostUseCase                    │
│  • Llama: createPost.execute(input)                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ CreatePostUseCase (application/blog/use-cases)           │
│  • DTO validation con Zod (CreatePostSchema.safeParse)    │
│  • Crea Slug a partir del título                          │
│  • Verifica unicidad: postRepository.findBySlug(slug)      │
│  • Crea entidad Post en memoria                           │
│  • Guarda: postRepository.save(post) -> retorna Post      │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ PrismaPostRepository (infrastucture/database/repositories)│
│  • Recibe entidad Post                                    │
│  • Convierte a Prisma model: PostMapper.toPrisma(post)    │
│  • Ejecuta: prisma.post.create({ data })                  │
│  • Convierte resultado: PostMapper.toDomain(prismaPost)   │
│  • Retorna entidad Post                                   │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
                    PostgreSQL
```

### Resolución de Relaciones (N+1)

```
Query:
  posts { author { name } category { name } }

1. posts() → SELECT * FROM posts WHERE deleted_at IS NULL
              (1 query)
2. Por cada post, el resolver Post.author usa:
     ctx.loaders.user.load(parent.authorId)
     → DataLoader agrupa TODOS los authorId en una sola query:
       SELECT * FROM users WHERE id IN (id1, id2, ...)
       (1 query en vez de N)
3. Igual para Post.category:
     → DataLoader agrupa categoryId
       (1 query)

Total: 3 queries (en vez de 1 + N*2)
```

---

## Modelo de Datos

### Diagrama Entidad-Relación

```
┌──────────────┐       ┌──────────────────┐
│    User      │       │     Session      │
│──────────────│       │──────────────────│
│ id (UUID)    │──┐    │ id (UUID)        │
│ email        │  │    │ token (hashed)   │
│ name         │  │    │ expiresAt        │
│ password     │  │    │ userId ──────────│──┐
│ bio          │  │    │ createdAt        │  │
│ avatar       │  │    └──────────────────┘  │
│ deletedAt    │  │                           │
└──────┬───────┘  │                           │
       │          │                           │
       │  ┌───────┘   ┌──────────────────┐    │
       │  │           │      Role        │    │
       │  │           │──────────────────│    │
       │  │           │ id (string)      │    │
       │  │      ┌───▶│ name (ADMIN,     │    │
       │  │      │    │   EDITOR, VIEWER)│    │
       │  │      │    └────────┬─────────┘    │
       │  │      │             │              │
       │  │      │    ┌───────┴──────────┐    │
       │  ▼      │    │  RolePermission  │    │
       │  ┌──────┴──┐ └───────┬──────────┘    │
       │  │ UserRole│         │               │
       │  └────┬────┘         │               │
       │       │    ┌─────────▼────────┐      │
       │       │    │   Permission     │      │
       │       │    │──────────────────│      │
       │       │    │ id (string)      │      │
       │       │    │ name             │      │
       │       │    │ description      │      │
       │       │    └──────────────────┘      │
       ▼       │                              │
  ┌────────────┴─────────┐                    │
  │        Post          │                    │
  │──────────────────────│                    │
  │ id (UUID)            │                    │
  │ title                │                    │
  │ slug (unique)        │                    │
  │ content              │                    │
  │ excerpt              │                    │
  │ coverImage           │                    │
  │ status (DRAFT|       │                    │
  │   PUBLISHED|ARCHIVED)│                    │
  │ authorId ────────────│────────────────────┘
  │ categoryId           │
  │ publishedAt          │
  │ deletedAt            │
  │ createdAt            │
  │ updatedAt            │
  └──┬───────────────────┘
     │
     │       ┌──────────────┐
     │       │   Category   │
     │       │──────────────│
     ├──────▶│ id (UUID)    │
     │       │ name         │
     │       │ slug         │
     │       │ description  │
     │       └──────────────┘
     │
     │  ┌──────────────────┐
     │  │  PostTag (N:N)   │
     │  ├──────────────────┤
     ├─▶│ postId           │
     │  │ tagId            │
     │  └────────┬─────────┘
     │           │
     │  ┌────────▼─────────┐
     │  │       Tag        │
     │  │──────────────────│
     └─▶│ id (UUID)        │
        │ name             │
        │ slug             │
        └──────────────────┘
```

### Soft Deletes

- **User** y **Post** no se eliminan físicamente. Se marcan con `deletedAt`.
- Las queries de listado filtran por `deletedAt IS NULL`.

---

## Módulos (Bounded Contexts)

### 1. Administración (`domain/administration/` + `application/administration/`)
- Gestión de usuarios (createUser)
- Roles y permisos (createRole)
- Auth (login/refreshToken/logout — **pendiente**)

### 2. Blog (`domain/blog/` + `application/blog/`)
- CRUD de posts (crear, listar, obtener por slug, actualizar, eliminar)
- Categorías (listar, crear)
- Etiquetas (listar, crear)

---

## Manejo de Errores

```
SlowLifeError (abstract)
├── DomainError (400)
│   ├── EntityNotFoundError (404)
│   ├── BusinessRuleViolationError (400)
│   ├── PostNotFoundError (404)
│   ├── PostSlugConflictError (409)
│   └── EmailAlreadyExistsError (409)
├── ApplicationError (500)
│   ├── UnauthorizedError (401)
│   ├── ForbiddenError (403)
│   └── ValidationError (400)
└── InfrastructureError (500)
```

- Los errores no capturados se enmascaran en producción: `{ message: "Internal server error" }`.

---

## Inyección de Dependencias

Actualmente hay una **inconsistencia parcial**: existe un `Container` singleton en `infrastructure/container/container.ts` que instancia repositorios y casos de uso, pero los resolvers de GraphQL instancian `PrismaPostRepository` directamente y crean los casos de uso manualmente.

```
Estado actual:
  Resolver → new PrismaPostRepository() → new CreatePostUseCase(repo)

Estado deseado:
  Resolver → Container.getInstance().createPostUseCase
```

---

## Configuración y Entorno (`config/`)

- `env.ts`: esquema Zod que valida todas las variables de entorno al arrancar.
- `modules/server.config.ts`: puerto, host, entorno.
- `modules/database.config.ts`: pool de conexiones (PrismaPg con pg).
- `modules/logger.config.ts`: nivel y formato de log.

Variables clave:
| Variable | Default | Uso |
|---|---|---|
| `NODE_ENV` | development | Controla GraphiQL, errores enmascarados |
| `PORT` | 4000 | Puerto del servidor |
| `DATABASE_URL` | (obligatorio) | Conexión a PostgreSQL |
| `JWT_SECRET` | (obligatorio) | Firma JWT (preparado, no usado) |
| `REFRESH_TOKEN_SECRET` | (obligatorio) | Refresh token (preparado, no usado) |
| `CORS_ORIGINS` | localhost:3000,5173 | Orígenes permitidos |

---

## Testing

```
tests/
├── __mocks__/              # Mocks globales
├── contract/                # Tests de contrato (pendientes)
├── fixtures/
│   ├── users.fixture.ts     # Datos de prueba para usuarios
│   └── posts.fixture.ts     # Datos de prueba para posts
├── helpers/
│   ├── setup.ts             # Setup global (NODE_ENV=test)
│   └── test-server.ts       # Helper para servidor de tests
├── integration/              # Tests de integración (pendientes)
└── unit/
    └── domain/value-objects/  # Tests de Email, Slug, UUID VOs
```

---

## Observaciones / Deuda Técnica

1. **Auth no implementado**: `login()`, `refreshToken()`, `logout()` lanzan "Not implemented yet". Las variables JWT están configuradas pero sin uso.
2. **Container no usado por resolvers**: los resolvers instancian repositorios directamente, saltándose el DI container.
3. **Dockerfile usa npm**: el Dockerfile referencia `package-lock.json`, pero el proyecto usa pnpm (`pnpm-lock.yaml`). No funcionaría en build.
4. **Directorios vacíos**: `src/data/`, `src/datos/`, `scripts/`, `src/infrastructure/container/modules/` existen pero no contienen nada.
5. **GitHub Actions**: el directorio `.github/workflows/` existe pero no hay workflows definidos.
6. **Mappers**: `PostMapper.toPrisma()` hace un `as PrismaPost` con tipos incompletos (no convierte `slug` si es de tipo `Slug`).
