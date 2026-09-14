import { AuthGuard } from '@/modules/authentication/components/AuthGuard'
import { DashboardLayout } from '@/modules/dashboard/layouts/DashboardLayout'

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  )
}
