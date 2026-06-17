import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSubscriptionLimits } from '@/lib/stripe'

// GET /api/subscriptions - Get current subscription and usage
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId' },
        { status: 400 }
      )
    }

    // Verify user has access to organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        organization: true,
      },
    })

    // Get limits
    const limits = await getSubscriptionLimits(organizationId)

    // Get current usage
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const usage = await prisma.usageTracking.findFirst({
      where: {
        organizationId,
        month: currentMonth,
      },
    })

    const chatbotCount = await prisma.chatbot.count({
      where: {
        organizationId,
        isArchived: false,
      },
    })

    return NextResponse.json({
      subscription,
      limits,
      usage: {
        messages: usage?.messageCount || 0,
        leads: usage?.leadCount || 0,
        chatbots: chatbotCount,
      },
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
