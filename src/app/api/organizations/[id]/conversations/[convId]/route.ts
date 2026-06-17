import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string; convId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, convId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const conv = await prisma.conversation.findFirst({
    where: { id: convId, organizationId: id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      chatbot: { select: { name: true, themeColor: true } },
      lead: true,
    },
  })
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: conv })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, convId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.conversation.delete({ where: { id: convId } })
  return NextResponse.json({ message: 'Deleted' })
}
