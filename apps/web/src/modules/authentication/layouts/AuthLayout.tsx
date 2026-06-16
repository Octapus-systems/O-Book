import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className={cn('auth-screen relative bg-auth-canvas overflow-hidden w-full flex items-center justify-center', className)}>
      <div className="bg-blob-1" aria-hidden="true" />
      <div className="bg-blob-2" aria-hidden="true" />
      <div className="bg-blob-3" aria-hidden="true" />

      <main className="relative z-10 w-full max-w-[420px]">
        {children}
      </main>
    </div>
  )
}
