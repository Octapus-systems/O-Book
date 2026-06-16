'use client'

import { forwardRef, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PINInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  className?: string
  disabled?: boolean
}

export const PINInput = forwardRef<HTMLDivElement, PINInputProps>(
  ({ value, onChange, length = 4, className, disabled = false }, ref) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const digits = value.padEnd(length, '').split('').slice(0, length)

    const handleChange = (index: number, newValue: string) => {
      if (!/^\d*$/.test(newValue)) return

      const newDigits = [...digits]
      newDigits[index] = newValue.slice(-1)
      onChange(newDigits.join(''))

      if (newValue && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text')
      const digitsOnly = pastedData.replace(/\D/g, '').slice(0, length)
      onChange(digitsOnly)
      const focusIndex = Math.min(digitsOnly.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
    }

    useEffect(() => {
      if (value.length === length) {
        inputRefs.current[length - 1]?.blur()
      }
    }, [value, length])

    return (
      <div ref={ref} className={cn('grid grid-cols-4 gap-3', className)}>
        {Array.from({ length }).map((_, index) => (
          <div key={index} className="relative">
            <input
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digits[index] || ''}
              aria-label={`PIN digit ${index + 1}`}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled}
              autoComplete="one-time-code"
              className={cn(
                'auth-input w-full h-14 text-center text-xl font-semibold text-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed caret-transparent'
              )}
            />
            {digits[index] && (
              <span
                className="absolute inset-0 flex items-center justify-center pointer-events-none text-xl font-semibold text-on-card-primary"
                aria-hidden="true"
              >
                ●
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }
)

PINInput.displayName = 'PINInput'
