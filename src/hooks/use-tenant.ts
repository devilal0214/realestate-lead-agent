'use client'

import { useEffect, useState } from 'react'

interface TenantData {
  id: string
  name: string
  slug: string
  plan: string
  role: string
}

export function useTenant() {
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/organizations')
        if (res.ok) {
          const data = await res.json()
          // Return first org as the primary workspace
          const org = data.data?.[0]
          if (org) {
            setTenant({
              id: org.id,
              name: org.name,
              slug: org.slug,
              plan: org.subscriptions?.[0]?.plan ?? 'free',
              role: org.membership?.role ?? 'member',
            })
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { tenant, loading }
}
