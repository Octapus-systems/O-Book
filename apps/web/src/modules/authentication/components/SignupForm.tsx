'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData } from '../validators/auth.validator'
import { PINInput } from './PINInput'
import { Button } from './Button'
import { ArrowRight, Building2, Lock } from 'lucide-react'

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      entityName: '',
      pin: '',
      confirmPin: '',
    },
  })

  const pin = watch('pin')
  const confirmPin = watch('confirmPin')

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSuccess(true)
    console.log('Signup data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-on-card-muted" />
          <label htmlFor="entityName" className="text-label-sm font-medium text-on-card-secondary">
            Entity Name
          </label>
        </div>
        <input
          id="entityName"
          type="text"
          placeholder="Your treasury entity"
          disabled={isLoading || isSuccess}
          className="auth-input w-full h-[52px] px-4 text-body-md"
          {...register('entityName')}
        />
        {errors.entityName && (
          <p className="text-label-sm text-red-500 mt-1">{errors.entityName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-on-card-muted" />
          <label className="text-label-sm font-medium text-on-card-secondary">
            Create PIN
          </label>
        </div>
        <PINInput
          value={pin}
          onChange={(value) => setValue('pin', value)}
          disabled={isLoading || isSuccess}
        />
        {errors.pin && (
          <p className="text-label-sm text-red-500 mt-1">{errors.pin.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-on-card-muted" />
          <label className="text-label-sm font-medium text-on-card-secondary">
            Confirm PIN
          </label>
        </div>
        <PINInput
          value={confirmPin}
          onChange={(value) => setValue('confirmPin', value)}
          disabled={isLoading || isSuccess}
        />
        {errors.confirmPin && (
          <p className="text-label-sm text-red-500 mt-1">{errors.confirmPin.message}</p>
        )}
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={pin.length !== 4 || confirmPin.length !== 4 || isSuccess}
          rightIcon={!isLoading && !isSuccess && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          leftIcon={isSuccess && (
            <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        >
          {isSuccess ? 'Account Created' : 'Register Treasury'}
        </Button>
      </div>
    </form>
  )
}
