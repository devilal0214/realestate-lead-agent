import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { select: { id: true, name: true } } },
  })

  if (!membership) redirect('/onboarding')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          user={{ email: session.user.email ?? '', name: session.user.name ?? undefined }}
          organizationName={membership.organization.name}
          organizationId={membership.organization.id}
          isAdmin={session.user.isAdmin ?? false}
        />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
