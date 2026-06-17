import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowRight, MessageSquare } from 'lucide-react'
import type { Conversation, Chatbot } from '@/types'

type ConversationWithBot = Conversation & { chatbot: Pick<Chatbot, 'id' | 'name'> | null }

export function RecentConversationsTable({
  conversations,
}: {
  conversations: ConversationWithBot[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Conversations</CardTitle>
        <Link href="/dashboard/conversations">
          <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
            View all <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No conversations yet. Deploy a chatbot to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/dashboard/conversations/${conv.id}`}>
                <div className="flex items-center gap-3 py-2 border-b last:border-0 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {conv.chatbot?.name ?? 'Unknown Bot'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conv.visitorId ? `Visitor: ${conv.visitorId.slice(0, 8)}…` : 'Anonymous'} ·{' '}
                      {formatRelativeTime(conv.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
