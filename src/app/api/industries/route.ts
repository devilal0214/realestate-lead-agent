import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/industries - List all active industries
export async function GET() {
  try {
    const industries = await prisma.industry.findMany({
      where: { isActive: true },
      include: {
        pricing: {
          where: { isActive: true },
          orderBy: { monthlyPrice: 'asc' },
        },
        features: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ industries })
  } catch (error) {
    console.error('Error fetching industries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch industries' },
      { status: 500 }
    )
  }
}

// POST /api/industries - Create new industry (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      slug,
      description,
      icon,
      defaultPrompt,
      defaultColor,
      features,
      pricing,
    } = body

    // Validate required fields
    if (!name || !slug || !defaultPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create industry with features and pricing
    const industry = await prisma.industry.create({
      data: {
        name,
        slug,
        description,
        icon,
        defaultPrompt,
        defaultColor: defaultColor || '#2563eb',
        features: features
          ? {
              create: features.map((f: { name: string; description?: string; isEnabled?: boolean }, index: number) => ({
                name: f.name,
                description: f.description,
                isEnabled: f.isEnabled ?? true,
                sortOrder: index,
              })),
            }
          : undefined,
        pricing: pricing
          ? {
              create: pricing.map((p: { plan: string; monthlyPrice?: number; yearlyPrice?: number; setupFee?: number; trialDays?: number; messageLimit?: number; chatbotLimit?: number; leadLimit?: number; storageLimit?: number }) => ({
                plan: p.plan,
                monthlyPrice: p.monthlyPrice || 0,
                yearlyPrice: p.yearlyPrice || 0,
                setupFee: p.setupFee || 0,
                trialDays: p.trialDays || 0,
                messageLimit: p.messageLimit ?? -1,
                chatbotLimit: p.chatbotLimit ?? -1,
                leadLimit: p.leadLimit ?? -1,
                storageLimit: p.storageLimit || 1000,
              })),
            }
          : undefined,
      },
      include: {
        features: true,
        pricing: true,
      },
    })

    return NextResponse.json({ industry }, { status: 201 })
  } catch (error) {
    console.error('Error creating industry:', error)
    return NextResponse.json(
      { error: 'Failed to create industry' },
      { status: 500 }
    )
  }
}
