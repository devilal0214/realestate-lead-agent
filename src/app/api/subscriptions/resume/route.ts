import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resumeSubscription } from '@/lib/stripe'

// POST /api/subscriptions/resume - Resume canceled subscription
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { organizationId } = body

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
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      )
    }

    // Resume in Stripe
    await resumeSubscription(subscription.stripeSubscriptionId)

    // Update local record
    await prisma.subscription.update({
      where: { organizationId },
      data: {
        cancelAtPeriodEnd: false,
        status: 'active',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resuming subscription:', error)
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    )
  }
}
