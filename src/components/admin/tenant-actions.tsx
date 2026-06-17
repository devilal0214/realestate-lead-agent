'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Ban, Trash2, RefreshCw } from 'lucide-react'

interface AdminTenantActionsProps {
  tenantId: string
  status: string
}

export function AdminTenantActions({ tenantId, status }: AdminTenantActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(action: 'suspend' | 'activate' | 'delete', plan?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, plan }),
      })
      if (!res.ok) throw new Error('Action failed')
      toast.success(`Tenant ${action}d`)
      router.refresh()
    } catch {
      toast.error('Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === 'active' ? (
          <DropdownMenuItem
            className="text-yellow-600"
            onClick={() => handleAction('suspend')}
          >
            <Ban className="w-4 h-4 mr-2" /> Suspend
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleAction('activate')}>
            <RefreshCw className="w-4 h-4 mr-2" /> Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground text-xs"
          onClick={() => handleAction('activate', 'free')}
        >
          Set Plan: Free
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-muted-foreground text-xs"
          onClick={() => handleAction('activate', 'starter')}
        >
          Set Plan: Starter
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-muted-foreground text-xs"
          onClick={() => handleAction('activate', 'pro')}
        >
          Set Plan: Pro
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleAction('delete')}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
