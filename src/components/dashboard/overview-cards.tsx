import { Users, MessageSquare, Bot, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats } from '@/types'

interface OverviewCardsProps {
  stats: DashboardStats
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  const cards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads.toLocaleString(),
      subtext: `+${stats.leadsThisMonth} this month`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Conversations',
      value: stats.totalConversations.toLocaleString(),
      subtext: `+${stats.conversationsThisMonth} this month`,
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Messages This Month',
      value: stats.messagesThisMonth.toLocaleString(),
      subtext: 'Across all bots',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Active Chatbots',
      value: stats.activeBots.toLocaleString(),
      subtext: 'Currently deployed',
      icon: Bot,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-500" />
                {card.subtext}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
