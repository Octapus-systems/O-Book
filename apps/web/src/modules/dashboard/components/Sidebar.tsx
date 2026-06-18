'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Wallet, PlusCircle, X } from 'lucide-react'
import { NAV_ITEMS } from '../constants/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { getAuthUser } from '@/lib/auth-store'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, closeSidebar, isMobile } = useSidebarStore()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const user = getAuthUser()
    setIsAdmin(user?.role === 'ADMIN')
  }, [])

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) {
      closeSidebar()
    }
  }, [pathname, isMobile, closeSidebar])

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 rounded-r-3xl border-r border-primary/15 bg-surface/80 shadow-2xl shadow-primary/10 backdrop-blur-xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col py-8">
          {/* Brand */}
          <div className="mb-10 flex items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container shadow-lg">
                <Wallet className="h-5 w-5 text-on-primary-container" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-headline text-headline-lg font-bold leading-none text-primary">
                  CashBook
                </h1>
                <p className="text-label-sm font-medium tracking-wider text-outline">
                  Enterprise Treasury
                </p>
              </div>
            </div>
            {/* Close button - visible on mobile */}
            <button
              onClick={closeSidebar}
              className="lg:hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary-fixed/20 hover:text-primary"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar px-3">
            {NAV_ITEMS.filter((item) => item.href !== '/users' || isAdmin).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-r-2xl px-5 py-3 font-body text-body-md transition-colors duration-300',
                    isActive
                      ? 'nav-item-active font-medium'
                      : 'border-l-4 border-transparent text-on-surface-variant hover:bg-primary-fixed/30'
                  )}
                  onClick={() => {
                    if (isMobile) closeSidebar()
                  }}
                >
                  <Icon
                    className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-outline')}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Quick Add */}
          <div className="mt-auto px-6">
            <button
              type="button"
              onClick={() => {
                router.push('/transactions/new')
                if (isMobile) closeSidebar()
              }}
              className="shadow-glow-primary rim-light flex w-full items-center justify-center gap-2 squircle bg-primary-container py-4 font-title text-title-md text-on-primary-container transition-all duration-300 hover:shadow-lg active:scale-95"
            >
              <PlusCircle className="h-5 w-5" />
              Quick Add
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
