import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
  organizationName: z.string().min(2).max(80),
})
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
