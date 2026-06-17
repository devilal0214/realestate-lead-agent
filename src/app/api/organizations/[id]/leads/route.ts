import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


// GET /api/organizations/[id]/leads
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const url = new URL(request.url)
  const search = url.searchParams.get('search') ?? ''
  const status = url.searchParams.get('status') ?? ''
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '20')
  const skip = (page - 1) * limit

  const where = {
    organizationId: id,
    ...(search ? { OR: [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ]} : {}),
    ...(status ? { status } : {}),
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.lead.count({ where }),
  ])

  return NextResponse.json({ data: leads, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
}
