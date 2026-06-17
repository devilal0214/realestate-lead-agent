'use client'

import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Phone, Home, MapPin, DollarSign, Clock, Link as LinkIcon } from 'lucide-react'
import { updateLeadSchema, type UpdateLeadInput } from '@/lib/validations/lead'
import { formatDateTime } from '@/lib/utils'
import type { Lead, Chatbot } from '@/types'

type LeadWithBot = Lead & { chatbot: Pick<Chatbot, 'id' | 'name'> | null }

interface LeadDetailDrawerProps {
  lead: LeadWithBot
  organizationId: string
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function LeadDetailDrawer({ lead, organizationId, open, onClose, onUpdate }: LeadDetailDrawerProps) {
  const form = useForm<UpdateLeadInput>({
    resolver: zodResolver(updateLeadSchema),
    defaultValues: {
      name: lead.name ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      budget: lead.budget ?? '',
      propertyType: lead.propertyType ?? '',
      location: lead.location ?? '',
      timeline: lead.timeline ?? '',
      status: lead.status as 'new' | 'qualified' | 'contacted' | 'won' | 'lost',
      notes: lead.notes ?? '',
    },
  })

  async function onSubmit(values: UpdateLeadInput) {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Lead updated')
      onUpdate()
    } catch {
      toast.error('Failed to update lead')
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Lead Details</SheetTitle>
          <SheetDescription>
            {lead.chatbot?.name && `Via ${lead.chatbot.name}`} · {formatDateTime(lead.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              defaultValue={lead.status}
              onValueChange={(v) =>
                form.setValue('status', v as 'new' | 'qualified' | 'contacted' | 'won' | 'lost')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-4 h-4 flex items-center justify-center">👤</span> Name
            </Label>
            <Input {...form.register('name')} placeholder="Full name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input type="email" {...form.register('email')} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-3 h-3" /> Phone
              </Label>
              <Input {...form.register('phone')} placeholder="+1 555 000 0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="w-3 h-3" /> Property Type
              </Label>
              <Input {...form.register('propertyType')} placeholder="House, Condo..." />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Budget
              </Label>
              <Input {...form.register('budget')} placeholder="$500K - $700K" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Location
              </Label>
              <Input {...form.register('location')} placeholder="City, neighborhood..." />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-3 h-3" /> Timeline
              </Label>
              <Input {...form.register('timeline')} placeholder="Within 3 months..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              {...form.register('notes')}
              placeholder="Additional notes about this lead..."
              rows={3}
            />
          </div>

          {lead.conversationId && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <LinkIcon className="w-4 h-4" />
              <a href={`/dashboard/conversations/${lead.conversationId}`} className="hover:underline">
                View conversation
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
