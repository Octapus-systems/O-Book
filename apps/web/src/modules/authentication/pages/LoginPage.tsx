'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoginCard } from '@/modules/authentication/components/LoginCard'
import { AuthLayout } from '@/modules/authentication/layouts/AuthLayout'

export default function LoginPage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      if (session) {
        router.replace('/transactions')
      } else {
        setCheckingSession(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [router])

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0B1E]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6D4AFF]"></div>
      </div>
    )
  }

  return (
    <AuthLayout>
      <LoginCard />
    </AuthLayout>
  )
}
