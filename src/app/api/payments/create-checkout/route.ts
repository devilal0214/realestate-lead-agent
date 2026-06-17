import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// POST /api/payments/create-checkout - Create Stripe checkout session
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { organizationId, industryId, plan, billingPeriod } = body

    // Validate required fields
    if (!organizationId || !industryId || !plan || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
      include: {
        organization: true,
      },
    })

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify industry and pricing exist
    const pricing = await prisma.industryPricing.findUnique({
      where: {
        industryId_plan: {
          industryId,
          plan,
        },
      },
      include: {
        industry: true,
      },
    })

    if (!pricing || !pricing.isActive) {
      return NextResponse.json(
        { error: 'Invalid pricing configuration' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      organizationId,
      industryId,
      plan,
      billingPeriod,
      customerEmail: session.user.email || '',
      customerName: membership.organization.name,
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
