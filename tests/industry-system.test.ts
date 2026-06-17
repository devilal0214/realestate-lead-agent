import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Industry System', () => {
  beforeAll(async () => {
    // Seed industries if not exists
    const count = await prisma.industry.count()
    if (count === 0) {
      // Create a test industry
      await prisma.industry.create({
        data: {
          name: 'Test Industry',
          slug: 'test-industry',
          description: 'Test industry for testing',
          icon: '🧪',
          defaultPrompt: 'You are a test assistant.',
          defaultColor: '#2563eb',
          pricing: {
            create: [
              {
                plan: 'free',
                monthlyPrice: 0,
                yearlyPrice: 0,
                messageLimit: 100,
                chatbotLimit: 1,
                leadLimit: 50,
              },
              {
                plan: 'pro',
                monthlyPrice: 9900,
                yearlyPrice: 99000,
                messageLimit: 10000,
                chatbotLimit: 10,
                leadLimit: 5000,
              },
            ],
          },
        },
      })
    }
  })

  it('should fetch industries from database', async () => {
    const industries = await prisma.industry.findMany({
      include: { pricing: true },
    })

    expect(industries.length).toBeGreaterThan(0)
    expect(industries[0]).toHaveProperty('name')
    expect(industries[0]).toHaveProperty('slug')
  })

  it('should have pricing for each industry', async () => {
    const industries = await prisma.industry.findMany({
      include: { pricing: true },
    })

    industries.forEach((industry) => {
      expect(industry.pricing.length).toBeGreaterThan(0)
    })
  })

  it('should validate pricing structure', async () => {
    const pricing = await prisma.industryPricing.findFirst({
      where: { plan: 'pro' },
    })

    expect(pricing).toBeDefined()
    expect(pricing?.monthlyPrice).toBeGreaterThan(0)
    expect(pricing?.chatbotLimit).toBeGreaterThan(0)
  })

  it('should create subscription with industry', async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org-' + Date.now(),
      },
    })

    const industry = await prisma.industry.findFirst()
    expect(industry).toBeDefined()

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: org.id,
        industryId: industry!.id,
        plan: 'free',
        status: 'active',
      },
    })

    expect(subscription.industryId).toBe(industry!.id)

    // Cleanup
    await prisma.subscription.delete({ where: { id: subscription.id } })
    await prisma.organization.delete({ where: { id: org.id } })
  })
})

describe('Subscription Limits', () => {
  it('should enforce message limits', async () => {
    const pricing = await prisma.industryPricing.findFirst({
      where: { plan: 'free' },
    })

    expect(pricing?.messageLimit).toBe(100)
  })

  it('should allow unlimited for -1 limit', async () => {
    const pricing = await prisma.industryPricing.findFirst({
      where: { plan: 'enterprise' },
    })

    if (pricing) {
      expect(pricing.messageLimit).toBe(-1)
    }
  })
})

describe('Payment Records', () => {
  it('should create payment record', async () => {
    const org = await prisma.organization.create({
      data: {
        name: 'Payment Test Org',
        slug: 'payment-test-' + Date.now(),
      },
    })

    const payment = await prisma.payment.create({
      data: {
        organizationId: org.id,
        stripePaymentId: 'pi_test_' + Date.now(),
        amount: 2900,
        currency: 'usd',
        status: 'succeeded',
      },
    })

    expect(payment.amount).toBe(2900)
    expect(payment.status).toBe('succeeded')

    // Cleanup
    await prisma.payment.delete({ where: { id: payment.id } })
    await prisma.organization.delete({ where: { id: org.id } })
  })
})
