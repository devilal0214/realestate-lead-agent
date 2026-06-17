import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ChatbotForm } from '@/components/chatbot/chatbot-form'
import { DEFAULT_REAL_ESTATE_SYSTEM_PROMPT } from '@/lib/openai'
import type { Plan } from '@/types'

export const metadata = { title: 'New Chatbot' }

export default async function NewChatbotPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { include: { subscriptions: { take: 1, orderBy: { createdAt: 'desc' } } } } },
  })
  if (!membership) redirect('/dashboard')

  const org = membership.organization
  const plan: Plan = (org.subscriptions[0]?.plan as Plan) ?? 'free'

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Chatbot</h1>
        <p className="text-gray-500 mt-1">Configure your AI assistant for real estate lead generation</p>
      </div>
      <ChatbotForm
        organizationId={org.id}
        defaultValues={{
          systemPrompt: DEFAULT_REAL_ESTATE_SYSTEM_PROMPT,
          welcomeMessage: "Hi! I'm here to help you find your perfect property. What are you looking for?",
          themeColor: '#2563eb',
          fontFamily: 'Inter',
          widgetPosition: 'bottom-right',
          leadCaptureEnabled: true,
        }}
        plan={plan}
      />
    </div>
  )
}
