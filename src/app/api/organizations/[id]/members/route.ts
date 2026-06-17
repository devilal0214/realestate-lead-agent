import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

type Params = { params: Promise<{ id: string }> }

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).default('member'),
})

// GET /api/organizations/[id]/members
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const members = await prisma.membership.findMany({
    where: { organizationId: id },
    include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: members })
}

// POST /api/organizations/[id]/members — invite (creates membership for existing user)
export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const myMembership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!myMembership || !hasRole(myMembership.role as Role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return NextResponse.json({ error: 'User not found. They must sign up first.' }, { status: 404 })

  const existing = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: id } },
  })
  if (existing) return NextResponse.json({ error: 'User is already a member' }, { status: 409 })

  const membership = await prisma.membership.create({
    data: { userId: user.id, organizationId: id, role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ data: membership }, { status: 201 })
}
