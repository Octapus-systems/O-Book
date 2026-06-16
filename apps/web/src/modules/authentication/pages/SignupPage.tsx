import { SignupCard } from '@/modules/authentication/components/SignupCard'
import { AuthLayout } from '@/modules/authentication/layouts/AuthLayout'

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupCard />
    </AuthLayout>
  )
}
