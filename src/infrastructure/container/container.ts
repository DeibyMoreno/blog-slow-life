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
import { CreateUserUseCase } from '../../application/administration/use-cases/create-user.use-case.js'
import { GetMeUseCase } from '../../application/administration/use-cases/get-me.use-case.js'
import { LoginUseCase } from '../../application/administration/use-cases/login.use-case.js'
import { PasswordService } from '../auth/password.service.js'
import { JWTService } from '../auth/jwt.service.js'
import { CreateRoleUseCase } from '@application/administration/use-cases/create-role.use-case.js'

export class Container {
  private static instance: Container | null = null

  private readonly postRepository = new PrismaPostRepository()
  private readonly userRepository = new PrismaUserRepository()
  private readonly categoryRepository = new PrismaCategoryRepository()
  private readonly _tagRepository = new PrismaTagRepository()
  private readonly roleRepository = new PrismaRoleRepository()
  private readonly sessionRepository = new PrismaSessionRepository()
  private readonly passwordService = new PasswordService()
  private readonly jwtService = new JWTService()

  private constructor() { }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  get tagRepository() {
    return this._tagRepository
  }

  get createPostUseCase() {
    return new CreatePostUseCase(this.postRepository)
  }

  get getPostsUseCase() {
    return new GetPostsUseCase(this.postRepository)
  }

  get getPostBySlugUseCase() {
    return new GetPostBySlugUseCase(this.postRepository)
  }

  get updatePostUseCase() {
    return new UpdatePostUseCase(this.postRepository)
  }

  get deletePostUseCase() {
    return new DeletePostUseCase(this.postRepository)
  }

  get createUserUseCase() {
    return new CreateUserUseCase(this.userRepository, this.passwordService)
  }

  get getMeUseCase() {
    return new GetMeUseCase(this.userRepository)
  }

  get loginUseCase() {
    return new LoginUseCase(
      this.userRepository,
      this.sessionRepository,
      this.passwordService,
      this.jwtService,
    )
  }

  get createRoleUseCase() {
    return new CreateRoleUseCase(this.roleRepository)
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
}

export const container = Container.getInstance()
