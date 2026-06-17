import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/organizations/[id]/analytics
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  const [chatbots, conversations, leads, thisMonthUsage, lastMonthUsage, recentLeads, recentConvs] = await Promise.all([
    prisma.chatbot.count({ where: { organizationId: id, isArchived: false } }),
    prisma.conversation.count({ where: { organizationId: id } }),
    prisma.lead.count({ where: { organizationId: id } }),
    prisma.usageTracking.aggregate({ where: { organizationId: id, month: thisMonth }, _sum: { messageCount: true, tokenCount: true, leadCount: true } }),
    prisma.usageTracking.aggregate({ where: { organizationId: id, month: lastMonth }, _sum: { messageCount: true } }),
    prisma.lead.findMany({ where: { organizationId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.conversation.findMany({ where: { organizationId: id }, orderBy: { updatedAt: 'desc' }, take: 5, include: { chatbot: { select: { name: true } }, _count: { select: { messages: true } } } }),
  ])

  // Monthly usage for last 6 months
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthlyUsage = await prisma.usageTracking.findMany({
    where: { organizationId: id, month: { in: months } },
  })

  const monthlyData = months.map(m => {
    const u = monthlyUsage.filter(r => r.month === m)
    return {
      month: m,
      messages: u.reduce((s, r) => s + r.messageCount, 0),
      conversations: u.reduce((s, r) => s + r.conversationCount, 0),
      leads: u.reduce((s, r) => s + r.leadCount, 0),
    }
  })

  return NextResponse.json({
    data: {
      overview: { chatbots, conversations, leads, messagesThisMonth: thisMonthUsage._sum.messageCount ?? 0, tokensThisMonth: thisMonthUsage._sum.tokenCount ?? 0 },
      trend: {
        messageGrowth: calcGrowth(thisMonthUsage._sum.messageCount ?? 0, lastMonthUsage._sum.messageCount ?? 0),
      },
      monthlyData,
      recentLeads,
      recentConversations: recentConvs,
    },
  })
}

function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}
