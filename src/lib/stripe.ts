import Stripe from 'stripe'

// Allow Stripe to be uninitialized in test/development without keys
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  currency: 'usd',
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=canceled`,
}

/**
 * Create or retrieve a Stripe customer for an organization
 */
export async function getOrCreateStripeCustomer(
  organizationId: string,
  email: string,
  name?: string
): Promise<string> {
  const { prisma } = await import('@/lib/prisma')
  
  // Check if organization already has a Stripe customer
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true },
  })

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId,
    },
  })

  // Update subscription with customer ID
  await prisma.subscription.upsert({
    where: { organizationId },
    update: { stripeCustomerId: customer.id },
    create: {
      organizationId,
      stripeCustomerId: customer.id,
    },
  })

  return customer.id
}

/**
 * Create a Stripe checkout session for a subscription
 */
export async function createCheckoutSession(params: {
  organizationId: string
  industryId: string
  plan: string
  billingPeriod: 'monthly' | 'yearly'
  customerEmail: string
  customerName?: string
}): Promise<Stripe.Checkout.Session> {
  const { prisma } = await import('@/lib/prisma')

  // Get pricing
  const pricing = await prisma.industryPricing.findUnique({
    where: {
      industryId_plan: {
        industryId: params.industryId,
        plan: params.plan,
      },
    },
    include: {
      industry: true,
    },
  })

  if (!pricing || !pricing.isActive) {
    throw new Error('Invalid pricing configuration')
  }

  const customerId = await getOrCreateStripeCustomer(
    params.organizationId,
    params.customerEmail,
    params.customerName
  )

  const amount = params.billingPeriod === 'monthly' ? pricing.monthlyPrice : pricing.yearlyPrice
  const interval = params.billingPeriod === 'monthly' ? 'month' : 'year'

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: `${pricing.industry.name} - ${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)} Plan`,
            description: pricing.industry.description || undefined,
          },
          recurring: {
            interval,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: pricing.trialDays > 0 ? pricing.trialDays : undefined,
      metadata: {
        organizationId: params.organizationId,
        industryId: params.industryId,
        plan: params.plan,
      },
    },
    metadata: {
      organizationId: params.organizationId,
      industryId: params.industryId,
      plan: params.plan,
    },
    success_url: STRIPE_CONFIG.successUrl,
    cancel_url: STRIPE_CONFIG.cancelUrl,
  })

  return session
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  const { prisma } = await import('@/lib/prisma')

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { organizationId, industryId, plan } = session.metadata || {}

      if (!organizationId || !industryId || !plan) {
        console.error('Missing metadata in checkout session')
        break
      }

      // Create subscription record
      await prisma.subscription.upsert({
        where: { organizationId },
        update: {
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          industryId,
          plan,
          status: 'active',
        },
        create: {
          organizationId,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          industryId,
          plan,
          status: 'active',
        },
      })

      // Update organization plan
      await prisma.organization.update({
        where: { id: organizationId },
        data: { plan },
      })

      // Create payment record
      await prisma.payment.create({
        data: {
          organizationId,
          stripePaymentId: session.payment_intent as string,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: 'succeeded',
          paymentMethod: 'card',
          receiptUrl: session.invoice ? undefined : null,
        },
      })

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const organizationId = subscription.metadata.organizationId

      if (!organizationId) break

      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
        },
      })

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const organizationId = subscription.metadata.organizationId

      if (!organizationId) break

      // Downgrade to free plan
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
        },
      })

      await prisma.organization.update({
        where: { id: organizationId },
        data: { plan: 'free' },
      })

      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const organizationId = invoice.metadata?.organizationId

      if (!organizationId) break

      // Create payment record
      await prisma.payment.create({
        data: {
          organizationId,
          stripePaymentId: invoice.payment_intent as string,
          stripeCustomerId: invoice.customer as string,
          stripeSubscriptionId: invoice.subscription as string,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          paymentMethod: 'card',
          receiptUrl: invoice.hosted_invoice_url || null,
          invoiceUrl: invoice.invoice_pdf || null,
        },
      })

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'past_due' },
      })

      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  })
}

/**
 * Resume a subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Get subscription usage and limits
 */
export async function getSubscriptionLimits(organizationId: string) {
  const { prisma } = await import('@/lib/prisma')

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      organization: true,
    },
  })

  if (!subscription || !subscription.industryId) {
    // Return free plan limits
    return {
      messageLimit: 100,
      chatbotLimit: 1,
      leadLimit: 50,
      storageLimit: 1000,
    }
  }

  const pricing = await prisma.industryPricing.findUnique({
    where: {
      industryId_plan: {
        industryId: subscription.industryId,
        plan: subscription.plan,
      },
    },
  })

  if (!pricing) {
    throw new Error('Pricing configuration not found')
  }

  return {
    messageLimit: pricing.messageLimit,
    chatbotLimit: pricing.chatbotLimit,
    leadLimit: pricing.leadLimit,
    storageLimit: pricing.storageLimit,
  }
}

/**
 * Check if organization can perform action based on limits
 */
export async function checkLimit(
  organizationId: string,
  limitType: 'messages' | 'chatbots' | 'leads'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const { prisma } = await import('@/lib/prisma')
  
  const limits = await getSubscriptionLimits(organizationId)
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  let current = 0
  let limit = 0

  switch (limitType) {
    case 'messages': {
      const usage = await prisma.usageTracking.findFirst({
        where: { organizationId, month: currentMonth },
        select: { messageCount: true },
      })
      current = usage?.messageCount || 0
      limit = limits.messageLimit
      break
    }
    case 'chatbots': {
      const count = await prisma.chatbot.count({
        where: { organizationId, isArchived: false },
      })
      current = count
      limit = limits.chatbotLimit
      break
    }
    case 'leads': {
      const usage = await prisma.usageTracking.findFirst({
        where: { organizationId, month: currentMonth },
        select: { leadCount: true },
      })
      current = usage?.leadCount || 0
      limit = limits.leadLimit
      break
    }
  }

  return {
    allowed: limit === -1 || current < limit,
    current,
    limit,
  }
}
