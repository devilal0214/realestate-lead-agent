'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Code, Copy, Check } from 'lucide-react'

interface EmbedCodeDialogProps {
  botId: string
}

export function EmbedCodeDialog({ botId }: EmbedCodeDialogProps) {
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com'

  const embedCode = `<!-- RealEstate AI Widget -->
<script
  src="${appUrl}/widget.js"
  data-bot-id="${botId}"
  async>
</script>`

  async function copyToClipboard() {
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success('Embed code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 flex-1">
          <Code className="w-3 h-3" /> Embed
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed Widget</DialogTitle>
          <DialogDescription>
            Copy and paste this code into your website&apos;s HTML, just before the closing{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <pre className="bg-gray-950 text-green-400 text-xs rounded-lg p-4 overflow-x-auto leading-relaxed">
              <code>{embedCode}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">Installation Steps</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copy the code above</li>
              <li>Open your website&apos;s HTML file or CMS template</li>
              <li>
                Paste before the closing{' '}
                <code className="text-xs bg-blue-100 px-1 rounded">&lt;/body&gt;</code> tag
              </li>
              <li>Save and publish your changes</li>
              <li>The chat widget will appear on your website</li>
            </ol>
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Bot ID:</strong>{' '}
            <code className="bg-gray-100 px-1 rounded">{botId}</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
