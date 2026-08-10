import {
  LayoutDashboard,
  BarChart3,
  History,
  Import,
  Users,
  Settings,
  CreditCard,
  Key,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  implemented: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Transactions', href: '/transactions', icon: CreditCard, implemented: true },
  { label: 'Reports', href: '/reports', icon: BarChart3, implemented: true },
  { label: 'Activity Logs', href: '/activity-logs', icon: History, implemented: false },
  { label: 'Import/Export', href: '/import-export', icon: Import, implemented: true },
  { label: 'User & Category', href: '/users', icon: Users, implemented: true },
  { label: 'API & Integration', href: '/settings', icon: Key, implemented: true },
]
