import {
  LayoutDashboard,
  BookOpen,
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
  { label: 'Books', href: '/books', icon: BookOpen, implemented: false },
  { label: 'Reports', href: '/reports', icon: BarChart3, implemented: false },
  { label: 'Activity Logs', href: '/activity-logs', icon: History, implemented: false },
  { label: 'Import/Export', href: '/import-export', icon: Import, implemented: false },
  { label: 'Users', href: '/users', icon: Users, implemented: false },
  { label: 'Settings', href: '/settings', icon: Settings, implemented: false },
]
