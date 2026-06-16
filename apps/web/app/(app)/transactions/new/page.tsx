import { Suspense } from 'react'
import NewTransactionPage from '@/modules/dashboard/pages/NewTransactionPage'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-outline">Loading...</div>}>
      <NewTransactionPage />
    </Suspense>
  )
}
