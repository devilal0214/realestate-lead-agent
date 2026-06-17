import type { Prisma } from '@prisma/client'

export type User = Prisma.UserGetPayload<object>
export type Organization = Prisma.OrganizationGetPayload<object>
export type Membership = Prisma.MembershipGetPayload<object>
export type Chatbot = Prisma.ChatbotGetPayload<object>
export type Conversation = Prisma.ConversationGetPayload<object>
export type Message = Prisma.MessageGetPayload<object>
export type Lead = Prisma.LeadGetPayload<object>
export type UsageTracking = Prisma.UsageTrackingGetPayload<object>
export type Subscription = Prisma.SubscriptionGetPayload<object>

export type ChatbotWithUsage = Chatbot & {
  conversationCount?: number
  leadCount?: number
  messageCount?: number
}

export type LeadWithConversation = Lead & {
  chatbot?: Pick<Chatbot, 'id' | 'name'> | null
  conversation?: Pick<Conversation, 'id' | 'createdAt'> | null
}

export type ConversationWithMessages = Conversation & {
  messages: Message[]
  chatbot?: Pick<Chatbot, 'id' | 'name'> | null
  lead?: Pick<Lead, 'id' | 'name' | 'email'> | null
}

export type Role = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'won' | 'lost'
export type Plan = 'free' | 'starter' | 'pro' | 'enterprise'

export interface DashboardStats {
  totalLeads: number
  totalConversations: number
  messagesThisMonth: number
  activeBots: number
  leadsThisMonth: number
  conversationsThisMonth: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
