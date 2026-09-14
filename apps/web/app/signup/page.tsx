'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0B1E]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6D4AFF]"></div>
    </div>
  )
}
