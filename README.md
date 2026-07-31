# Blog Slow Life — Backend CMS

API GraphQL para un blog personal estilo *Slow Life*: gestión de posts, categorías, etiquetas, usuarios, roles y autenticación. Construido con **Node.js + TypeScript + GraphQL + PostgreSQL**, siguiendo una **arquitectura hexagonal (Ports & Adapters) con Domain-Driven Design**.

> Este backend está desplegado en producción sobre **AWS (EC2 + RDS + S3)** con **CI/CD vía GitHub Actions**. Ver [Despliegue](#despliegue-infraestructura-aws) y [CI/CD](#cicd-github-actions).

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js >= 22 (ESM) |
| Lenguaje | TypeScript ^5.6 |
| HTTP Server | Express ^4.21 |
| GraphQL | graphql-yoga ^5.0 + @envelop/graphql-jit (JIT compilation) |
| ORM | Prisma ^7.8 (driver `@prisma/adapter-pg`) |
| Base de datos | PostgreSQL |
| Validación | Zod ^3.24 (DTOs) |
| Autenticación | JWT (jose) + bcrypt (12 rounds) |
| Logging | Pino ^9 + pino-http |
| Anti N+1 | DataLoader ^2.2 |
| Testing | Vitest ^2.0 |
| Linting / Format | ESLint + Prettier |
| Hooks | Husky + lint-staged + commitlint |
| Contenedor | Docker (Dockerfile multi-stage, opcional) |

---

## Arquitectura

El proyecto sigue una arquitectura **hexagonal (Ports & Adapters)** con un núcleo de dominio **DDD**. Las capas son estrictas y las dependencias fluyen solo hacia adentro:

```
interfaces  ──────▶  application  ──────▶  domain
     │                     │                    ▲
     │                     │                    │
     └──────▶  infrastructure ──────────────────┘
```

```
┌──────────────────────────────────────────────────────────┐
│                     interfaces/                          │  ← Capa más externa
│   HTTP (health)   GraphQL (resolvers, typeDefs,          │
│                    scalars, plugins, schema)             │
│                     │ llama                              │
├─────────────────────┼────────────────────────────────────┤
│                     ▼                                    │
│                 application/                             │  ← Casos de uso
│   Use Cases (create-post, get-posts, login, ...)         │
│      │                  │                                │
│      │ usa              │ define puertos (interfaces)    │
│      ▼                  ▼                                │
│   DTOs (Zod)       ports/outbound/ (PostRepository,      │
│                      UserRepository, EventBus, ...)      │
├─────────────────────┼────────────────────────────────────┤
│                     │ implementa                         │
│                     ▼                                    │
│               infrastructure/                            │  ← Adaptadores
│   PrismaRepositories  Mappers (toDomain / toPrisma)      │
│   Container (DI)      JWT / Password   Pino              │
│   InMemoryEventBus    RateLimit / CORS / Helmet          │
├─────────────────────┼────────────────────────────────────┤
│                     ▼                                    │
│                   domain/                                │  ← Núcleo (0 dependencias)
│   Entidades: Post, Category, Tag, User, Role, Session    │
│   Value Objects: UUID, Email, Slug, RoleName             │
│   Eventos de dominio, Errores tipados                    │
└──────────────────────────────────────────────────────────┘
```

### Reglas de dependencia

- **Domain** — capa más interna, sin imports de otras capas.
- **Application** — importa solo `domain`; define **puertos** (interfaces de repositorios y servicios). Nunca importa infraestructura.
- **Infrastructure** — implementa los puertos de `application` (adaptadores Prisma, auth, logging, eventos).
- **Interfaces** — HTTP y GraphQL; orquesta use cases a través del container de DI.

### Flujo de un request: `createPost`

```
Cliente HTTP
   │  POST /graphql  { mutation createPost(input: {...}) }
   ▼
graphql-yoga (helmet → cors → rate-limit → pino-http)
   │  plugins: useRequestId, useGraphQlJit, error mask
   │  context: logger + prisma + user + DataLoaders
   ▼
post.resolver.ts
   │  container.createPostUseCase
   ▼
CreatePostUseCase (application/blog/use-cases)
   │  validación Zod → slug desde título → chequeo de conflicto
   │  crea entidad Post (emite PostCreatedEvent) → save
   ▼
PrismaPostRepository (infrastructure/database/repositories)
   │  PostMapper.toPrisma → prisma.post.create
   │  PostMapper.toDomain → entidad Post
   ▼
PostgreSQL
```

### Inyección de dependencias

`src/infrastructure/container/container.ts` expone un **singleton** (`Container.getInstance()`) que instancia una vez repositorios y servicios (`Prisma*Repository`, `JWTService`, `PasswordService`, `InMemoryEventBus`) y construye los **use cases bajo demanda**. Todos los resolvers acceden a los casos de uso a través del container.

---

## Modelo de Datos

```
┌──────────────┐       ┌──────────────────┐
│    User      │       │     Session      │
│──────────────│       │──────────────────│
│ id (UUID)    │──┐    │ id (UUID)        │
│ email        │  │    │ refreshToken     │
│ passwordHash │  │    │ expiresAt        │
│ firstName    │  │    │ ipAddress        │
│ lastName     │  │    │ userAgent        │
│ isActive     │  │    │ userId ──────────│──┐
│ roleId       │  │    └──────────────────┘  │
│ deletedAt    │  │                           │
└──────┬───────┘  │                           │
       │          │  ┌──────────────────┐     │
       │  ┌───────┘  │      Role        │     │
       │  │          │──────────────────│     │
       │  │      ┌──▶│ name (ADMIN,     │     │
       │  │      │   │   EDITOR, VIEWER)│     │
       │  │      │   └────────┬─────────┘     │
       │  │      │            │               │
       │  │      │   ┌────────▼──────────┐    │
       │  ▼      │   │    Permission     │    │
       │  ┌──────┴──┐ └────────▲─────────┘    │
       │  │ UserRole│          │ N:N          │
       │  └────┬────┘    ┌─────┴─────┐        │
       │       │         │ _RoleTo   │        │
       ▼       │         │ _Perm     │        │
   ┌────────────┴─────────┐  └───────────┘    │
   │        Post          │                   │
   │──────────────────────│                   │
   │ id (UUID)            │                   │
   │ title                │                   │
   │ slug (unique)        │                   │
   │ content / excerpt    │                   │
   │ coverImage           │                   │
   │ status (DRAFT|       │                   │
   │   PUBLISHED|ARCHIVED)│                   │
   │ authorId ────────────│───────────────────┘
   │ categoryId           │
   │ publishedAt          │
   │ deletedAt            │
   └──┬───────────────────┘
      │        ┌──────────────┐
      │        │   Category   │
      ├───────▶│ id (UUID)    │
      │        │ name         │
      │        │ slug         │
      │        │ description  │
      │        └──────────────┘
      │  ┌──────────────────┐
      │  │  PostTag (N:N)   │
      ├─▶│ postId           │
      │  │ tagId            │
      │  └────────┬─────────┘
      │           │
      │  ┌────────▼─────────┐
      │  │       Tag        │
      └─▶│ id (UUID)        │
         │ name             │
         │ slug             │
         └──────────────────┘
```

- **Enums:** `PostStatus { DRAFT | PUBLISHED | ARCHIVED }`, `AuthRole { ADMIN | EDITOR | VIEWER }`.
- **Soft deletes:** `User` y `Post` se eliminan lógicamente (`deletedAt`); todas las consultas de listado filtran `deletedAt IS NULL`.
- **Índices:** búsquedas optimizadas en `slug`, `email`, `authorId`, `categoryId`, `status`, `publishedAt`, `refreshToken`.

---

## API GraphQL

**Endpoint:** `POST /graphql` · **Playground (GraphiQL):** solo en `NODE_ENV=development`.
**Escalares personalizados:** `DateTime`, `UUID`, `Email` (validados con los value objects del dominio).

### Módulo Blog

| Operación | Tipo | Acceso |
|---|---|---|
| `posts(limit, offset, status)` / `post(id)` / `postBySlug(slug)` | Query | Público |
| `categories` / `category(id)` | Query | Público |
| `tags` / `tag(id)` / `tagBySlug(slug)` | Query | Público |
| `createPost(input)` / `updatePost(id, input)` | Mutation | `@auth(roles: [ADMIN, EDITOR])` |
| `deletePost(id)` | Mutation | `@auth(roles: [ADMIN])` |
| `createCategory` / `updateCategory` / `deleteCategory` | Mutation | `@auth` |
| `createTag` / `deleteTag` | Mutation | `@auth` |

### Módulo Administración

| Operación | Tipo | Acceso |
|---|---|---|
| `login(input)` → `AuthPayload { accessToken, refreshToken, user }` | Mutation | Público |
| `users` / `user(id)` / `me` | Query | `@auth` (`me` autenticado) |
| `roles` / `role(id)` | Query | Público |
| `createUser(input)` | Mutation | `@auth(roles: [ADMIN])` |
| `createRole(input)` | Mutation | `@auth(roles: [ADMIN])` |
| `refreshToken` / `logout` | Mutation | Autenticado |

### Ejemplos de uso

Obtener posts publicados con autor, categoría y etiquetas:

```graphql
query {
  posts(status: PUBLISHED, limit: 10, offset: 0) {
    total
    items {
      id
      title
      slug
      excerpt
      status
      publishedAt
      author { fullName }
      category { name }
      tags { name }
    }
  }
}
```

Crear un post (requiere token Bearer):

```graphql
mutation {
  createPost(input: {
    title: "La belleza de desacelerar"
    content: "..."
    status: DRAFT
    tagIds: ["<uuid>"]
  }) {
    id
    slug
    status
  }
}
```

Login:

```graphql
mutation {
  login(input: { email: "admin@slowlife.blog", password: "********" }) {
    accessToken
    user { id fullName role { name } }
  }
}
```

---

## Funcionalidad implementada

- **Blog**
  - CRUD completo de **posts** con estados (draft/publicado/archivado), slug autogenerado y verificación de unicidad, soft delete y publicación en fechas.
  - CRUD de **categorías** (bloqueo de borrado si tienen posts) y **etiquetas**.
  - Relaciones `N:N` post ↔ tag gestionadas en la persistencia.
- **Administración**
  - Registro de **usuarios** (hash de contraseña con bcrypt, 12 rounds) y **roles/permisos** (`ADMIN`, `EDITOR`, `VIEWER`).
  - **Login JWT**: emite access token (`15m`) y refresh token (`7d`) persistido en sesiones; expiración controlada.
- **Domain Events** (`InMemoryEventBus`): `PostCreated`, `PostPublished`, `PostArchived`, `UserCreated`, `UserLoggedIn`.
- **Anti N+1**: DataLoaders por request (`user`, `category`, `tag`, `postsByTagId`, `postsByCategoryId`, `tagsByPostId`) que agrupan relaciones en consultas `WHERE ... IN (...)`.
- **GraphQL JIT**: las queries se compilan a JavaScript en vez de interpretarse (menor latencia).

---

## Estructura del repositorio

```
src/
├── config/                    # Validación de entorno (Zod) y configs derivadas
├── domain/                    # Núcleo: entidades, value objects, eventos, errores
│   ├── blog/                  #   Post, Category, Tag + errores
│   ├── administration/        #   User, Role, Permission, Session + errores
│   └── shared/                #   BaseEntity, AggregateRoot, UUID, Email, Slug, eventos
├── application/               # Casos de uso + DTOs (Zod) + puertos
│   ├── blog/                  #   CRUD posts, categorías, etiquetas
│   ├── administration/        #   createUser, login, createRole, getMe
│   └── shared/ports/          #   inbound (use cases) y outbound (repositorios)
├── infrastructure/            # Adaptadores
│   ├── auth/                  #   JWTService (jose), PasswordService (bcrypt)
│   ├── config/                #   CORS, Helmet, Rate limit
│   ├── container/             #   Container (DI singleton)
│   ├── database/prisma/       #   client (PrismaPg) + mappers
│   ├── database/repositories/ #   Prisma*Repository
│   ├── events/                #   InMemoryEventBus
│   └── logging/               #   Pino + pino-http
├── interfaces/                # Capa externa
│   ├── graphql/               #   schema, context, resolvers, typeDefs (.graphql),
│   │                          #   scalars, plugins (@auth, error mask, request-id)
│   └── http/                  #   health.controller (/health, /version)
└── index.ts                   # Bootstrap Express + GraphQL + graceful shutdown
```

---

## Seguridad

- **Autorización por directiva `@auth`**: restringe mutations/fields por rol (`ADMIN`, `EDITOR`, `VIEWER`) sobre el usuario autenticado en el contexto.
- **Autenticación**: JWT firmado con `jose` (HS256), verificación del token Bearer en cada request para poblar `context.user`.
- **Contraseñas**: bcrypt con `SALT_ROUNDS = 12`.
- **Cabeceras HTTP**: Helmet (CSP en producción), CORS restringido a `CORS_ORIGINS`.
- **Rate limiting**: `express-rate-limit` (100 req / 15 min por defecto).
- **Enmascarado de errores**: en producción los errores internos se devuelven como `"Unexpected error."`; los errores de dominio conservan su `code` y `http.status` en las extensions.
- **Logging seguro**: Pino redacta `authorization`, `cookie`, `password`, `passwordHash` y `refreshToken` de los logs.

---

## Configuración

Copiar `.env.example` → `.env` y ajustar. Variables principales:

| Variable | Default | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` / `HOST` | `4000` / `0.0.0.0` | Puerto y host del servidor |
| `DATABASE_URL` | — | Cadena de conexión PostgreSQL (requerida) |
| `DATABASE_POOL_MIN` / `MAX` | `2` / `10` | Pool de conexiones |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | — | Firmas JWT (requeridas) |
| `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | `15m` / `7d` | Expiración de tokens |
| `CORS_ORIGINS` | `localhost:3000,5173` | Orígenes permitidos (CSV) |
| `LOG_LEVEL` / `LOG_FORMAT` | `info` / `json` | Nivel y formato de log (`json` \| `pretty`) |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `900000` / `100` | Rate limiting |

---

## Primeros pasos

Requisitos: **Node >= 22**, **pnpm**, **PostgreSQL** local o remoto.

```bash
pnpm install              # instalar dependencias
cp .env.example .env      # configurar DATABASE_URL y secrets
pnpm db:generate          # generar cliente Prisma
pnpm db:migrate           # aplicar migraciones
pnpm db:seed              # (opcional) poblar datos de ejemplo
pnpm dev                  # servidor de desarrollo (tsx watch, puerto 4000)
```

Comandos útiles:

```bash
pnpm build                # compilar a dist/ (tsc + tsc-alias + copyfiles)
pnpm start                # node dist/index.js
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
pnpm format               # Prettier
pnpm test                 # Vitest (requiere PostgreSQL)
```

---

## Testing

Suite con **Vitest** que refleja la estructura de `src/`:

```
tests/
├── fixtures/                # Datos de prueba (users, posts)
├── helpers/                 # setup global, test-server
├── unit/domain/             # value objects (Email, Slug, UUID)
└── unit/application/        # use cases del módulo blog
```

```bash
pnpm test             # vitest run
pnpm test:watch       # modo watch
pnpm test:coverage    # cobertura (v8)
```

---

## Despliegue — Infraestructura AWS

Producción corre sobre AWS con los siguientes servicios:

```
 GitHub Actions ──SSH──▶ EC2 (Nginx ──proxy──▶ Node/GraphQL con PM2)
                            │
                            ├──▶ RDS PostgreSQL (privada, mismo VPC)
                            └──▶ S3 (bucket público de imágenes)
```

| Servicio | Rol en la infraestructura |
|---|---|
| **EC2** | Instancia `t2.micro`/`t3.micro` (Ubuntu 24.04) que ejecuta el backend. Nginx actúa como **reverse proxy** hacia el proceso Node en el puerto `4000`; **PM2** mantiene el proceso vivo y lo reinicia tras cada deploy. Elastic IP asociada para IP pública estable. |
| **RDS PostgreSQL** | Instancia `db.t3.micro` (Free Tier, 20 GB) en la **misma VPC**, **sin acceso público**. Solo acepta conexiones del EC2 vía security group (puerto `5432` restringido al SG del EC2). |
| **S3** | Bucket para imágenes del blog con **lectura pública** vía Bucket Policy; la subida se hace con **presigned URLs** generadas por el backend. |
| **IAM** | Usuario personal con permisos por grupo (no se usa root). **IAM Role** asignado al EC2 (sin access keys) con permiso mínimo `s3:GetObject`/`s3:PutObject`. |
| **Security Groups** | SSH (22) restringido, HTTP (80) y HTTPS (443) abiertos en EC2; RDS solo acepta el puerto `5432` desde el SG del EC2. |

### Configuración clave

**Bucket policy de S3** (lectura pública de imágenes):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<bucket>/*"
    }
  ]
}
```

**Nginx — reverse proxy** hacia el proceso Node/PM2:

```nginx
server {
    listen 80;
    server_name <ip-o-dominio>;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Variables de entorno en el servidor

```
DATABASE_URL=postgresql://postgres:<password>@<endpoint-rds>:5432/postgres
S3_BUCKET=<bucket>
AWS_REGION=us-east-1
PORT=4000
JWT_SECRET=<secret>
REFRESH_TOKEN_SECRET=<secret>
CORS_ORIGINS=<origenes-permitidos>
```

---

## CI/CD — GitHub Actions

Pipeline dividido en dos workflows independientes que corren sobre `main`.

### CI (`ci.yml`) — barrera de calidad en cada push/PR

```yaml
jobs:
  lint-and-typecheck:  # pnpm lint + pnpm typecheck
  test:                # Postgres 16 efímero (service) → migrate deploy → pnpm test
    needs: lint-and-typecheck
  build:               # pnpm build (tsc + tsc-alias + copyfiles)
    needs: lint-and-typecheck
```

- Action compuesta `.github/actions/setup` (pnpm 10 + Node 22 con caché + `pnpm install --frozen-lockfile` + `prisma generate`).
- El job de tests levanta un **PostgreSQL descartable** en el runner — nunca toca el RDS de producción.
- Permisos mínimos (`contents: read`) y concurrencia por rama con cancelación de runs obsoletos.

### CD (`deploy.yml`) — entrega a producción al mergear a `main`

```yaml
jobs:
  deploy:
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1.0.3   # SSH al EC2
        script: |
          cd $EC2_APP_DIR
          git pull --ff-only origin main
          pnpm install --frozen-lockfile
          pnpm db:generate
          pnpm build
          pnpm prisma migrate deploy
          pm2 startOrReload ecosystem.config.cjs
```

- **Secrets** (Settings → Secrets and variables → Actions): `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (clave ed25519 dedicada), `EC2_APP_DIR`.
- `git pull --ff-only` garantiza que el servidor sea siempre un espejo limpio de `main`.
- `migrate deploy` aplica migraciones pendientes sobre RDS antes de reiniciar el proceso.
- `pm2 startOrReload` arranca o recarga la app definida en `ecosystem.config.cjs` (`dist/index.js`, fork, `NODE_ENV=production`).
- Concurrencia `cancel-in-progress: false`: nunca se cancela un deploy a medias.

---

## Licencia

Proyecto privado. Uso personal / educativo.
