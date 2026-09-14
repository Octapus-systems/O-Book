'use client'

import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SignupCardProps {
  className?: string
}

export function SignupCard({ className }: SignupCardProps) {
  return (
    <section className={cn('w-full relative', className)}>
      <div className="relative animate-entrance fade-in">
        <div className="auth-card relative overflow-hidden">
          <div className="relative z-10 px-8 py-10 sm:px-10 sm:py-11 text-center">
            <div className="flex items-center justify-center gap-3 mb-7">
              <div className="icon-container-lg flex-shrink-0">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-title-md font-bold tracking-tight text-accent">
                O Book
              </h1>
            </div>

            <h2 className="text-headline-lg font-semibold tracking-tight text-on-card-primary mb-2">
              Registration Closed
            </h2>
            <p className="text-body-md text-on-card-secondary leading-relaxed mb-6">
              Public registration is disabled. Please contact your system administrator.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[#6D4AFF] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#8B6BFF]"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
