import { z } from 'zod'
import { PostStatus } from '../../../domain/shared/types/index.js'

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().nullable().optional(),
  excerpt: z.string().max(500).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export const UpdatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().nullable().optional(),
  excerpt: z.string().max(500).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export type CreatePostDTO = z.infer<typeof CreatePostSchema>
export type UpdatePostDTO = z.infer<typeof UpdatePostSchema>

export interface PostResponse {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  coverImage: string | null
  status: PostStatus
  authorId: string
  categoryId: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
