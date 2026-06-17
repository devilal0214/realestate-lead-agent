import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/industries/[id] - Get industry by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const industry = await prisma.industry.findUnique({
      where: { id: params.id },
      include: {
        pricing: {
          where: { isActive: true },
          orderBy: { monthlyPrice: 'asc' },
        },
        features: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
        },
        prompts: {
          where: { isActive: true },
        },
      },
    })

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ industry })
  } catch (error) {
    console.error('Error fetching industry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch industry' },
      { status: 500 }
    )
  }
}

// PUT /api/industries/[id] - Update industry (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      isActive,
      sortOrder,
    } = body

    const industry = await prisma.industry.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        icon,
        defaultPrompt,
        defaultColor,
        isActive,
        sortOrder,
      },
      include: {
        pricing: true,
        features: true,
      },
    })

    return NextResponse.json({ industry })
  } catch (error) {
    console.error('Error updating industry:', error)
    return NextResponse.json(
      { error: 'Failed to update industry' },
      { status: 500 }
    )
  }
}

// DELETE /api/industries/[id] - Delete industry (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if any chatbots are using this industry
    const chatbotCount = await prisma.chatbotIndustry.count({
      where: { industryId: params.id },
    })

    if (chatbotCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete industry. ${chatbotCount} chatbot(s) are using this industry.`,
        },
        { status: 400 }
      )
    }

    await prisma.industry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting industry:', error)
    return NextResponse.json(
      { error: 'Failed to delete industry' },
      { status: 500 }
    )
  }
}
