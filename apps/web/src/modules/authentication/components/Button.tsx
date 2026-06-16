'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'bg-transparent text-[#6D4AFF] border-[1.5px] border-[#6D4AFF] rounded-full font-semibold hover:bg-[rgba(109,74,255,0.10)]',
      glass: 'btn-secondary',
    }

    const sizeClasses = {
      sm: 'h-11 px-6 text-sm',
      md: 'h-[52px] px-8 text-[0.9375rem]',
      lg: 'h-[60px] px-10 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'transition-all duration-300 flex items-center justify-center gap-3',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D4AFF]/40',
          'relative overflow-hidden group',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {leftIcon}
            <span className="relative z-10">{children}</span>
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
