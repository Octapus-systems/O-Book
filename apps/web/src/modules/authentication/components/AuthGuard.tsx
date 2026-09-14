'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { setAuthUser } from '@/lib/auth-store'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return

      if (!session) {
        setAuthenticated(false)
        setLoading(false)
        router.replace('/login')
      } else {
        if (session.user) {
          setAuthUser({
            id: session.user.id,
            email: session.user.email ?? '',
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'User',
            role: 'USER',
          })
        }
        setAuthenticated(true)
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session) {
        setAuthenticated(false)
        router.replace('/login')
      } else if (session) {
        if (session.user) {
          setAuthUser({
            id: session.user.id,
            email: session.user.email ?? '',
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'User',
            role: 'USER',
          })
        }
        setAuthenticated(true)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0B1E]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6D4AFF]"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}
