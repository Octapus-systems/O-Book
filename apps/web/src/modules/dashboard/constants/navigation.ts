import {
  LayoutDashboard,
  BarChart3,
  History,
  Import,
  Users,
  Settings,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  implemented: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, implemented: false },
  { label: 'Transactions', href: '/transactions', icon: CreditCard, implemented: true },
  { label: 'Reports', href: '/reports', icon: BarChart3, implemented: true },
  { label: 'Activity Logs', href: '/activity-logs', icon: History, implemented: false },
  { label: 'Import/Export', href: '/import-export', icon: Import, implemented: false },
  { label: 'User & Category', href: '/users', icon: Users, implemented: true },
  { label: 'Settings', href: '/settings', icon: Settings, implemented: false },
]
