import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Zap, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">RealEstate AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Zap className="w-4 h-4" />
          AI-Powered Real Estate Lead Generation
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto">
          Convert Website Visitors Into{' '}
          <span className="text-blue-600">Qualified Real Estate Leads</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Deploy an AI chat widget on your real estate website in minutes. Automatically qualify
          leads, capture contact info, and never miss a potential buyer.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Capture More Leads
          </h2>
          <p className="text-lg text-gray-500">
            One platform, infinite possibilities for your real estate business.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
              title: 'AI-Powered Conversations',
              description:
                'Our AI qualifies leads 24/7, asking the right questions about budget, location, and timeline.',
            },
            {
              icon: <Zap className="w-6 h-6 text-blue-600" />,
              title: 'Instant Lead Capture',
              description:
                'Automatically extract name, email, phone, and property preferences from conversations.',
            },
            {
              icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
              title: 'Real-Time Analytics',
              description:
                'Track conversations, lead quality, and conversion rates with detailed dashboards.',
            },
            {
              icon: <Shield className="w-6 h-6 text-blue-600" />,
              title: 'Multi-Tenant & Secure',
              description:
                'Perfect for agencies with multiple agents. Full tenant isolation and data security.',
            },
            {
              icon: <Zap className="w-6 h-6 text-blue-600" />,
              title: '5-Minute Setup',
              description:
                'Add one line of code to your website and your AI assistant is live and capturing leads.',
            },
            {
              icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
              title: 'Custom Branding',
              description:
                'Match your brand with custom colors, logo, and messaging on paid plans.',
            },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: 'Free',
              price: '$0',
              description: 'Perfect for getting started',
              features: ['1 Chatbot', '100 Messages/month', 'Lead Capture', 'Basic Analytics'],
              cta: 'Get Started',
              popular: false,
            },
            {
              name: 'Pro',
              price: '$99',
              description: 'For growing agencies',
              features: [
                '10 Chatbots',
                '10,000 Messages/month',
                'Custom Branding',
                'CSV Export',
                'Priority Support',
                'Remove Branding',
              ],
              cta: 'Start Pro Trial',
              popular: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              description: 'For large operations',
              features: [
                'Unlimited Chatbots',
                'Unlimited Messages',
                'Custom Domain',
                'API Access',
                'Dedicated Support',
                'SLA',
              ],
              cta: 'Contact Sales',
              popular: false,
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`rounded-xl border p-8 ${
                plan.popular
                  ? 'border-blue-600 shadow-lg ring-2 ring-blue-600 relative'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="font-bold text-xl text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.price !== 'Custom' && (
                  <span className="text-gray-500">/month</span>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">RealEstate AI</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} RealEstate AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
