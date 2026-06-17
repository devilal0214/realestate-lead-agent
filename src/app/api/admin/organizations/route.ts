import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '20')
  const skip = (page - 1) * limit
  const search = url.searchParams.get('search') ?? ''
  const where = search ? { OR: [{ name: { contains: search } }] } : {}

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: { select: { memberships: true, chatbots: true, leads: true } },
        subscriptions: { select: { plan: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ])

  return NextResponse.json({ data: orgs, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
}
