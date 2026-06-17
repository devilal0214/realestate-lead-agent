import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateChatResponse, extractLeadInfo } from '@/lib/ai'
import { chatMessageSchema } from '@/lib/validations/lead'
import { rateLimit, RATE_LIMITS } from '@/lib/limiter'
import { canSendMessage } from '@/lib/plans'
import type { Plan } from '@/lib/plans'
import { getCurrentMonth, getIpFromRequest } from '@/lib/utils'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

export async function POST(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request)
    const rl = rateLimit(ip, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowMs)
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: CORS })
    }

    const body = await request.json()
    const parsed = chatMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: CORS })
    }

    const { botId, message, sessionId, visitorId, pageUrl } = parsed.data

    const bot = await prisma.chatbot.findFirst({
      where: { id: botId, isActive: true, isArchived: false },
      include: { organization: { select: { plan: true } } },
    })
    if (!bot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404, headers: CORS })
    }

    const plan = (bot.organization?.plan ?? 'free') as Plan
    const month = getCurrentMonth()

    const usage = await prisma.usageTracking.findUnique({
      where: { organizationId_chatbotId_month: { organizationId: bot.organizationId, chatbotId: botId, month } },
    })
    if (!canSendMessage(plan, usage?.messageCount ?? 0)) {
      return NextResponse.json({
        error: 'Monthly message limit reached',
        reply: "I'm sorry, this chatbot has reached its monthly message limit.",
      }, { status: 429, headers: CORS })
    }

    let conversation = await prisma.conversation.findFirst({ where: { chatbotId: botId, sessionId } })
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { chatbotId: botId, organizationId: bot.organizationId, sessionId, visitorId: visitorId ?? null, pageUrl: pageUrl ?? null },
      })
      await upsertUsage(bot.organizationId, botId, month, 0, 0, 1, 0)
    }

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    await prisma.message.create({ data: { conversationId: conversation.id, role: 'user', content: message } })

    const chatMessages = [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const { content: reply, tokensUsed } = await generateChatResponse(chatMessages, bot.systemPrompt)
    await prisma.message.create({ data: { conversationId: conversation.id, role: 'assistant', content: reply, tokensUsed } })
    await upsertUsage(bot.organizationId, botId, month, 2, tokensUsed, 0, 0)

    let leadCaptured = false
    if (bot.leadCaptureEnabled) {
      const existingLead = await prisma.lead.findUnique({ where: { conversationId: conversation.id } })
      if (!existingLead) {
        const fullText = [...chatMessages, { role: 'assistant', content: reply }]
          .map(m => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`).join('\n')
        const extracted = await extractLeadInfo(fullText)
        if (extracted.email || extracted.phone || extracted.name) {
          await prisma.lead.create({
            data: { organizationId: bot.organizationId, chatbotId: botId, conversationId: conversation.id, ...extracted, status: 'new', source: 'widget' },
          })
          await upsertUsage(bot.organizationId, botId, month, 0, 0, 0, 1)
          leadCaptured = true
        }
      }
    }

    return NextResponse.json({ reply, leadCaptured, conversationId: conversation.id }, { headers: CORS })
  } catch (error) {
    console.error('[CHAT]', error)
    return NextResponse.json({ error: 'Server error', reply: "I'm sorry, I'm having trouble responding." }, { status: 500, headers: CORS })
  }
}

async function upsertUsage(orgId: string, botId: string, month: string, msgs: number, tokens: number, convs: number, leads: number) {
  await prisma.usageTracking.upsert({
    where: { organizationId_chatbotId_month: { organizationId: orgId, chatbotId: botId, month } },
    create: { organizationId: orgId, chatbotId: botId, month, messageCount: msgs, tokenCount: tokens, conversationCount: convs, leadCount: leads },
    update: { messageCount: { increment: msgs }, tokenCount: { increment: tokens }, conversationCount: { increment: convs }, leadCount: { increment: leads } },
  })
}
