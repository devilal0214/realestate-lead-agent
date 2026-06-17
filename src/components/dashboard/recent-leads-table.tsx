import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import type { Lead, Chatbot } from '@/types'

type LeadWithBot = Lead & { chatbot: Pick<Chatbot, 'id' | 'name'> | null }

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  new: 'info',
  qualified: 'success',
  contacted: 'warning',
  won: 'success',
  lost: 'destructive',
}

export function RecentLeadsTable({ leads }: { leads: LeadWithBot[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
            View all <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No leads yet. Start chatting to capture leads.
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {lead.name ?? lead.email ?? 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.chatbot?.name ?? 'Unknown bot'} · {formatRelativeTime(lead.createdAt)}
                  </p>
                </div>
                <Badge variant={statusVariant[lead.status] ?? 'default'} className="ml-2 flex-shrink-0">
                  {lead.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
