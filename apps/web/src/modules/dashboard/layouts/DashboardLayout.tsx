'use client'

import { useEffect } from 'react'
import { AppBackground } from '../components/AppBackground'
import { Sidebar } from '../components/Sidebar'
import { TopHeader } from '../components/TopHeader'
import { useSidebarStore } from '@/lib/store'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, isMobile, setMobile } = useSidebarStore()

  // Handle responsive sidebar state
  useEffect(() => {
    const handleResize = () => {
      setMobile(window.innerWidth < 1024)
    }

    // Initial check
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setMobile])

  // On mobile the sidebar is a fixed overlay (no impact on layout width).
  // On desktop (lg+) subtract the sidebar width so main never exceeds viewport.
  const mainWidth = !isMobile && isOpen ? 'calc(100% - 18rem)' : '100%'

  return (
    <div className="dashboard-canvas relative text-on-surface overflow-x-hidden">
      <AppBackground />
      <Sidebar />
      <TopHeader />
      <main
        className={`relative z-10 min-h-[calc(100vh-5rem)] overflow-x-hidden max-w-full p-4 transition-all duration-300 mt-20 lg:p-8 ${
          isOpen ? 'lg:ml-72' : 'lg:ml-0'
        }`}
        style={{ width: mainWidth }}
      >
        {children}
      </main>
    </div>
  )
}
