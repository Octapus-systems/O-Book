'use client'

import { useRef } from 'react'
import { FileText, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type TransactionFileUploadProps = {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,application/pdf'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TransactionFileUpload({ files, onChange, disabled }: TransactionFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return
    const next = [...files]
    Array.from(incoming).forEach((file) => {
      if (!next.some((f) => f.name === file.name && f.size === file.size)) {
        next.push(file)
      }
    })
    onChange(next)
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="text-label-sm font-bold uppercase tracking-wider text-outline">
        Attachments <span className="normal-case text-outline">(bills, invoices, receipts)</span>
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'squircle flex w-full min-h-[120px] flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-8 transition-all',
          'border-primary/25 bg-primary-fixed/10 hover:border-primary/40 hover:bg-primary-fixed/20',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm">
          <ImagePlus className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-title text-title-sm font-semibold text-on-surface">
            Upload bills or receipts
          </p>
          <p className="mt-1 text-label-sm text-outline">PNG, JPG, WEBP, or PDF up to 10 MB each</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="squircle flex items-center gap-3 border border-outline-variant bg-surface-container-lowest px-4 py-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed/20 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-body-md font-medium text-on-surface">
                  {file.name}
                </p>
                <p className="text-label-sm text-outline">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeFile(index)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-outline transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
