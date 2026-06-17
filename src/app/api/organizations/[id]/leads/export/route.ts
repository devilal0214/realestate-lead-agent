import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/organizations/[id]/leads/export — CSV export
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const leads = await prisma.lead.findMany({
    where: { organizationId: id },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['ID', 'Name', 'Email', 'Phone', 'Budget', 'Property Type', 'Location', 'Timeline', 'Status', 'Score', 'Source', 'Created At']
  const rows = leads.map(l => [
    l.id, l.name ?? '', l.email ?? '', l.phone ?? '',
    l.budget ?? '', l.propertyType ?? '', l.location ?? '',
    l.timeline ?? '', l.status, String(l.score), l.source ?? '',
    l.createdAt.toISOString(),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-${id}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
