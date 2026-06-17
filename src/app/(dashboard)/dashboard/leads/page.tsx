import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { LeadsTable } from '@/components/leads/leads-table'
import { Skeleton } from '@/components/ui/skeleton'
import { PLAN_LIMITS } from '@/lib/plans'
import type { Plan } from '@/types'

export const metadata = { title: 'Leads' }

const PAGE_SIZE = 20

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { include: { subscriptions: { take: 1, orderBy: { createdAt: 'desc' } } } } },
  })
  if (!membership) redirect('/dashboard')

  const org = membership.organization
  const plan: Plan = (org.subscriptions[0]?.plan as Plan) ?? 'free'
  const limits = PLAN_LIMITS[plan]
  const canExport = limits.csvExport

  const page = Math.max(1, parseInt(params.page ?? '1'))
  const skip = (page - 1) * PAGE_SIZE
  const searchQuery = params.q ?? ''
  const statusFilter = params.status ?? ''

  const whereBase = {
    organizationId: org.id,
    ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(searchQuery ? {
      OR: [
        { name: { contains: searchQuery } },
        { email: { contains: searchQuery } },
        { phone: { contains: searchQuery } },
        { location: { contains: searchQuery } },
      ]
    } : {}),
  }

  const [allLeads, total] = await Promise.all([
    prisma.lead.findMany({
      where: whereBase,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: { chatbot: { select: { id: true, name: true } } },
    }),
    prisma.lead.count({ where: whereBase }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-500 mt-1">{total} total leads captured</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LeadsTable
          leads={allLeads as Parameters<typeof LeadsTable>[0]['leads']}
          total={total}
          page={page}
          totalPages={totalPages}
          canExport={canExport}
          organizationId={org.id}
        />
      </Suspense>
    </div>
  )
}
