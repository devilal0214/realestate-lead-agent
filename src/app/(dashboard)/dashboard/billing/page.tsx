import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default async function BillingPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Get user's first organization (or allow selection)
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          subscriptions: true,
        },
      },
    },
  })

  if (!membership) redirect('/onboarding')

  const organization = membership.organization
  const subscription = organization.subscriptions[0]

  // Get usage
  const currentMonth = new Date().toISOString().slice(0, 7)
  const usage = await prisma.usageTracking.findFirst({
    where: {
      organizationId: organization.id,
      month: currentMonth,
    },
  })

  const chatbotCount = await prisma.chatbot.count({
    where: {
      organizationId: organization.id,
      isArchived: false,
    },
  })

  // Default limits for free plan
  const limits = {
    messages: 100,
    chatbots: 1,
    leads: 50,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view usage
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {organization.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold capitalize">
                {organization.plan}
              </span>
              <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                {subscription?.status || 'Free'}
              </Badge>
            </div>

            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}

            <Button className="w-full">Upgrade Plan</Button>
            
            {subscription && subscription.status === 'active' && (
              <Button variant="outline" className="w-full">
                Manage Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Current period usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Messages</span>
                <span>
                  {usage?.messageCount || 0} / {limits.messages === -1 ? '∞' : limits.messages}
                </span>
              </div>
              <Progress 
                value={limits.messages === -1 ? 0 : ((usage?.messageCount || 0) / limits.messages) * 100}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chatbots</span>
                <span>
                  {chatbotCount} / {limits.chatbots === -1 ? '∞' : limits.chatbots}
                </span>
              </div>
              <Progress 
                value={limits.chatbots === -1 ? 0 : (chatbotCount / limits.chatbots) * 100}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Leads</span>
                <span>
                  {usage?.leadCount || 0} / {limits.leads === -1 ? '∞' : limits.leads}
                </span>
              </div>
              <Progress 
                value={limits.leads === -1 ? 0 : ((usage?.leadCount || 0) / limits.leads) * 100}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No payment history</p>
        </CardContent>
      </Card>
    </div>
  )
}
