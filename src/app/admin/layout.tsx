import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-purple-200 text-sm">RealEstate AI Platform</p>
          </div>
          <nav className="flex gap-4">
            {[
              { label: 'Overview', href: '/admin' },
              { label: 'Tenants', href: '/admin/tenants' },
              { label: 'Users', href: '/admin/users' },
              { label: 'Usage', href: '/admin/usage' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-purple-200 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a href="/dashboard" className="text-sm text-purple-300 hover:text-white">
              ← Dashboard
            </a>
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">{children}</div>
    </div>
  )
}
