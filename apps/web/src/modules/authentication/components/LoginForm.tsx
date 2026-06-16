'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '../validators/auth.validator'
import { PINInput } from './PINInput'
import { Checkbox } from './Checkbox'
import { Button } from './Button'
import { ArrowRight, Lock } from 'lucide-react'
import { setAuthUser } from '@/lib/auth-store'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      pin: '',
      rememberDevice: false,
    },
  })

  const pin = watch('pin')

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null)
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: data.pin }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setIsLoading(false)
        // Show error for incorrect PIN
        if (result.error === 'INVALID_CREDENTIALS') {
          setLoginError('Incorrect PIN')
          return
        }
        throw new Error(result.message || 'Login failed')
      }

      setAuthUser(result.data.user)
      setIsLoading(false)
      setIsSuccess(true)
      setTimeout(() => router.push('/transactions'), 600)
    } catch (error) {
      setIsLoading(false)
      setLoginError('Login failed. Please try again.')
      console.error('Login error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-on-card-muted" />
          <label className="text-label-sm font-medium text-on-card-secondary">
            Access PIN
          </label>
        </div>
        <PINInput
          value={pin}
          onChange={(value) => setValue('pin', value)}
          disabled={isLoading || isSuccess}
        />
        {errors.pin && (
          <p className="text-label-sm text-red-500 flex items-center gap-1.5 mt-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {errors.pin.message}
          </p>
        )}
        {loginError && (
          <p className="text-label-sm text-red-500 flex items-center gap-1.5 mt-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {loginError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        <Checkbox
          id="rememberDevice"
          label="Remember device"
          {...control.register('rememberDevice')}
          disabled={isLoading || isSuccess}
        />
        <a
          href="#"
          className="text-label-sm text-[#6D4AFF] hover:text-[#8B6BFF] transition-colors whitespace-nowrap"
        >
          Forgot PIN?
        </a>
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={pin.length !== 4 || isSuccess}
          rightIcon={!isLoading && !isSuccess && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          leftIcon={isSuccess && (
            <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        >
          {isSuccess ? 'Access Granted' : 'Enter Dashboard'}
        </Button>
      </div>
    </form>
  )
}
