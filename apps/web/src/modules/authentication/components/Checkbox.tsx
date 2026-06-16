'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label className={cn('flex items-center gap-2.5 cursor-pointer group min-h-[44px]', className)}>
        <div className="relative w-5 h-5 flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className="peer sr-only"
            {...props}
          />
          <div className="auth-checkbox w-5 h-5 transition-all duration-200 peer-checked:bg-[#6D4AFF] peer-checked:border-[#6D4AFF] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
          <svg
            className="absolute inset-0 text-white text-[12px] opacity-0 peer-checked:opacity-100 peer-checked:scale-100 scale-50 flex items-center justify-center pointer-events-none transition-all duration-200 z-10"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </div>
        {label && (
          <span className="text-body-md text-on-card-secondary transition-colors duration-200 peer-disabled:opacity-50">
            {label}
          </span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
