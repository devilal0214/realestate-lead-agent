import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { RecentLeadsTable } from '@/components/dashboard/recent-leads-table'
import { RecentConversationsTable } from '@/components/dashboard/recent-conversations-table'
import type { DashboardStats } from '@/types'

export const metadata = { title: 'Dashboard' }

async function getDashboardData(orgId: string) {
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalLeads, totalConversations, activeBots, leadsThisMonth, conversationsThisMonth, usageRow, recentLeads, recentConversations] = await Promise.all([
    prisma.lead.count({ where: { organizationId: orgId } }),
    prisma.conversation.count({ where: { organizationId: orgId } }),
    prisma.chatbot.count({ where: { organizationId: orgId, isArchived: false } }),
    prisma.lead.count({ where: { organizationId: orgId, createdAt: { gte: firstOfMonth } } }),
    prisma.conversation.count({ where: { organizationId: orgId, createdAt: { gte: firstOfMonth } } }),
    prisma.usageTracking.findFirst({ where: { organizationId: orgId, month: monthStr } }),
    prisma.lead.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' }, take: 5, include: { chatbot: { select: { id: true, name: true } } } }),
    prisma.conversation.findMany({ where: { organizationId: orgId }, orderBy: { updatedAt: 'desc' }, take: 5, include: { chatbot: { select: { id: true, name: true } }, _count: { select: { messages: true } } } }),
  ])

  const stats: DashboardStats = {
    totalLeads,
    totalConversations,
    activeBots,
    messagesThisMonth: usageRow?.messageCount ?? 0,
    leadsThisMonth,
    conversationsThisMonth,
  }

  return { stats, recentLeads, recentConversations }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) redirect('/onboarding')

  const { stats, recentLeads, recentConversations } = await getDashboardData(membership.organizationId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Your real estate lead generation overview</p>
      </div>

      <OverviewCards stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentLeadsTable leads={recentLeads} />
        <RecentConversationsTable conversations={recentConversations} />
      </div>
    </div>
  )
}
