'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { chatbotSchema, type ChatbotInput } from '@/lib/validations/chatbot'
import { hasFeature } from '@/lib/feature-gates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Lock, Upload } from 'lucide-react'
import { EmbedCodeDialog } from './embed-code-dialog'
import type { Plan } from '@/types'

interface ChatbotFormProps {
  botId?: string
  organizationId: string
  defaultValues?: Partial<ChatbotInput & { logoUrl?: string | null }>
  plan: Plan
}

export function ChatbotForm({ botId, organizationId, defaultValues, plan }: ChatbotFormProps) {
  const router = useRouter()
  const isEditing = !!botId
  const [uploading, setUploading] = useState(false)

  const form = useForm<ChatbotInput>({
    resolver: zodResolver(chatbotSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      welcomeMessage: defaultValues?.welcomeMessage ?? '',
      systemPrompt: defaultValues?.systemPrompt ?? '',
      themeColor: defaultValues?.themeColor ?? '#2563eb',
      fontFamily: defaultValues?.fontFamily ?? 'Inter',
      widgetPosition: defaultValues?.widgetPosition ?? 'bottom-right',
      leadCaptureEnabled: defaultValues?.leadCaptureEnabled ?? true,
      logoUrl: defaultValues?.logoUrl ?? null,
    },
  })

  const canCustomize = hasFeature(plan, 'customBranding')
  const canUploadLogo = hasFeature(plan, 'logoUpload')
  const canCustomizeColors = hasFeature(plan, 'customColors')
  const canCustomizeFonts = hasFeature(plan, 'customFonts')

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/organizations/${organizationId}/uploads`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      form.setValue('logoUrl', url)
      toast.success('Logo uploaded successfully')
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: ChatbotInput) {
    try {
      const url = isEditing
        ? `/api/organizations/${organizationId}/chatbots/${botId}`
        : `/api/organizations/${organizationId}/chatbots`
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save chatbot')
      }

      toast.success(isEditing ? 'Chatbot updated!' : 'Chatbot created!')
      router.push('/dashboard/chatbots')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bot Name *</Label>
            <Input id="name" placeholder="My Real Estate Assistant" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Helps visitors find their perfect property"
              {...form.register('description')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message *</Label>
            <Textarea
              id="welcomeMessage"
              placeholder="Hi! I'm here to help you find your perfect property..."
              rows={3}
              {...form.register('welcomeMessage')}
            />
            {form.formState.errors.welcomeMessage && (
              <p className="text-sm text-destructive">
                {form.formState.errors.welcomeMessage.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt *</Label>
            <Textarea
              id="systemPrompt"
              placeholder="You are a real estate AI assistant..."
              rows={8}
              className="font-mono text-xs"
              {...form.register('systemPrompt')}
            />
            {form.formState.errors.systemPrompt && (
              <p className="text-sm text-destructive">
                {form.formState.errors.systemPrompt.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance & Branding</CardTitle>
          <CardDescription>
            {!canCustomize && 'Upgrade to a paid plan to customize branding'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Logo
              {!canUploadLogo && <Lock className="w-3 h-3 text-muted-foreground" />}
            </Label>
            {canUploadLogo ? (
              <div className="flex items-center gap-3">
                {form.watch('logoUrl') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.watch('logoUrl') ?? ''}
                    alt="Bot logo"
                    className="w-10 h-10 rounded-lg object-cover border"
                  />
                )}
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Logo
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Available on Starter plan and above</p>
            )}
          </div>

          {/* Theme Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Theme Color
              {!canCustomizeColors && <Lock className="w-3 h-3 text-muted-foreground" />}
            </Label>
            {canCustomizeColors ? (
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  className="w-12 h-10 p-1 cursor-pointer"
                  {...form.register('themeColor')}
                />
                <Input
                  type="text"
                  placeholder="#2563eb"
                  className="w-32"
                  {...form.register('themeColor')}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-600" />
                <p className="text-sm text-muted-foreground">Default blue (upgrade to customize)</p>
              </div>
            )}
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Font Family
              {!canCustomizeFonts && <Lock className="w-3 h-3 text-muted-foreground" />}
            </Label>
            {canCustomizeFonts ? (
              <Select
                onValueChange={(v) => form.setValue('fontFamily', v)}
                defaultValue={form.getValues('fontFamily')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat'].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Inter (upgrade to customize)</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Widget Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Widget Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Widget Position</Label>
            <Select
              onValueChange={(v) =>
                form.setValue(
                  'widgetPosition',
                  v as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
                )
              }
              defaultValue={form.getValues('widgetPosition')}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Lead Capture</Label>
              <p className="text-sm text-muted-foreground">
                Automatically extract and save lead information
              </p>
            </div>
            <Switch
              checked={form.watch('leadCaptureEnabled')}
              onCheckedChange={(v) => form.setValue('leadCaptureEnabled', v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-32">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Chatbot'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={form.formState.isSubmitting}
        >
          Cancel
        </Button>
        {isEditing && <EmbedCodeDialog botId={botId} />}
      </div>
    </form>
  )
}
