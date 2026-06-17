import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChatbotForm } from '@/components/chatbot/chatbot-form'
import type { Plan } from '@/types'

export const metadata = { title: 'Edit Chatbot' }

export default async function EditChatbotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { include: { subscriptions: { take: 1, orderBy: { createdAt: 'desc' } } } } },
  })
  if (!membership) redirect('/dashboard')

  const org = membership.organization
  const bot = await prisma.chatbot.findFirst({
    where: { id, organizationId: org.id },
  })
  if (!bot) notFound()

  const plan: Plan = (org.subscriptions[0]?.plan as Plan) ?? 'free'

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Chatbot</h1>
        <p className="text-gray-500 mt-1">{bot.name}</p>
      </div>
      <ChatbotForm
        botId={bot.id}
        organizationId={org.id}
        defaultValues={{
          name: bot.name,
          description: bot.description ?? undefined,
          welcomeMessage: bot.welcomeMessage,
          systemPrompt: bot.systemPrompt,
          themeColor: bot.themeColor,
          fontFamily: bot.fontFamily,
          widgetPosition: bot.widgetPosition as 'bottom-right' | 'bottom-left',
          leadCaptureEnabled: bot.leadCaptureEnabled,
          logoUrl: bot.logoUrl,
        }}
        plan={plan}
      />
    </div>
  )
}
