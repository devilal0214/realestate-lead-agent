import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cancelSubscription } from '@/lib/stripe'

// POST /api/subscriptions/cancel - Cancel subscription
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { organizationId, immediate } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId' },
        { status: 400 }
      )
    }

    // Verify user is owner or admin
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    })

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    })

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      )
    }

    // Cancel in Stripe
    await cancelSubscription(subscription.stripeSubscriptionId, !immediate)

    // Update local record
    await prisma.subscription.update({
      where: { organizationId },
      data: {
        cancelAtPeriodEnd: !immediate,
        ...(immediate ? { status: 'canceled', canceledAt: new Date() } : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
