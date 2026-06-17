import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { chatbotSchema } from '@/lib/validations/chatbot'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'
import { canCreateBot } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

async function getOrgAndMembership(userId: string, orgId: string) {
  const [membership, org] = await Promise.all([
    prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.organization.findUnique({ where: { id: orgId } }),
  ])
  return { membership, org }
}

// GET /api/organizations/[id]/chatbots
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { membership } = await getOrgAndMembership(session.user.id, id)
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const bots = await prisma.chatbot.findMany({
    where: { organizationId: id, isArchived: false },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { conversations: true, leads: true } } },
  })

  return NextResponse.json({ data: bots })
}

// POST /api/organizations/[id]/chatbots
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { membership, org } = await getOrgAndMembership(session.user.id, id)
  if (!membership || !hasRole(membership.role as Role, 'manager')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const plan = (org?.plan ?? 'free') as Plan
  const botCount = await prisma.chatbot.count({ where: { organizationId: id, isArchived: false } })
  if (!canCreateBot(plan, botCount)) {
    return NextResponse.json({ error: 'Plan limit reached. Upgrade to create more chatbots.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = chatbotSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })

  const bot = await prisma.chatbot.create({
    data: {
      organizationId: id,
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? null,
      knowledgeBaseId: parsed.data.knowledgeBaseId ?? null,
    },
  })

  return NextResponse.json({ data: bot }, { status: 201 })
}
