import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Conversations' }

const PAGE_SIZE = 20

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) redirect('/dashboard')

  const page = Math.max(1, parseInt(params.page ?? '1'))
  const skip = (page - 1) * PAGE_SIZE

  const [convs, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        chatbot: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        lead: { select: { id: true, name: true, email: true, status: true } },
      },
    }),
    prisma.conversation.count({ where: { organizationId: membership.organizationId } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-500 mt-1">{total} total conversations</p>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white divide-y">
        {convs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No conversations yet</p>
          </div>
        ) : (
          convs.map((conv) => {
            const lastMessage = conv.messages[0]
            return (
              <Link key={conv.id} href={`/dashboard/conversations/${conv.id}`}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {conv.chatbot?.name ?? 'Unknown Bot'}
                      </p>
                      {conv.lead && (
                        <Badge variant="info" className="text-xs">
                          Lead: {conv.lead.name ?? conv.lead.email ?? 'captured'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lastMessage
                        ? `${lastMessage.role === 'user' ? '👤' : '🤖'} ${lastMessage.content.slice(0, 80)}…`
                        : 'No messages'}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(conv.updatedAt)}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/dashboard/conversations?page=${page - 1}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/dashboard/conversations?page=${page + 1}`}>
                <Button variant="outline" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
