import { NextRequest, NextResponse } from 'next/server'
import { stripe, handleStripeWebhook } from '@/lib/stripe'
import Stripe from 'stripe'

// Disable body parser for webhooks
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/payments/webhook - Stripe webhook handler
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    ) as Stripe.Event

    // Handle the event
    await handleStripeWebhook(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    )
  }
}
