import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Bot, MessageSquare, TrendingUp, UserCheck } from 'lucide-react'

export const metadata = { title: 'Admin Overview' }

export default async function AdminPage() {
  const [orgs, users, bots, conversations, leads, messages] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.chatbot.count(),
    prisma.conversation.count(),
    prisma.lead.count(),
    prisma.message.count(),
  ])

  const stats = [
    { title: 'Total Organizations', value: orgs, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Total Users', value: users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Bots', value: bots, icon: Bot, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Total Conversations', value: conversations, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Total Leads', value: leads, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Total Messages', value: messages, icon: TrendingUp, color: 'text-pink-600', bg: 'bg-pink-50' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
