import { z } from 'zod'

export const chatMessageSchema = z.object({
  botId: z.string().cuid(),
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1).max(200),
  visitorId: z.string().max(200).optional(),
  pageUrl: z.string().url().nullable().optional(),
})
export const updateLeadSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  budget: z.string().max(200).nullable().optional(),
  propertyType: z.string().max(100).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  timeline: z.string().max(200).nullable().optional(),
  status: z.enum(['new','qualified','contacted','won','lost']).optional(),
  notes: z.string().max(5000).nullable().optional(),
  assignedToId: z.string().nullable().optional(),
})
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
