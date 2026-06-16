import { DashboardLayout } from '@/modules/dashboard/layouts/DashboardLayout'

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
