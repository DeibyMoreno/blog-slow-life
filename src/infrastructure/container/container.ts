import { PrismaPostRepository } from '../database/repositories/prisma-post.repository.js'
import { PrismaUserRepository } from '../database/repositories/prisma-user.repository.js'
import { PrismaCategoryRepository } from '../database/repositories/prisma-category.repository.js'
import { PrismaTagRepository } from '../database/repositories/prisma-tag.repository.js'
import { PrismaRoleRepository } from '../database/repositories/prisma-role.repository.js'
import { PrismaSessionRepository } from '../database/repositories/prisma-session.repository.js'
import { CreatePostUseCase } from '../../application/blog/use-cases/create-post.use-case.js'
import { GetPostsUseCase } from '../../application/blog/use-cases/get-posts.use-case.js'
import { GetPostBySlugUseCase } from '../../application/blog/use-cases/get-post-by-slug.use-case.js'
import { UpdatePostUseCase } from '../../application/blog/use-cases/update-post.use-case.js'
import { DeletePostUseCase } from '../../application/blog/use-cases/delete-post.use-case.js'
import { CreateTagUseCase } from '../../application/blog/use-cases/create-tag.use-case.js'
import { DeleteTagUseCase } from '../../application/blog/use-cases/delete-tag.use-case.js'
import { GetTagsUseCase } from '../../application/blog/use-cases/get-tags.use-case.js'
import { CreateCategoryUseCase } from '../../application/blog/use-cases/create-category.use-case.js'
import { UpdateCategoryUseCase } from '../../application/blog/use-cases/update-category.use-case.js'
import { DeleteCategoryUseCase } from '../../application/blog/use-cases/delete-category.use-case.js'
import { GetCategoriesUseCase } from '../../application/blog/use-cases/get-categories.use-case.js'
import { CreateUserUseCase } from '../../application/administration/use-cases/create-user.use-case.js'
import { GetMeUseCase } from '../../application/administration/use-cases/get-me.use-case.js'
import { LoginUseCase } from '../../application/administration/use-cases/login.use-case.js'
import { PasswordService } from '../auth/password.service.js'
import { JWTService } from '../auth/jwt.service.js'
import { InMemoryEventBus } from '../events/in-memory-event-bus.js'
import { CreateRoleUseCase } from '@application/administration/use-cases/create-role.use-case.js'
import type { PasswordHasher } from '@application/shared/ports/outbound/password-hasher.port.js'
import type { TokenService } from '@application/shared/ports/outbound/token-service.port.js'
import type { EventBus } from '@application/shared/ports/outbound/event-bus.port.js'

export class Container {
  private static instance: Container | null = null

  private readonly _postRepository = new PrismaPostRepository()
  private readonly _userRepository = new PrismaUserRepository()
  private readonly _categoryRepository = new PrismaCategoryRepository()
  private readonly _tagRepository = new PrismaTagRepository()
  private readonly _roleRepository = new PrismaRoleRepository()
  private readonly _sessionRepository = new PrismaSessionRepository()
  private readonly _passwordService: PasswordHasher = new PasswordService()
  private readonly _jwtService: TokenService = new JWTService()
  private readonly _eventBus: EventBus = new InMemoryEventBus()

  private constructor() { }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  get eventBus(): EventBus {
    return this._eventBus
  }

  get postRepository() {
    return this._postRepository
  }

  get userRepository() {
    return this._userRepository
  }

  get categoryRepository() {
    return this._categoryRepository
  }

  get tagRepository() {
    return this._tagRepository
  }

  get roleRepository() {
    return this._roleRepository
  }

  get createPostUseCase() {
    return new CreatePostUseCase(this._postRepository, this._eventBus)
  }

  get getPostsUseCase() {
    return new GetPostsUseCase(this._postRepository)
  }

  get getPostBySlugUseCase() {
    return new GetPostBySlugUseCase(this._postRepository)
  }

  get updatePostUseCase() {
    return new UpdatePostUseCase(this._postRepository, this._eventBus)
  }

  get deletePostUseCase() {
    return new DeletePostUseCase(this._postRepository, this._eventBus)
  }

  get createUserUseCase() {
    return new CreateUserUseCase(this._userRepository, this._passwordService, this._eventBus)
  }

  get getMeUseCase() {
    return new GetMeUseCase(this._userRepository)
  }

  get loginUseCase() {
    return new LoginUseCase(
      this._userRepository,
      this._sessionRepository,
      this._passwordService,
      this._jwtService,
      this._eventBus,
    )
  }

  get createRoleUseCase() {
    return new CreateRoleUseCase(this._roleRepository)
  }

  get createTagUseCase() {
    return new CreateTagUseCase(this._tagRepository)
  }

  get deleteTagUseCase() {
    return new DeleteTagUseCase(this._tagRepository)
  }

  get getTagsUseCase() {
    return new GetTagsUseCase(this._tagRepository)
  }

  get createCategoryUseCase() {
    return new CreateCategoryUseCase(this._categoryRepository)
  }

  get updateCategoryUseCase() {
    return new UpdateCategoryUseCase(this._categoryRepository)
  }

  get deleteCategoryUseCase() {
    return new DeleteCategoryUseCase(this._categoryRepository)
  }

  get getCategoriesUseCase() {
    return new GetCategoriesUseCase(this._categoryRepository)
  }
}

export const container = Container.getInstance()
