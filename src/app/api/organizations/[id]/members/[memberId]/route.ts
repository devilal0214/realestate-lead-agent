import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

type Params = { params: Promise<{ id: string; memberId: string }> }

// PATCH /api/organizations/[id]/members/[memberId] — update role
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, memberId } = await params
  const myMembership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!myMembership || !hasRole(myMembership.role as Role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = z.object({ role: z.enum(['admin', 'manager', 'member', 'viewer']) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const target = await prisma.membership.findUnique({ where: { id: memberId } })
  if (!target || target.role === 'owner') {
    return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
  }

  const updated = await prisma.membership.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
  })

  return NextResponse.json({ data: updated })
}

// DELETE /api/organizations/[id]/members/[memberId] — remove member
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, memberId } = await params
  const myMembership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!myMembership || !hasRole(myMembership.role as Role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const target = await prisma.membership.findUnique({ where: { id: memberId } })
  if (!target || target.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 })
  }

  await prisma.membership.delete({ where: { id: memberId } })
  return NextResponse.json({ message: 'Member removed' })
}
