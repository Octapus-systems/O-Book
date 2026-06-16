'use client'

import { useEffect, useState } from 'react'
import { Bell, Search, Wallet, Menu } from 'lucide-react'
import { useSidebarStore } from '@/lib/store'
import { getAuthUser, type AuthUser } from '@/lib/auth-store'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TopHeader() {
  const { toggleSidebar } = useSidebarStore()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getAuthUser())
  }, [])

  const displayName = user?.name ?? 'User'
  const initials = getInitials(displayName)

  return (
    <header className="fixed top-0 right-0 z-30 flex h-20 w-full items-center justify-between border-b border-primary/10 bg-surface/70 px-4 shadow-sm shadow-primary/5 backdrop-blur-md lg:w-[calc(100%-18rem)] lg:px-8">
      <div className="flex flex-1 items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary-fixed/20 hover:text-primary"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search transactions, hashes, or notes..."
            className="squircle w-full border border-outline-variant bg-surface-container-lowest py-2.5 pl-11 pr-4 font-body text-body-md outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <button
          type="button"
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary-fixed/20 hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary-fixed/20 hover:text-primary"
          aria-label="Wallet"
        >
          <Wallet className="h-5 w-5" />
        </button>

        <div className="mx-2 hidden h-8 w-px bg-outline-variant lg:block" />

        <div className="group flex cursor-pointer items-center gap-3">
          <div className="hidden text-right lg:block">
            <p className="font-title text-body-md font-bold leading-none text-on-surface">
              {displayName}
            </p>
            <p className="text-label-sm text-outline">{user?.email ?? 'Signed in'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-fixed-dim bg-primary-fixed text-sm font-bold text-primary transition-colors group-hover:border-primary">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
