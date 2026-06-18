import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders } from "@/lib/cors";

// Public endpoint - no auth required - used by embedded widget to fetch bot config
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const bot = await prisma.chatbot.findUnique({
    where: { id, isArchived: false },
    select: {
      id: true,
      name: true,
      welcomeMessage: true,
      themeColor: true,
      fontFamily: true,
      widgetPosition: true,
      logoUrl: true,
      leadCaptureEnabled: true,
    },
  })

  if (!bot) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
  }

  return NextResponse.json({ data: bot }, { headers: corsHeaders });
}
