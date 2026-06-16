'use client'

import { useState, useMemo } from 'react'
import type { Transaction } from '../types/transaction.types'
import { CurrencyIcon } from './CurrencyIcon'
import {
  DEFAULT_CURRENCY,
  formatCurrencyAmount,
  type SupportedCurrency,
} from '../constants/currency'

interface TransactionStatsCardProps {
  transactions: Transaction[]
  currency: SupportedCurrency
  onCurrencyChange: (currency: SupportedCurrency) => void
}

export function TransactionStatsCard({ transactions, currency, onCurrencyChange }: TransactionStatsCardProps) {

  const stats = useMemo(() => {
    let cashIn = 0
    let cashOut = 0

    transactions
      .filter((tx) => tx.currency === currency)
      .forEach((tx) => {
        if (tx.amount > 0) {
          cashIn += tx.amount
        } else {
          cashOut += Math.abs(tx.amount)
        }
      })

    return {
      cashIn,
      cashOut,
      netBalance: cashIn - cashOut,
    }
  }, [transactions, currency])

  return (
    <div className="glass-surface rim-light squircle space-y-4 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-title text-title-md font-semibold text-on-surface">Transaction Stats</h2>

        <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest p-1">
          {(['AED', 'INR'] as SupportedCurrency[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onCurrencyChange(code)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                currency === code
                  ? 'bg-white text-on-surface shadow-md'
                  : 'text-outline hover:bg-primary-fixed/20 hover:text-on-surface'
              }`}
            >
              <CurrencyIcon currency={code} size="sm" />
              {code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="squircle border border-green-200 bg-green-50/50 p-4 transition-all hover:bg-green-50">
          <div className="mb-2 flex items-center gap-3">
            <CurrencyIcon currency={currency} size="sm" variant="income" />
            <span className="text-label-sm font-bold uppercase tracking-wider text-outline">
              Cash In
            </span>
          </div>
          <p className="font-title text-title-lg font-bold text-on-surface">
            {formatCurrencyAmount(stats.cashIn, currency)}
          </p>
        </div>

        <div className="squircle border border-red-200 bg-red-50/50 p-4 transition-all hover:bg-red-50">
          <div className="mb-2 flex items-center gap-3">
            <CurrencyIcon currency={currency} size="sm" variant="expense" />
            <span className="text-label-sm font-bold uppercase tracking-wider text-outline">
              Cash Out
            </span>
          </div>
          <p className="font-title text-title-lg font-bold text-on-surface">
            {formatCurrencyAmount(stats.cashOut, currency)}
          </p>
        </div>

        <div className="squircle border border-primary/20 bg-primary-fixed/10 p-4 transition-all hover:bg-primary-fixed/20">
          <div className="mb-2 flex items-center gap-3">
            <CurrencyIcon currency={currency} size="sm" />
            <span className="text-label-sm font-bold uppercase tracking-wider text-outline">
              Net Balance
            </span>
          </div>
          <p
            className={`font-title text-title-lg font-bold ${
              stats.netBalance >= 0 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {formatCurrencyAmount(stats.netBalance, currency, { showSign: true })}
          </p>
        </div>
      </div>
    </div>
  )
}
