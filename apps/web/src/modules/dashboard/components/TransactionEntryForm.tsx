'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/modules/authentication/components/Button'
import { getAuthUser } from '@/lib/auth-store'
import { TransactionTypeToggle } from './TransactionTypeToggle'
import { CurrencyIcon } from './CurrencyIcon'
import { TransactionFileUpload } from './TransactionFileUpload'
import {
  transactionEntrySchema,
  type TransactionEntryFormData,
} from '../validators/transaction.validator'
import type { TransactionType } from '../types/transaction.types'
import {
  CURRENCY_LABELS,
  DEFAULT_CURRENCY,
  formatCurrencyAmount,
  type SupportedCurrency,
} from '../constants/currency'
import { cn } from '@/lib/utils'

type CategoryOption = { id: string; name: string; type: string }
type PaymentMethodOption = { id: string; name: string }

type TransactionEntryFormProps = {
  initialType?: TransactionType
  transactionId?: string
  initialData?: {
    type: TransactionType
    currency: SupportedCurrency
    amount: string
    categoryId: string
    paymentMethodId: string
    date: string
    description?: string
    createdById?: string
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function TransactionEntryForm({ initialType = 'CASH_IN', transactionId, initialData }: TransactionEntryFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currencyParam = (searchParams.get('currency') as SupportedCurrency) || DEFAULT_CURRENCY
  const isEditMode = !!transactionId
  const [transactionType, setTransactionType] = useState<TransactionType>(initialData?.type || initialType)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const defaultValues = initialData ? {
    type: initialData.type,
    currency: initialData.currency,
    amount: initialData.amount,
    categoryId: initialData.categoryId,
    paymentMethodId: initialData.paymentMethodId,
    date: initialData.date,
    description: initialData.description || '',
    createdById: initialData.createdById || '',
  } : {
    type: initialType,
    currency: DEFAULT_CURRENCY,
    amount: '',
    categoryId: '',
    paymentMethodId: '',
    date: todayIsoDate(),
    description: '',
    createdById: '',
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionEntryFormData>({
    resolver: zodResolver(transactionEntrySchema),
    defaultValues,
  })

  const amount = watch('amount')
  const currency = watch('currency') as SupportedCurrency

  const [isAdmin, setIsAdmin] = useState(false)
  const [usersList, setUsersList] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    const user = getAuthUser()
    if (!user) {
      router.replace('/')
      return
    }
    const isUserAdmin = user.role === 'ADMIN'
    setIsAdmin(isUserAdmin)

    if (!isEditMode && !watch('createdById')) {
      setValue('createdById', user.id)
    }
  }, [router, isEditMode, setValue, watch])

  useEffect(() => {
    if (!isAdmin) return

    async function loadUsers() {
      setIsLoadingUsers(true)
      try {
        const res = await fetch('/api/v1/users')
        const json = await res.json()
        if (json.success) {
          setUsersList(json.data)
        }
      } catch (error) {
        console.error('Failed to load users list:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [isAdmin])

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true)
      try {
        const [categoriesRes, methodsRes] = await Promise.all([
          fetch(`/api/v1/categories?type=${transactionType}`),
          fetch('/api/v1/payment-methods'),
        ])
        const categoriesJson = await categoriesRes.json()
        const methodsJson = await methodsRes.json()

        if (categoriesJson.success) {
          setCategories(categoriesJson.data)
        }
        if (methodsJson.success) {
          setPaymentMethods(methodsJson.data)
        }
      } catch (error) {
        console.error('Failed to load form options:', error)
      } finally {
        setIsLoadingOptions(false)
      }
    }

    loadOptions()
  }, [transactionType])

  useEffect(() => {
    setValue('type', transactionType)
    setValue('categoryId', '')
  }, [transactionType, setValue])

  const handleTypeChange = (type: TransactionType) => {
    setTransactionType(type)
    reset({
      type,
      currency: watch('currency'),
      amount: watch('amount'),
      categoryId: '',
      paymentMethodId: watch('paymentMethodId'),
      date: watch('date'),
      description: watch('description'),
    })
  }

  const onSubmit = async (data: TransactionEntryFormData) => {
    setSubmitError(null)
    const user = getAuthUser()
    if (!user) {
      router.replace('/')
      return
    }

    const oversized = attachments.find((file) => file.size > MAX_FILE_SIZE)
    if (oversized) {
      setSubmitError(`"${oversized.name}" exceeds the 10 MB limit`)
      return
    }

    try {
      if (isEditMode && transactionId) {
        const response = await fetch(`/api/v1/transactions/${transactionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: data.type,
            currency: data.currency,
            amount: Number(data.amount),
            categoryId: data.categoryId,
            paymentMethodId: data.paymentMethodId,
            date: new Date(data.date).toISOString(),
            description: data.description?.trim() || null,
            createdById: isAdmin ? (data.createdById || user.id) : undefined,
          }),
        })

        const result = await response.json()
        if (!response.ok || !result.success) {
          setSubmitError(result.message || 'Failed to update transaction')
          return
        }

        router.push(`/transactions/${transactionId}?currency=${currencyParam}`)
      } else {
        const formData = new FormData()
        formData.append('type', data.type)
        formData.append('currency', data.currency)
        formData.append('amount', data.amount)
        formData.append('categoryId', data.categoryId)
        formData.append('paymentMethodId', data.paymentMethodId)
        formData.append('date', new Date(data.date).toISOString())
        formData.append('createdById', isAdmin ? (data.createdById || user.id) : user.id)
        if (data.description?.trim()) {
          formData.append('description', data.description.trim())
        }
        attachments.forEach((file) => formData.append('files', file))

        const response = await fetch('/api/v1/transactions', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        if (!response.ok || !result.success) {
          setSubmitError(result.message || 'Failed to save transaction')
          return
        }

        router.push(`/transactions?currency=${currencyParam}`)
      }
    } catch (error) {
      console.error('Submit transaction error:', error)
      setSubmitError(isEditMode ? 'Failed to update transaction. Please try again.' : 'Failed to save transaction. Please try again.')
    }
  }

  const amountVariant = transactionType === 'CASH_IN' ? 'income' : 'expense'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <TransactionTypeToggle value={transactionType} onChange={handleTypeChange} />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
        <div className="space-y-2">
          <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
            Currency
          </label>
          <select
            className="squircle w-full min-h-[44px] border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-body-md outline-none focus:border-primary/40"
            {...register('currency')}
          >
            {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="text-label-sm text-red-600">{errors.currency.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
            Amount
          </label>
          <div
            className={cn(
              'squircle flex min-h-[88px] items-center gap-4 border px-5 py-4 transition-colors sm:px-6',
              transactionType === 'CASH_IN'
                ? 'border-green-200 bg-green-50/60'
                : 'border-red-200 bg-red-50/60'
            )}
          >
            <CurrencyIcon currency={currency} size="lg" variant={amountVariant} />
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent font-title text-3xl font-bold text-on-surface outline-none placeholder:text-outline sm:text-4xl"
              {...register('amount')}
            />
          </div>
          {errors.amount && (
            <p className="text-label-sm text-red-600">{errors.amount.message}</p>
          )}
          {amount && Number(amount) > 0 && (
            <p className="text-label-sm text-outline">
              {transactionType === 'CASH_IN' ? 'Recording income' : 'Recording expense'} of{' '}
              <span className="font-semibold text-on-surface">
                {formatCurrencyAmount(Number(amount), currency)}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
            Category
          </label>
          <select
            className="squircle w-full min-h-[44px] border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-body-md outline-none focus:border-primary/40"
            disabled={isLoadingOptions}
            {...register('categoryId')}
          >
            <option value="">
              {isLoadingOptions ? 'Loading categories...' : 'Select category'}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-label-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
            Payment Method
          </label>
          <select
            className="squircle w-full min-h-[44px] border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-body-md outline-none focus:border-primary/40"
            disabled={isLoadingOptions}
            {...register('paymentMethodId')}
          >
            <option value="">
              {isLoadingOptions ? 'Loading methods...' : 'Select payment method'}
            </option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
          {errors.paymentMethodId && (
            <p className="text-label-sm text-red-600">{errors.paymentMethodId.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
            Date
          </label>
          <input
            type="date"
            className="squircle w-full min-h-[44px] border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-body-md outline-none focus:border-primary/40"
            {...register('date')}
          />
          {errors.date && (
            <p className="text-label-sm text-red-600">{errors.date.message}</p>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
            Creator User
          </label>
          <select
            className="squircle w-full min-h-[44px] border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-body-md outline-none focus:border-primary/40"
            disabled={isLoadingUsers}
            {...register('createdById')}
          >
            <option value="">Select User</option>
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role?.name || u.role?.slug || 'User'})
              </option>
            ))}
          </select>
          {errors.createdById && (
            <p className="text-label-sm text-red-600">{errors.createdById.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
          Description <span className="normal-case text-outline">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Add notes about this entry..."
          className="squircle w-full resize-none border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-body-md outline-none focus:border-primary/40"
          {...register('description')}
        />
      </div>

      <TransactionFileUpload
        files={attachments}
        onChange={setAttachments}
        disabled={isSubmitting}
      />

      {submitError && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-label-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-primary/10 pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto sm:min-w-[160px]"
          disabled={isSubmitting}
          onClick={() => isEditMode && transactionId ? router.push(`/transactions/${transactionId}?currency=${currencyParam}`) : router.push(`/transactions?currency=${currencyParam}`)}
        >
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto sm:min-w-[200px]" isLoading={isSubmitting}>
          {isEditMode ? 'Update Entry' : 'Save Entry'}
        </Button>
      </div>
    </form>
  )
}
