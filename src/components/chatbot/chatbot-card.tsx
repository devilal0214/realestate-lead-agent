'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EmbedCodeDialog } from './embed-code-dialog'
import { Edit2, Trash2, Bot, CheckCircle, XCircle } from 'lucide-react'
import type { Chatbot, Plan } from '@/types'

interface ChatbotCardProps {
  chatbot: Chatbot
  plan: Plan
  organizationId: string
}

export function ChatbotCard({ chatbot, plan: _plan, organizationId }: ChatbotCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/organizations/${organizationId}/chatbots/${chatbot.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Chatbot deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete chatbot')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {chatbot.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={chatbot.logoUrl}
                alt={chatbot.name}
                className="w-10 h-10 rounded-lg object-cover border"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: chatbot.themeColor + '20' }}
              >
                <Bot className="w-5 h-5" style={{ color: chatbot.themeColor }} />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{chatbot.name}</CardTitle>
              {chatbot.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {chatbot.description}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant={chatbot.isActive ? 'success' : 'secondary'}
            className="flex-shrink-0 gap-1"
          >
            {chatbot.isActive ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {chatbot.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">
            {chatbot.widgetPosition}
          </span>
          <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">
            {chatbot.fontFamily}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: chatbot.themeColor }}
            />
            {chatbot.themeColor}
          </span>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3 gap-2">
        <EmbedCodeDialog botId={chatbot.id} />
        <Link href={`/dashboard/chatbots/${chatbot.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1">
            <Edit2 className="w-3 h-3" /> Edit
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chatbot?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{chatbot.name}</strong> and all its
                conversations and leads. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleting}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
