import { cn } from '@/lib/utils'
import type { SupportedCurrency } from '../constants/currency'

type CurrencyIconProps = {
  currency: SupportedCurrency
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'income' | 'expense'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-base',
  md: 'h-11 w-11 text-xl',
  lg: 'h-14 w-14 text-3xl',
}

export function CurrencyIcon({
  currency,
  size = 'md',
  className,
  variant = 'default',
}: CurrencyIconProps) {
  const variantClasses = {
    default: 'border-primary/20 bg-primary-fixed/30 text-primary',
    income: 'border-green-200 bg-green-100 text-green-700',
    expense: 'border-red-200 bg-red-100 text-red-700',
  }

  if (currency === 'INR') {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full border font-bold leading-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-label="Indian Rupee"
      >
        ₹
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold leading-none tracking-tight',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      dir="rtl"
      aria-label="UAE Dirham"
    >
      د.إ
    </span>
  )
}
