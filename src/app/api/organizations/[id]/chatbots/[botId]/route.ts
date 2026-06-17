import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateChatbotSchema } from '@/lib/validations/chatbot'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

type Params = { params: Promise<{ id: string; botId: string }> }

async function getBot(botId: string, orgId: string) {
  return prisma.chatbot.findFirst({ where: { id: botId, organizationId: orgId } })
}

// GET /api/organizations/[id]/chatbots/[botId]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, botId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const bot = await getBot(botId, id)
  if (!bot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })

  return NextResponse.json({ data: bot })
}

// PATCH /api/organizations/[id]/chatbots/[botId]
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, botId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership || !hasRole(membership.role as Role, 'manager')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const bot = await getBot(botId, id)
  if (!bot) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const parsed = updateChatbotSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

  const updated = await prisma.chatbot.update({ where: { id: botId }, data: parsed.data })
  return NextResponse.json({ data: updated })
}

// DELETE /api/organizations/[id]/chatbots/[botId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, botId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership || !hasRole(membership.role as Role, 'manager')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  await prisma.chatbot.delete({ where: { id: botId } })
  return NextResponse.json({ message: 'Deleted' })
}
