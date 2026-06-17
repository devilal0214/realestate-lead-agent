import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const fileName = `${uuidv4()}.${ext}`
  const uploadDir = join(process.cwd(), 'uploads', id)
  await mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = join(uploadDir, fileName)
  await writeFile(filePath, buffer)

  const url = `/uploads/${id}/${fileName}`

  const upload = await prisma.upload.create({
    data: {
      organizationId: id,
      fileName,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      filePath,
      url,
    },
  })

  return NextResponse.json({ data: upload }, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const uploads = await prisma.upload.findMany({
    where: { organizationId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: uploads })
}
