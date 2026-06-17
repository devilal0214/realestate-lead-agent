import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '20')
  const skip = (page - 1) * limit

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { organizationId: id, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        chatbot: { select: { name: true } },
        _count: { select: { messages: true } },
        lead: { select: { name: true, email: true } },
      },
    }),
    prisma.conversation.count({ where: { organizationId: id, isArchived: false } }),
  ])

  return NextResponse.json({ data: conversations, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
}
