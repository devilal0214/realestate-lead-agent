import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, Bot, User } from 'lucide-react'
import { DeleteConversationButton } from '@/components/conversations/delete-conversation-button'

export const metadata = { title: 'Conversation' }

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) redirect('/dashboard')

  const conv = await prisma.conversation.findFirst({
    where: { id, organizationId: membership.organizationId },
    include: {
      chatbot: { select: { id: true, name: true, themeColor: true } },
      messages: { orderBy: { createdAt: 'asc' } },
      lead: true,
    },
  })

  if (!conv) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/conversations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {conv.chatbot?.name ?? 'Conversation'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(conv.createdAt)} ·{' '}
              {conv.messages.length} messages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conv.lead && (
            <Link href={`/dashboard/leads`}>
              <Badge variant="info" className="cursor-pointer">
                Lead: {conv.lead.name ?? conv.lead.email ?? 'View'}
              </Badge>
            </Link>
          )}
          <DeleteConversationButton conversationId={conv.id} organizationId={membership.organizationId} />
        </div>
      </div>

      {/* Messages */}
      <div className="border rounded-xl bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: conv.chatbot?.themeColor ?? '#2563eb' }}
          />
          <span className="text-sm font-medium">{conv.chatbot?.name ?? 'AI Assistant'}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            Session: {conv.sessionId.slice(0, 12)}…
          </span>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-4">
            {conv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Lead info if captured */}
      {conv.lead && (
        <div className="border rounded-xl bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-3">Lead Captured</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {conv.lead.name && (
              <div>
                <span className="text-muted-foreground">Name:</span> {conv.lead.name}
              </div>
            )}
            {conv.lead.email && (
              <div>
                <span className="text-muted-foreground">Email:</span> {conv.lead.email}
              </div>
            )}
            {conv.lead.phone && (
              <div>
                <span className="text-muted-foreground">Phone:</span> {conv.lead.phone}
              </div>
            )}
            {conv.lead.budget && (
              <div>
                <span className="text-muted-foreground">Budget:</span> {conv.lead.budget}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
