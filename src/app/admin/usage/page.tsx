import { prisma } from '@/lib/prisma'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata = { title: 'Admin – Usage' }

export default async function AdminUsagePage() {
  const usageData = await prisma.usageTracking.findMany({
    orderBy: [{ month: 'desc' }, { messageCount: 'desc' }],
    include: { organization: { select: { name: true } } },
  })

  const totals = usageData.reduce(
    (acc, row) => ({
      messages: acc.messages + row.messageCount,
      tokens: acc.tokens + row.tokenCount,
      conversations: acc.conversations + row.conversationCount,
      leads: acc.leads + row.leadCount,
    }),
    { messages: 0, tokens: 0, conversations: 0, leads: 0 }
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Usage Statistics</h2>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages', value: totals.messages },
          { label: 'Total Tokens', value: totals.tokens },
          { label: 'Total Conversations', value: totals.conversations },
          { label: 'Total Leads', value: totals.leads },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Tenant</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Conversations</TableHead>
              <TableHead>Leads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usageData.map((row) => (
              <TableRow key={`${row.organizationId}-${row.month}`}>
                <TableCell className="font-medium">{row.organization?.name ?? row.organizationId.slice(0, 8)}</TableCell>
                <TableCell>{row.month}</TableCell>
                <TableCell>{row.messageCount.toLocaleString()}</TableCell>
                <TableCell>{row.tokenCount.toLocaleString()}</TableCell>
                <TableCell>{row.conversationCount.toLocaleString()}</TableCell>
                <TableCell>{row.leadCount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
