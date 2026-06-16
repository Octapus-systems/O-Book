export type SupportedCurrency = 'AED' | 'INR'

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['AED', 'INR']

export const DEFAULT_CURRENCY: SupportedCurrency = 'AED'

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  AED: 'AED - UAE Dirham',
  INR: 'INR - Indian Rupee',
}

export function getCurrencySymbol(currency: string): string {
  if (currency === 'INR') return '₹'
  if (currency === 'AED') return 'د.إ'
  return currency
}

export function formatCurrencyAmount(
  amount: number,
  currency: string,
  options?: { showSign?: boolean }
): string {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = getCurrencySymbol(currency)
  const sign =
    options?.showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : amount < 0 ? '-' : ''
  return `${sign}${symbol}${formatted}`
}
