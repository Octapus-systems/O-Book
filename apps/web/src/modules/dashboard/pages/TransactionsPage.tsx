'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TransactionFilters } from '../components/TransactionFilters'
import { TransactionTable } from '../components/TransactionTable'
import { FloatingActionButton } from '../components/FloatingActionButton'
import { TransactionStatsCard } from '../components/TransactionStatsCard'
import type { Transaction } from '../types/transaction.types'
import { mapApiTransactionToDisplay, type ApiTransaction } from '../utils/transaction.mapper'
import { DEFAULT_CURRENCY, type SupportedCurrency } from '../constants/currency'

type DateRangeOption = 'all-time' | 'today' | 'week' | 'last-30-days' | 'custom'
type TransactionType = 'all' | 'cash-in' | 'cash-out'

export default function TransactionsPage({
  initialApiTransactions = [],
}: {
  initialApiTransactions?: ApiTransaction[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    initialApiTransactions.map((tx, index) => mapApiTransactionToDisplay(tx, index))
  )
  const selectedCurrency = (searchParams.get('currency') as SupportedCurrency) || DEFAULT_CURRENCY

  const handleCurrencyChange = useCallback((currency: SupportedCurrency) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('currency', currency)
    router.replace(`/transactions?${params.toString()}`, { scroll: false })
  }, [router, searchParams])
  const [isLoading, setIsLoading] = useState(initialApiTransactions.length === 0)
  const [error, setError] = useState<string | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter states
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('all-time')
  const [selectedType, setSelectedType] = useState<TransactionType>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedUser, setSelectedUser] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Users list state
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/v1/users')
        const result = await response.json()
        if (response.ok && result.success) {
          setUsers(result.data)
        }
      } catch (err) {
        console.error('Fetch users error:', err)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/v1/transactions')
        const result = await response.json()
        if (!response.ok || !result.success) {
          setError(result.message || 'Failed to load transactions')
          return
        }
        const mapped = (result.data as ApiTransaction[]).map((tx, index) =>
          mapApiTransactionToDisplay(tx, index)
        )
        setTransactions(mapped)
      } catch (err) {
        console.error('Fetch transactions error:', err)
        setError('Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }

    // Always fetch if refresh parameter is present
    const refreshParam = searchParams.get('refresh')
    if (refreshParam || initialApiTransactions.length === 0) {
      fetchTransactions()
      // Clean up the refresh parameter from URL
      if (refreshParam) {
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.delete('refresh')
        router.replace(`/transactions?${newParams.toString()}`, { scroll: false })
      }
    }
  }, [initialApiTransactions.length, searchParams, router])

  // Extract unique categories from transactions
  const categories = useMemo(() => {
    const uniqueCategories = new Set(transactions.map((tx) => tx.category))
    return Array.from(uniqueCategories).filter(Boolean)
  }, [transactions])

  // 1. Filter by currency and calculate running balance chronologically on the full currency transactions list
  const currencyTransactionsWithBalance = useMemo(() => {
    // Filter only by currency first
    const currencyTx = transactions.filter((tx) => tx.currency === selectedCurrency)
    
    // Sort oldest first (we can just reverse the original array, because the API returns newest first)
    const oldestFirst = [...currencyTx].reverse()
    
    // Calculate chronological running balance
    let runningBalance = 0
    const calculated = oldestFirst.map((tx) => {
      runningBalance += tx.amount
      return { ...tx, balance: runningBalance }
    })
    
    // Reverse back to newest first
    return calculated.reverse()
  }, [transactions, selectedCurrency])

  // 2. Filter the currency transactions based on other filter criteria
  const filteredTransactions = useMemo(() => {
    let filtered = currencyTransactionsWithBalance

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          tx.entity.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query) ||
          tx.description?.toLowerCase().includes(query)
      )
    }

    // Filter by user
    if (selectedUser !== 'all') {
      filtered = filtered.filter(
        (tx) => tx.createdBy?.id === selectedUser || tx.createdBy?.name === selectedUser
      )
    }

    // Filter by type (Cash In/Cash Out)
    if (selectedType === 'cash-in') {
      filtered = filtered.filter((tx) => tx.amount >= 0)
    } else if (selectedType === 'cash-out') {
      filtered = filtered.filter((tx) => tx.amount < 0)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((tx) => tx.category === selectedCategory)
    }

    // Filter by date range
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (selectedDateRange === 'today') {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.date)
        return txDate >= today
      })
    } else if (selectedDateRange === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.date)
        return txDate >= weekAgo
      })
    } else if (selectedDateRange === 'last-30-days') {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.date)
        return txDate >= thirtyDaysAgo
      })
    } else if (selectedDateRange === 'custom') {
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        filtered = filtered.filter((tx) => new Date(tx.date) >= start)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filtered = filtered.filter((tx) => new Date(tx.date) <= end)
      }
    }

    return filtered
  }, [currencyTransactionsWithBalance, searchQuery, selectedUser, selectedType, selectedCategory, selectedDateRange, startDate, endDate])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedType, selectedCategory, selectedDateRange, selectedCurrency, selectedUser, startDate, endDate, pageSize])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleRowClick = useCallback((transaction: Transaction) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('currency', transaction.currency)
    router.push(`/transactions/${transaction.id}?${params.toString()}`)
  }, [router, searchParams])

  return (
    <>
      <div className="min-w-0 flex-1 space-y-6">
        <TransactionStatsCard 
          transactions={transactions} 
          currency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
        />
        
        {/* Search Input */}
        <div className="glass-surface rim-light squircle flex items-center gap-3 px-4 py-3 sm:px-6">
          <Search className="h-5 w-5 text-outline" />
          <input
            type="text"
            placeholder="Search by entity, category, or description..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent font-body text-body-md text-on-surface placeholder:text-outline outline-none"
          />
        </div>

        <TransactionFilters 
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          users={users}
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {isLoading ? (
          <div className="glass-surface rim-light squircle p-8 text-center text-body-md text-outline">
            Loading transactions...
          </div>
        ) : error ? (
          <div className="glass-surface rim-light squircle border border-red-200 p-8 text-center text-body-md text-red-700">
            {error}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="glass-surface rim-light squircle p-8 text-center">
            <p className="font-title text-title-md text-on-surface">
              {searchQuery ? 'No results found' : 'No transactions yet'}
            </p>
            <p className="mt-2 text-body-md text-outline">
              {searchQuery 
                ? 'Try different keywords or remove filters'
                : 'Use Quick Add to record your first cash in or cash out entry.'
              }
            </p>
          </div>
        ) : (
          <>
            <TransactionTable
              transactions={paginatedTransactions}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRowClick={handleRowClick}
            />

            {/* Pagination Controls */}
            <div className="glass-surface rim-light squircle flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6 sm:py-4">
              <div className="text-label-sm text-outline">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} items
              </div>

              <div className="flex items-center gap-4">
                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="squircle border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-body-md outline-none"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="squircle flex h-9 w-9 items-center justify-center border border-outline-variant bg-surface-container-lowest text-outline transition-all hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="min-w-[60px] text-center font-body text-body-md text-on-surface">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="squircle flex h-9 w-9 items-center justify-center border border-outline-variant bg-surface-container-lowest text-outline transition-all hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <FloatingActionButton />
    </>
  )
}
