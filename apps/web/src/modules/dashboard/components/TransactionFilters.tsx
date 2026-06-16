import { Calendar, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { CURRENCY_LABELS, type SupportedCurrency } from '../constants/currency'

type DateRangeOption = 'all-time' | 'today' | 'week' | 'last-30-days' | 'custom'
type TransactionType = 'all' | 'cash-in' | 'cash-out'

interface TransactionFiltersProps {
  selectedCurrency: SupportedCurrency
  onCurrencyChange: (currency: SupportedCurrency) => void
  selectedDateRange: DateRangeOption
  onDateRangeChange: (range: DateRangeOption) => void
  selectedType: TransactionType
  onTypeChange: (type: TransactionType) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
}

const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  'all-time': 'All Time',
  'today': 'Today',
  'week': 'This Week',
  'last-30-days': 'Last 30 Days',
  'custom': 'Custom Range',
}

const TYPE_LABELS: Record<TransactionType, string> = {
  'all': 'All Types',
  'cash-in': 'Cash In',
  'cash-out': 'Cash Out',
}

export function TransactionFilters({
  selectedCurrency,
  onCurrencyChange,
  selectedDateRange,
  onDateRangeChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: TransactionFiltersProps) {
  return (
    <div className="glass-surface rim-light squircle flex flex-col gap-4 p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-6">
      <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 sm:min-w-[150px]">
        <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
          Date Range
        </label>
        <div className="relative">
          <select
            className="squircle appearance-none border border-outline-variant bg-surface-container-lowest px-3 py-2.5 pr-8 font-body text-body-md outline-none sm:px-4"
            value={selectedDateRange}
            onChange={(e) => onDateRangeChange(e.target.value as DateRangeOption)}
          >
            {Object.entries(DATE_RANGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        </div>
      </div>

      <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 sm:min-w-[150px]">
        <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
          Currency
        </label>
        <div className="relative">
          <select
            className="squircle appearance-none border border-outline-variant bg-surface-container-lowest px-3 py-2.5 pr-8 font-body text-body-md outline-none sm:px-4"
            value={selectedCurrency}
            onChange={(e) => onCurrencyChange(e.target.value as SupportedCurrency)}
          >
            {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        </div>
      </div>

      <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 sm:min-w-[150px]">
        <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
          Type
        </label>
        <div className="relative">
          <select
            className="squircle appearance-none border border-outline-variant bg-surface-container-lowest px-3 py-2.5 pr-8 font-body text-body-md outline-none sm:px-4"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as TransactionType)}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        </div>
      </div>

      <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 sm:min-w-[150px]">
        <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
          Category
        </label>
        <div className="relative">
          <select
            className="squircle appearance-none border border-outline-variant bg-surface-container-lowest px-3 py-2.5 pr-8 font-body text-body-md outline-none sm:px-4"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        </div>
      </div>

      <button
        type="button"
        className="squircle border border-primary/20 bg-primary/5 p-2.5 text-primary transition-all hover:bg-primary/10 active:scale-95"
        aria-label="Advanced filters"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>
    </div>
  )
}
