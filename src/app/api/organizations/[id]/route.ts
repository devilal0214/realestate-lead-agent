import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

type Params = { params: Promise<{ id: string }> }

async function getMembership(userId: string, orgId: string) {
  return prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  })
}

// GET /api/organizations/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await getMembership(session.user.id, id)
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      _count: { select: { chatbots: true, leads: true, conversations: true } },
    },
  })

  return NextResponse.json({ data: org })
}

// PATCH /api/organizations/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await getMembership(session.user.id, id)
  if (!membership || !hasRole(membership.role as Role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = z.object({
    name: z.string().min(2).max(80).optional(),
    logo: z.string().url().nullable().optional(),
  }).safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const org = await prisma.organization.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({ data: org })
}

// DELETE /api/organizations/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await getMembership(session.user.id, id)
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can delete the organization' }, { status: 403 })
  }

  await prisma.organization.delete({ where: { id } })
  return NextResponse.json({ message: 'Organization deleted' })
}
