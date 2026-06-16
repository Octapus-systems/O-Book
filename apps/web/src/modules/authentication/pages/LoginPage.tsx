import { LoginCard } from '@/modules/authentication/components/LoginCard'
import { AuthLayout } from '@/modules/authentication/layouts/AuthLayout'

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginCard />
    </AuthLayout>
  )
}
