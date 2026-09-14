'use client'

import { Wallet } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { cn } from '@/lib/utils'

interface LoginCardProps {
  className?: string
}

export function LoginCard({ className }: LoginCardProps) {
  return (
    <section className={cn('w-full relative', className)}>
      <div className="relative animate-entrance fade-in">
        <div className="auth-card relative overflow-hidden">
          <div className="relative z-10 px-8 py-10 sm:px-10 sm:py-11">
            {/* Brand row */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="icon-container-lg flex-shrink-0">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-title-md font-bold tracking-tight text-accent">
                  O Book
                </h1>
              </div>

              <h2 className="text-headline-lg font-semibold tracking-tight text-on-card-primary mb-2">
                Welcome Back
              </h2>
              <p className="text-body-md text-on-card-secondary leading-relaxed">
                Sign in to access your dashboard
              </p>
            </header>

            <LoginForm />
          </div>
        </div>
      </div>
    </section>
  )
}
