import { z } from 'zod'

export const transactionEntrySchema = z.object({
  type: z.enum(['CASH_IN', 'CASH_OUT']),
  currency: z.enum(['AED', 'INR']),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be greater than zero',
    }),
  categoryId: z.string().min(1, 'Category is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
})

export type TransactionEntryFormData = z.infer<typeof transactionEntrySchema>
