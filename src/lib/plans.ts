// Plan limits and feature gates
export type Plan = 'free' | 'starter' | 'pro' | 'enterprise'

export interface PlanLimits {
  maxChatbots: number   // -1 = unlimited
  maxMessages: number   // -1 = unlimited
  maxLeads: number      // -1 = unlimited
  maxMembers: number    // -1 = unlimited
  knowledgeBases: number
  documentsPerKb: number
  customColors: boolean
  customFonts: boolean
  logoUpload: boolean
  removeBranding: boolean
  csvExport: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxChatbots: 1, maxMessages: 200, maxLeads: 20, maxMembers: 2,
    knowledgeBases: 0, documentsPerKb: 0,
    customColors: false, customFonts: false, logoUpload: false, removeBranding: false, csvExport: false,
  },
  starter: {
    maxChatbots: 3, maxMessages: 2000, maxLeads: 200, maxMembers: 5,
    knowledgeBases: 1, documentsPerKb: 10,
    customColors: true, customFonts: false, logoUpload: true, removeBranding: false, csvExport: true,
  },
  pro: {
    maxChatbots: 10, maxMessages: 10000, maxLeads: 1000, maxMembers: 20,
    knowledgeBases: 5, documentsPerKb: 50,
    customColors: true, customFonts: true, logoUpload: true, removeBranding: true, csvExport: true,
  },
  enterprise: {
    maxChatbots: -1, maxMessages: -1, maxLeads: -1, maxMembers: -1,
    knowledgeBases: -1, documentsPerKb: -1,
    customColors: true, customFonts: true, logoUpload: true, removeBranding: true, csvExport: true,
  },
}

export function canCreateBot(plan: Plan, currentCount: number): boolean {
  const l = PLAN_LIMITS[plan]
  return l.maxChatbots === -1 || currentCount < l.maxChatbots
}

export function canSendMessage(plan: Plan, currentMonthCount: number): boolean {
  const l = PLAN_LIMITS[plan]
  return l.maxMessages === -1 || currentMonthCount < l.maxMessages
}

export function canAddMember(plan: Plan, currentCount: number): boolean {
  const l = PLAN_LIMITS[plan]
  return l.maxMembers === -1 || currentCount < l.maxMembers
}
