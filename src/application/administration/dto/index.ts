import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  roleId: z.string().uuid(),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
})

export type CreateUserDTO = z.infer<typeof CreateUserSchema>
export type LoginDTO = z.infer<typeof LoginSchema>
export type CreateRoleDTO = z.infer<typeof CreateRoleSchema>
