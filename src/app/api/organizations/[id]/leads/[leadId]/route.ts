import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateLeadSchema } from '@/lib/validations/lead'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

type Params = { params: Promise<{ id: string; leadId: string }> }

// GET /api/organizations/[id]/leads/[leadId]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, leadId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: id },
    include: { conversation: { include: { messages: { orderBy: { createdAt: 'asc' } } } } },
  })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  return NextResponse.json({ data: lead })
}

// PATCH /api/organizations/[id]/leads/[leadId]
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, leadId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership || !hasRole(membership.role as Role, 'member')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateLeadSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

  const lead = await prisma.lead.update({ where: { id: leadId }, data: parsed.data })
  return NextResponse.json({ data: lead })
}

// DELETE /api/organizations/[id]/leads/[leadId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, leadId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership || !hasRole(membership.role as Role, 'manager')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  await prisma.lead.delete({ where: { id: leadId } })
  return NextResponse.json({ message: 'Lead deleted' })
}
