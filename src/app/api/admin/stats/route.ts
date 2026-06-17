import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [users, organizations, chatbots, conversations, leads, messages] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.chatbot.count(),
    prisma.conversation.count(),
    prisma.lead.count(),
    prisma.message.count(),
  ])

  return NextResponse.json({
    data: { users, organizations, chatbots, conversations, leads, messages },
  })
}
