import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/industries/[id]/pricing/[plan] - Update pricing (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; plan: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      monthlyPrice,
      yearlyPrice,
      setupFee,
      trialDays,
      messageLimit,
      chatbotLimit,
      leadLimit,
      storageLimit,
      isActive,
    } = body

    const pricing = await prisma.industryPricing.upsert({
      where: {
        industryId_plan: {
          industryId: params.id,
          plan: params.plan,
        },
      },
      update: {
        monthlyPrice,
        yearlyPrice,
        setupFee,
        trialDays,
        messageLimit,
        chatbotLimit,
        leadLimit,
        storageLimit,
        isActive,
      },
      create: {
        industryId: params.id,
        plan: params.plan,
        monthlyPrice: monthlyPrice || 0,
        yearlyPrice: yearlyPrice || 0,
        setupFee: setupFee || 0,
        trialDays: trialDays || 0,
        messageLimit: messageLimit ?? -1,
        chatbotLimit: chatbotLimit ?? -1,
        leadLimit: leadLimit ?? -1,
        storageLimit: storageLimit || 1000,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ pricing })
  } catch (error) {
    console.error('Error updating pricing:', error)
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    )
  }
}
