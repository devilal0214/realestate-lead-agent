export type Plan = 'free' | 'starter' | 'pro' | 'enterprise'

export interface PlanLimits {
  maxBots: number
  maxMessagesPerMonth: number
  customBranding: boolean
  customColors: boolean
  customFonts: boolean
  logoUpload: boolean
  removeBranding: boolean
  analyticsRetentionDays: number
  csvExport: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxBots: 1,
    maxMessagesPerMonth: 100,
    customBranding: false,
    customColors: false,
    customFonts: false,
    logoUpload: false,
    removeBranding: false,
    analyticsRetentionDays: 7,
    csvExport: false,
  },
  starter: {
    maxBots: 3,
    maxMessagesPerMonth: 1000,
    customBranding: true,
    customColors: true,
    customFonts: false,
    logoUpload: true,
    removeBranding: false,
    analyticsRetentionDays: 30,
    csvExport: true,
  },
  pro: {
    maxBots: 10,
    maxMessagesPerMonth: 10000,
    customBranding: true,
    customColors: true,
    customFonts: true,
    logoUpload: true,
    removeBranding: true,
    analyticsRetentionDays: 90,
    csvExport: true,
  },
  enterprise: {
    maxBots: Infinity,
    maxMessagesPerMonth: Infinity,
    customBranding: true,
    customColors: true,
    customFonts: true,
    logoUpload: true,
    removeBranding: true,
    analyticsRetentionDays: 365,
    csvExport: true,
  },
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export function canCreateBot(plan: Plan, currentBotCount: number): boolean {
  const limits = getPlanLimits(plan)
  return currentBotCount < limits.maxBots
}

export function canSendMessage(plan: Plan, currentMonthMessages: number): boolean {
  const limits = getPlanLimits(plan)
  if (limits.maxMessagesPerMonth === Infinity) return true
  return currentMonthMessages < limits.maxMessagesPerMonth
}

export function hasFeature(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return false
}

export const PLAN_DISPLAY: Record<Plan, { label: string; color: string; price: string }> = {
  free: { label: 'Free', color: 'bg-gray-100 text-gray-800', price: '$0/mo' },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-800', price: '$29/mo' },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-800', price: '$99/mo' },
  enterprise: { label: 'Enterprise', color: 'bg-yellow-100 text-yellow-800', price: 'Custom' },
}
