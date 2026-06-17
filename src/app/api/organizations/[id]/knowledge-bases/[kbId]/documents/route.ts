import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { hasRole } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

type Params = { params: Promise<{ id: string; kbId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, kbId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const docs = await prisma.document.findMany({
    where: { knowledgeBaseId: kbId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: docs })
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, kbId } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership || !hasRole(membership.role as Role, 'manager')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF, TXT, MD files allowed' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const fileName = `${uuidv4()}.${ext}`
  const dir = join(process.cwd(), 'uploads', id, 'kb', kbId)
  await mkdir(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = join(dir, fileName)
  await writeFile(filePath, buffer)

  // Extract text content for plain text / markdown
  let content: string | null = null
  if (file.type !== 'application/pdf') {
    content = buffer.toString('utf-8').substring(0, 50000) // Limit stored content
  }

  const doc = await prisma.document.create({
    data: {
      knowledgeBaseId: kbId,
      name: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath,
      content,
      status: 'ready',
    },
  })

  return NextResponse.json({ data: doc }, { status: 201 })
}
