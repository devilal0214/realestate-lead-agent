import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const kbs = await prisma.knowledgeBase.findMany({
    where: { organizationId: id },
    include: { _count: { select: { documents: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: kbs })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership || !hasRole(membership.role as Role, 'manager')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const kb = await prisma.knowledgeBase.create({
    data: { organizationId: id, ...parsed.data },
  })

  return NextResponse.json({ data: kb }, { status: 201 })
}
