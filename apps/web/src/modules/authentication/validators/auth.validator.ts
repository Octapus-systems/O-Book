import { z } from 'zod'

export const loginSchema = z.object({
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only digits'),
  rememberDevice: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    entityName: z
      .string()
      .min(2, 'Entity name must be at least 2 characters')
      .max(50, 'Entity name must be at most 50 characters'),
    pin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d{4}$/, 'PIN must contain only digits'),
    confirmPin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d{4}$/, 'PIN must contain only digits'),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  })

export type SignupFormData = z.infer<typeof signupSchema>
