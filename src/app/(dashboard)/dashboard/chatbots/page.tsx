import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatbotCard } from '@/components/chatbot/chatbot-card'
import { PLAN_LIMITS } from '@/lib/plans'
import { Plus, Bot } from 'lucide-react'
import type { Plan } from '@/types'

export const metadata = { title: 'Chatbots' }

export default async function ChatbotsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
  })
  if (!membership) redirect('/dashboard')

  const org = membership.organization
  const plan: Plan = (org.subscriptions[0]?.plan as Plan) ?? 'free'
  const limits = PLAN_LIMITS[plan]

  const bots = await prisma.chatbot.findMany({
    where: { organizationId: org.id, isArchived: false },
    orderBy: { createdAt: 'asc' },
  })

  const canCreate = limits.maxChatbots === -1 || bots.length < limits.maxChatbots
  const maxDisplay = limits.maxChatbots === -1 ? '∞' : limits.maxChatbots

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbots</h1>
          <p className="text-gray-500 mt-1">
            {bots.length} / {maxDisplay} bots used
          </p>
        </div>
        {canCreate ? (
          <Link href="/dashboard/chatbots/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Chatbot
            </Button>
          </Link>
        ) : (
          <Button disabled className="gap-2">
            <Plus className="w-4 h-4" />
            Upgrade to Add More
          </Button>
        )}
      </div>

      {bots.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No chatbots yet</h3>
          <p className="text-gray-400 mt-2 mb-6">
            Create your first AI chatbot to start capturing leads
          </p>
          <Link href="/dashboard/chatbots/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Bot
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <ChatbotCard key={bot.id} chatbot={bot as Parameters<typeof ChatbotCard>[0]['chatbot']} plan={plan} organizationId={org.id} />
          ))}
        </div>
      )}
    </div>
  )
}
