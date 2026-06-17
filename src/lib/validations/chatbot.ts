import { z } from 'zod'

export const chatbotSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  welcomeMessage: z.string().min(1).max(500).default("Hi! How can I help you today?"),
  systemPrompt: z.string().min(10).max(10000),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#2563eb'),
  fontFamily: z.string().default('Inter'),
  widgetPosition: z.enum(['bottom-right','bottom-left','top-right','top-left']).default('bottom-right'),
  leadCaptureEnabled: z.boolean().default(true),
  knowledgeBaseId: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
})
export const updateChatbotSchema = chatbotSchema.partial()
export type ChatbotInput = z.infer<typeof chatbotSchema>
