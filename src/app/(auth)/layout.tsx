import { MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">RealEstate AI</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">{children}</main>
      <footer className="p-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} RealEstate AI
      </footer>
    </div>
  )
}
