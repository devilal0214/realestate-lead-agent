import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { z } from 'zod'

const createOrgSchema = z.object({
  name: z.string().min(2).max(80),
})

// GET /api/organizations — list user's organizations
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: memberships })
}

// POST /api/organizations — create organization
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createOrgSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const slug = generateSlug(parsed.data.name)
  let finalSlug = slug
  let attempt = 0
  while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${++attempt}`
  }

  const org = await prisma.organization.create({
    data: { name: parsed.data.name, slug: finalSlug },
  })

  const membership = await prisma.membership.create({
    data: {
      userId: session.user.id,
      organizationId: org.id,
      role: 'owner',
    },
    include: { organization: true },
  })

  return NextResponse.json({ data: membership }, { status: 201 })
}
