'use client'

import Link from 'next/link'

export function SignupForm() {
  return (
    <div className="text-center py-4">
      <p className="text-body-md text-on-card-secondary mb-4">
        Public registration is disabled.
      </p>
      <Link href="/login" className="text-[#6D4AFF] hover:underline font-semibold">
        Go to Login
      </Link>
    </div>
  )
}
