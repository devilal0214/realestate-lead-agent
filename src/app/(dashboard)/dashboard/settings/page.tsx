import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PLAN_LIMITS } from '@/lib/plans'
import { getCurrentMonth } from '@/lib/utils'
import type { Plan } from '@/types'

export const metadata = { title: 'Settings' }

const PLAN_DISPLAY: Record<Plan, { label: string; price: string; color: string }> = {
  free: { label: 'Free', price: '$0/mo', color: 'bg-gray-100 text-gray-800' },
  starter: { label: 'Starter', price: '$29/mo', color: 'bg-blue-100 text-blue-800' },
  pro: { label: 'Pro', price: '$99/mo', color: 'bg-purple-100 text-purple-800' },
  enterprise: { label: 'Enterprise', price: 'Custom', color: 'bg-yellow-100 text-yellow-800' },
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          subscriptions: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      },
    },
  })
  if (!membership) redirect('/dashboard')

  const org = membership.organization
  const plan: Plan = (org.subscriptions[0]?.plan as Plan) ?? 'free'
  const limits = PLAN_LIMITS[plan]
  const planDisplay = PLAN_DISPLAY[plan]

  const currentMonth = getCurrentMonth()
  const usageRow = await prisma.usageTracking.findFirst({
    where: { organizationId: org.id, month: currentMonth },
  })

  const messageUsed = usageRow?.messageCount ?? 0
  const messageLimit = limits.maxMessages
  const usagePercent = messageLimit === -1 ? 0 : Math.min(100, (messageUsed / messageLimit) * 100)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your workspace and subscription</p>
      </div>

      {/* Workspace */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{org.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Slug</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{org.slug}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Role</span>
            <Badge variant="secondary">{membership.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Plan</span>
            <Badge className={planDisplay.color}>{planDisplay.label}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="text-sm font-semibold">{planDisplay.price}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Messages This Month</span>
              <span className="font-medium">
                {messageUsed.toLocaleString()} /{' '}
                {messageLimit === -1 ? '∞' : messageLimit.toLocaleString()}
              </span>
            </div>
            {messageLimit !== -1 && <Progress value={usagePercent} className="h-2" />}
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Plan Features</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Max Bots', value: limits.maxChatbots === -1 ? 'Unlimited' : limits.maxChatbots },
                { label: 'Messages/mo', value: limits.maxMessages === -1 ? 'Unlimited' : limits.maxMessages.toLocaleString() },
                { label: 'Custom Colors', value: limits.customColors ? '✓' : '✗' },
                { label: 'Logo Upload', value: limits.logoUpload ? '✓' : '✗' },
                { label: 'Remove Branding', value: limits.removeBranding ? '✓' : '✗' },
                { label: 'CSV Export', value: limits.csvExport ? '✓' : '✗' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between bg-gray-50 rounded px-3 py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${value === '✗' ? 'text-red-400' : value === '✓' ? 'text-green-600' : ''}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {plan === 'free' && (
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800 font-medium">Upgrade to unlock more features</p>
              <p className="text-xs text-blue-600 mt-1">
                Custom branding, more bots, and higher message limits
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
