'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeadDetailDrawer } from './lead-detail-drawer'
import { formatRelativeTime } from '@/lib/utils'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Lead, Chatbot } from '@/types'

type LeadWithBot = Lead & { chatbot: Pick<Chatbot, 'id' | 'name'> | null }

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  new: 'info',
  qualified: 'success',
  contacted: 'warning',
  won: 'success',
  lost: 'destructive',
}

interface LeadsTableProps {
  leads: LeadWithBot[]
  total: number
  page: number
  totalPages: number
  canExport: boolean
  organizationId: string
}

export function LeadsTable({ leads, total, page, totalPages, canExport, organizationId }: LeadsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedLead, setSelectedLead] = useState<LeadWithBot | null>(null)
  const [exporting, setExporting] = useState(false)
  const [, startTransition] = useTransition()

  function updateSearchParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  async function handleExport() {
    if (!canExport) {
      toast.error('CSV export requires Starter plan or above')
      return
    }
    setExporting(true)
    try {
      const res = await fetch(`/api/organizations/${organizationId}/leads/export`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Leads exported!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            defaultValue={searchParams.get('q') ?? ''}
            className="pl-9"
            onChange={(e) => updateSearchParam('q', e.target.value)}
          />
        </div>
        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => updateSearchParam('status', v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting || !canExport}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {canExport ? 'Export CSV' : 'Upgrade to Export'}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="hidden md:table-cell">Property</TableHead>
              <TableHead className="hidden lg:table-cell">Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Bot</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell className="font-medium">
                    {lead.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {lead.email && (
                        <p className="text-xs truncate max-w-[160px]">{lead.email}</p>
                      )}
                      {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-0.5">
                      {lead.propertyType && <p className="text-xs">{lead.propertyType}</p>}
                      {lead.location && (
                        <p className="text-xs text-muted-foreground">{lead.location}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">
                    {lead.budget ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[lead.status] ?? 'default'}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {lead.chatbot?.name ?? '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {formatRelativeTime(lead.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          organizationId={organizationId}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            setSelectedLead(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
