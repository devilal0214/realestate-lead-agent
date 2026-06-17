import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Admin – Organizations' }

export default async function AdminTenantsPage() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { memberships: true, chatbots: true } },
      subscriptions: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Organizations ({orgs.length})</h2>
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Bots</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => {
              const plan = org.subscriptions[0]?.plan ?? 'free'
              return (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-1 rounded">{org.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{plan}</Badge>
                  </TableCell>
                  <TableCell>{org._count.memberships}</TableCell>
                  <TableCell>{org._count.chatbots}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(org.createdAt)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
