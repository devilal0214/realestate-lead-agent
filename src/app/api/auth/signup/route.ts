import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signUpSchema } from '@/lib/validations/auth'
import { generateSlug } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, password, organizationName } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const isAdmin = email === process.env.ADMIN_EMAIL

    const slug = generateSlug(organizationName)
    const uniqueSlug = await ensureUniqueSlug(slug)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin,
        memberships: {
          create: {
            role: 'owner',
            organization: {
              create: {
                name: organizationName,
                slug: uniqueSlug,
                plan: 'free',
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ message: 'Account created successfully', userId: user.id }, { status: 201 })
  } catch (error) {
    console.error('[SIGNUP]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const existing = await prisma.organization.findUnique({ where: { slug } })
    if (!existing) return slug
    attempt++
    slug = `${baseSlug}-${attempt}`
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ user: session.user })
}
