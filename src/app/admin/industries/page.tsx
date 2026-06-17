import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function AdminIndustriesPage() {
  const session = await auth()
  if (!session?.user?.isAdmin) redirect('/dashboard')

  const industries = await prisma.industry.findMany({
    include: {
      pricing: { orderBy: { monthlyPrice: 'asc' } },
      features: true,
      _count: {
        select: { chatbots: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Industries</h1>
          <p className="text-muted-foreground">
            Manage industry templates and pricing
          </p>
        </div>
        <Button>Add Industry</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry) => (
          <Card key={industry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {industry.icon && (
                    <span className="text-2xl">{industry.icon}</span>
                  )}
                  <CardTitle>{industry.name}</CardTitle>
                </div>
                <Badge variant={industry.isActive ? 'default' : 'secondary'}>
                  {industry.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>{industry.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">Pricing Tiers: {industry.pricing.length}</p>
                <p className="font-medium">Features: {industry.features.length}</p>
                <p className="font-medium">
                  Chatbots: {industry._count.chatbots}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={industry._count.chatbots > 0}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {industries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No industries found</p>
            <Button className="mt-4">Create First Industry</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
