'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '../validators/auth.validator'
import { Checkbox } from './Checkbox'
import { Button } from './Button'
import { ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { setAuthUser } from '@/lib/auth-store'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberDevice: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null)
    setIsLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error || !authData.session) {
        setIsLoading(false)
        setLoginError('Invalid email or password.')
        return
      }

      if (authData.user) {
        setAuthUser({
          id: authData.user.id,
          email: authData.user.email ?? '',
          name:
            authData.user.user_metadata?.full_name ||
            authData.user.user_metadata?.name ||
            authData.user.email?.split('@')[0] ||
            'User',
          role: 'USER',
        })
      }

      setIsLoading(false)
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/transactions')
      }, 500)
    } catch (err) {
      setIsLoading(false)
      setLoginError('Invalid email or password.')
      console.error('Login error:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-label-sm font-medium text-on-card-secondary">
          <Mail className="h-3.5 w-3.5 text-on-card-muted" />
          Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            placeholder="you@example.com"
            disabled={isLoading || isSuccess}
            {...register('email')}
            className="auth-input w-full px-4 py-3 text-body-md text-on-card-primary placeholder:text-on-card-muted disabled:opacity-50"
          />
        </div>
        {errors.email && (
          <p className="text-label-sm text-red-500 flex items-center gap-1.5 mt-1">
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-label-sm font-medium text-on-card-secondary">
          <Lock className="h-3.5 w-3.5 text-on-card-muted" />
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            disabled={isLoading || isSuccess}
            {...register('password')}
            className="auth-input w-full px-4 py-3 pr-11 text-body-md text-on-card-primary placeholder:text-on-card-muted disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || isSuccess}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-card-muted hover:text-on-card-primary transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-label-sm text-red-500 flex items-center gap-1.5 mt-1">
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {errors.password.message}
          </p>
        )}
      </div>

      {loginError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-label-sm text-red-600 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{loginError}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-1">
        <Checkbox
          id="rememberDevice"
          label="Remember device"
          {...register('rememberDevice')}
          disabled={isLoading || isSuccess}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading || isSuccess}
          rightIcon={!isLoading && !isSuccess && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          leftIcon={isSuccess && (
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        >
          {isSuccess ? 'Access Granted' : 'Login'}
        </Button>
      </div>
    </form>
  )
}
