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
import { X, Check } from 'lucide-react'
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

const CATEGORY_COLORS = [
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6B7280', // Gray
]

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

  // Inline category creation
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0])
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [saveCategoryError, setSaveCategoryError] = useState<string | null>(null)

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
            {...register('categoryId', {
              onChange: (e) => {
                if (e.target.value === 'ADD_NEW_CATEGORY') {
                  setValue('categoryId', '')
                  setIsAddCategoryModalOpen(true)
                }
              }
            })}
          >
            <option value="">
              {isLoadingOptions ? 'Loading categories...' : 'Select category'}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            {!isLoadingOptions && (
              <option value="ADD_NEW_CATEGORY" className="text-primary font-semibold">
                ➕ Add Category...
              </option>
            )}
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

      {/* Inline Category Creation Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsAddCategoryModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md glass-surface rim-light squircle p-6 shadow-xl text-left">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-title text-title-md font-bold text-on-surface">
                Create New Category
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition hover:bg-surface-container-lowest hover:text-on-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-label-sm font-medium text-outline">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Sales, Rent, Marketing"
                  required
                  className="w-full squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-label-sm font-medium text-outline">Category Type</label>
                <div className="text-body-sm font-semibold p-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface">
                  {transactionType === 'CASH_IN' ? 'Cash In (Income)' : 'Cash Out (Expense)'}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-label-sm font-medium text-outline">Description</label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Brief details about category uses..."
                  rows={2}
                  className="w-full squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-label-sm font-medium text-outline">Select Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c) => {
                    const active = newCategoryColor === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCategoryColor(c)}
                        className="group relative flex h-7 w-7 items-center justify-center rounded-full border border-black/10 transition hover:scale-110 active:scale-95"
                        style={{ backgroundColor: c }}
                        title={c}
                      >
                        {active && (
                          <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {saveCategoryError && <p className="text-sm text-red-600">{saveCategoryError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="flex-1 squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium text-on-surface transition hover:bg-primary-fixed/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingCategory}
                  onClick={async () => {
                    if (!newCategoryName.trim()) {
                      setSaveCategoryError('Category name is required')
                      return
                    }
                    setIsSavingCategory(true)
                    setSaveCategoryError(null)
                    try {
                      const res = await fetch('/api/v1/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: newCategoryName,
                          type: transactionType,
                          description: newCategoryDescription,
                          color: newCategoryColor,
                        }),
                      })
                      const json = await res.json()
                      if (!res.ok || !json.success) {
                        setSaveCategoryError(json.message || 'Something went wrong')
                        return
                      }

                      // Successfully saved
                      const newCat = json.data
                      setCategories((prev) => [...prev, newCat])
                      setValue('categoryId', newCat.id)
                      
                      // Reset and close
                      setNewCategoryName('')
                      setNewCategoryDescription('')
                      setNewCategoryColor(CATEGORY_COLORS[0])
                      setIsAddCategoryModalOpen(false)
                    } catch {
                      setSaveCategoryError('Network error')
                    } finally {
                      setIsSavingCategory(false)
                    }
                  }}
                  className="flex-1 squircle bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {isSavingCategory ? 'Saving…' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
