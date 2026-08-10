'use client'

import { useState, useEffect, useRef } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  RefreshCw,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Info,
  Check,
  Archive,
  FileWarning,
  Loader2,
} from 'lucide-react'
import { parseExcelFile, type ParsedImportRow } from '../utils/excel-import.parser'
import { getAuthUser } from '@/lib/auth-store'
import { formatCurrencyAmount } from '../constants/currency'

type ExistingCategory = {
  id: string
  name: string
  type: string
}

// ---------------------------------------------------------------------------
// Attachment type (subset of what the API returns)
// ---------------------------------------------------------------------------
type TransactionAttachment = {
  id: string
  fileName: string
  filePath: string // public Supabase URL
  mimeType: string
  fileSize: number
}

type TransactionWithAttachments = {
  id: string
  type: string
  amount: number
  balance: number
  currency: string
  description: string | null
  date: string
  category: { name: string } | null
  paymentMethod: { name: string } | null
  createdBy: { name: string } | null
  attachments: TransactionAttachment[]
}

export function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([])
  const [existingCategories, setExistingCategories] = useState<ExistingCategory[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    importedCount: number
    categoriesCreatedCount: number
  } | null>(null)

  // ZIP export state
  const [exportingZip, setExportingZip] = useState(false)
  const [zipProgress, setZipProgress] = useState<string | null>(null)
  const [zipFailedFiles, setZipFailedFiles] = useState<string[]>([])
  const [zipSuccess, setZipSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Fetch existing categories from API to check duplicates
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/v1/categories?all=true')
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setExistingCategories(data.data)
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    loadCategories()
  }, [])

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile)
    setErrorMsg(null)
    setImportResult(null)
    setParsing(true)

    try {
      const rows = await parseExcelFile(selectedFile)
      if (rows.length === 0) {
        setErrorMsg('No valid transaction rows found in the uploaded file.')
      }
      setParsedRows(rows)
    } catch (err) {
      console.error('Parsing error:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse Excel file.')
      setParsedRows([])
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile.name.endsWith('.xlsx') ||
        droppedFile.name.endsWith('.xls') ||
        droppedFile.name.endsWith('.csv')
      ) {
        handleFileChange(droppedFile)
      } else {
        setErrorMsg('Please upload a valid .xlsx, .xls, or .csv file.')
      }
    }
  }

  const handleRemoveRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id))
  }

  const isExistingCategory = (catName: string) => {
    const nameLower = catName.trim().toLowerCase()
    return existingCategories.some((c) => c.name.trim().toLowerCase() === nameLower)
  }

  // Calculate Summary Stats
  const totalCashIn = parsedRows
    .filter((r) => r.type === 'CASH_IN')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalCashOut = parsedRows
    .filter((r) => r.type === 'CASH_OUT')
    .reduce((sum, r) => sum + r.amount, 0)

  const newCategoriesList = Array.from(
    new Set(
      parsedRows
        .map((r) => r.categoryName.trim())
        .filter((cat) => cat && !isExistingCategory(cat))
    )
  )

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return
    setImporting(true)
    setErrorMsg(null)

    try {
      const user = getAuthUser()
      const res = await fetch('/api/v1/import/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: parsedRows.map((r) => ({
            type: r.type,
            amount: r.amount,
            currency: r.currency,
            categoryName: r.categoryName,
            paymentMethodName: r.paymentMethodName,
            description: r.description,
            date: r.date,
            createdByName: r.createdByName,
          })),
          fallbackUserId: user?.id,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Import failed')
      }

      setImportResult(data.data)
      setParsedRows([])
      setFile(null)

      // Refresh categories list
      const catRes = await fetch('/api/v1/categories?all=true')
      const catData = await catRes.json()
      if (catData.success && Array.isArray(catData.data)) {
        setExistingCategories(catData.data)
      }
    } catch (err) {
      console.error('Import submit error:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers shared by both export functions
  // ---------------------------------------------------------------------------

  /**
   * Build the Excel workbook from a list of transactions.
   * @param withAttachmentCol  When true, adds an "Attachments" column populated
   *                           with the ZIP-internal filenames for each transaction.
   * @param attachmentMap      Map from transaction.id → array of zip-internal filenames.
   */
  async function buildWorkbook(
    transactions: TransactionWithAttachments[],
    withAttachmentCol: boolean,
    attachmentMap: Map<string, string[]>
  ) {
    const ExcelJS = (await import('exceljs')).default || (await import('exceljs'))
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Transactions')

    worksheet.addRow(['Transaction Report'])
    worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true }
    worksheet.addRow([`Exported on: ${new Date().toLocaleString()}`])
    worksheet.addRow([])

    const headers = ['Description & User', 'Category', 'Amount', 'Balance', 'Status']
    if (withAttachmentCol) headers.push('Attachments')

    const headerRow = worksheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      }
    })

    transactions.forEach((tx) => {
      const descUser = `${tx.description || '-'}\nAdded by ${tx.createdBy?.name || 'User'} • ${new Date(tx.date).toLocaleDateString()}`
      const sign = tx.type === 'CASH_IN' ? '+' : '-'
      const amountStr = `${sign}₹${tx.amount}\n${tx.currency || 'INR'}`
      const balanceStr = `₹${tx.balance ?? 0}`

      const rowData: (string | number)[] = [
        descUser,
        tx.category?.name || 'General',
        amountStr,
        balanceStr,
        'Approved',
      ]

      if (withAttachmentCol) {
        const files = attachmentMap.get(tx.id) ?? []
        rowData.push(files.join(', '))
      }

      worksheet.addRow(rowData)
    })

    return workbook
  }

  // ---------------------------------------------------------------------------
  // Export Excel only (existing behaviour — unchanged)
  // ---------------------------------------------------------------------------

  const handleExportClick = async () => {
    try {
      const res = await fetch('/api/v1/transactions')
      const data = await res.json()

      if (!data.success || !Array.isArray(data.data)) {
        alert('Failed to fetch transactions for export.')
        return
      }

      const transactions: TransactionWithAttachments[] = data.data
      if (transactions.length === 0) {
        alert('No transactions to export.')
        return
      }

      const workbook = await buildWorkbook(transactions, false, new Map())
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `CashBook_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export Excel file.')
    }
  }

  // ---------------------------------------------------------------------------
  // Export Excel + Attachments as ZIP
  // ---------------------------------------------------------------------------

  const handleExportZip = async () => {
    setExportingZip(true)
    setZipProgress('Fetching transactions…')
    setZipFailedFiles([])
    setZipSuccess(false)

    try {
      // 1. Fetch transactions (already includes attachments[] from the API)
      const res = await fetch('/api/v1/transactions')
      const data = await res.json()

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Failed to fetch transactions.')
      }

      const transactions: TransactionWithAttachments[] = data.data
      if (transactions.length === 0) {
        throw new Error('No transactions to export.')
      }

      // 2. Collect every attachment across all transactions
      type AttachmentJob = {
        txId: string
        txShortId: string
        originalFileName: string
        url: string
        zipName: string // deduped filename inside the ZIP
      }

      // Build jobs, deduplicating filenames inside the Attachments/ folder
      const usedNames = new Map<string, number>() // base-name → count

      const jobs: AttachmentJob[] = []
      transactions.forEach((tx) => {
        const shortId = tx.id.slice(-5) // last 5 chars of cuid — enough to be readable
        tx.attachments.forEach((att) => {
          const safe = att.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
          const base = `Transaction-${shortId}-${safe}`

          // Deduplicate: if the same base name appears more than once, suffix with a counter.
          // e.g. "Transaction-abc12-invoice.pdf" → "Transaction-abc12-invoice-2.pdf"
          const existing = usedNames.get(base) ?? 0
          let zipName: string
          if (existing === 0) {
            zipName = base
          } else {
            const lastDot = base.lastIndexOf('.')
            if (lastDot > 0) {
              zipName = `${base.slice(0, lastDot)}-${existing}${base.slice(lastDot)}`
            } else {
              zipName = `${base}-${existing}`
            }
          }
          usedNames.set(base, existing + 1)

          jobs.push({ txId: tx.id, txShortId: shortId, originalFileName: att.fileName, url: att.filePath, zipName })
        })
      })

      // 3. Build a map: txId → [zipName, ...] — used for the Excel Attachments column
      const attachmentMap = new Map<string, string[]>()
      transactions.forEach((tx) => attachmentMap.set(tx.id, []))
      jobs.forEach((j) => attachmentMap.get(j.txId)!.push(j.zipName))

      // 4. Build Excel
      setZipProgress('Building Excel…')
      const workbook = await buildWorkbook(transactions, true, attachmentMap)
      const xlsxBuffer = await workbook.xlsx.writeBuffer()

      // 5. Fetch each attachment file (resilient — continue on failure)
      const failed: string[] = []
      const zipFiles: Record<string, Uint8Array> = {
        'Transactions.xlsx': new Uint8Array(xlsxBuffer as ArrayBuffer),
      }

      const total = jobs.length
      let done = 0

      for (const job of jobs) {
        done++
        setZipProgress(
          total > 0
            ? `Downloading attachment ${done} of ${total}: ${job.originalFileName}`
            : 'Building ZIP…'
        )

        try {
          const fileRes = await fetch(job.url)
          if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status}`)
          const arrayBuf = await fileRes.arrayBuffer()
          zipFiles[`Attachments/${job.zipName}`] = new Uint8Array(arrayBuf)
        } catch (err) {
          console.warn(`Failed to download attachment "${job.originalFileName}":`, err)
          failed.push(job.originalFileName)
        }
      }

      // 6. Generate ZIP using fflate (synchronous for simplicity at this scale)
      setZipProgress('Generating ZIP…')
      const { zipSync } = await import('fflate')
      const zipped = zipSync(zipFiles, { level: 0 }) // level 0 = store (fast; files are already compressed)

      // 7. Trigger download
      const blob = new Blob([zipped], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `O-Book-Export_${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      URL.revokeObjectURL(url)

      setZipFailedFiles(failed)
      setZipSuccess(true)
    } catch (err) {
      console.error('ZIP export error:', err)
      setZipFailedFiles([])
      setZipProgress(null)
      alert(err instanceof Error ? err.message : 'Failed to generate ZIP export.')
    } finally {
      setExportingZip(false)
      setZipProgress(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Import / Export
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Import transactions from Excel sheets with automatic category creation or export your cashbook data.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'import'
                ? 'bg-white text-indigo-600 shadow dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            Import Excel
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'export'
                ? 'bg-white text-indigo-600 shadow dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {importResult && (
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Import Completed Successfully!
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Imported {importResult.importedCount} transactions and automatically created {importResult.categoriesCreatedCount} new categories.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200">
              <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-200 bg-slate-50/50 p-10 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-indigo-500"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0])
                }
              }}
            />
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner group-hover:scale-110 transition-transform dark:bg-indigo-950 dark:text-indigo-400">
              <FileSpreadsheet className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Upload your Excel Spreadsheet
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Drag & drop your file here, or click to browse (.xlsx, .xls, .csv)
            </p>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Parsing Excel File...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Select File
                  </>
                )}
              </button>
            </div>

            {file && !parsing && (
              <p className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>

          {/* Guide Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-2">
              <Info className="h-4 w-4 text-indigo-500" />
              Supported Excel Sheet Structure
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              The importer supports both custom multi-line columns (`Description & User`, `Category`, `Amount`, `Balance`, `Status`) and standard columns (`Date`, `Description`, `Category`, `Amount`, `Type`).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Description & User
                </span>
                Contains title, optional notes, and creator date metadata (e.g. `Lovable payment\nAdded by Octopus Company • Jul 21, 2026`).
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Auto Category Creation
                </span>
                Categories like <code className="bg-indigo-50 px-1 py-0.5 rounded dark:bg-indigo-950">Tools Purchase</code> or <code className="bg-indigo-50 px-1 py-0.5 rounded dark:bg-indigo-950">Petty Cash</code> will be created automatically if missing!
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Amount Sign Detection
                </span>
                Negative numbers (<code className="text-rose-500">-₹1,200.00</code>) become <strong>Cash Out</strong>. Positive numbers (<code className="text-emerald-500">+₹650.00</code>) become <strong>Cash In</strong>.
              </div>
            </div>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Rows</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{parsedRows.length}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Cash In</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrencyAmount(totalCashIn, parsedRows[0]?.currency || 'AED', { showSign: true })}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20">
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Total Cash Out</p>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                    {formatCurrencyAmount(-totalCashOut, parsedRows[0]?.currency || 'AED', { showSign: true })}
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">New Categories</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {newCategoriesList.length}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-slate-900 p-4 text-white dark:bg-slate-800 shadow-xl">
                <div>
                  <h4 className="font-semibold text-sm">Ready to import {parsedRows.length} transactions</h4>
                  <p className="text-xs text-slate-400">
                    {newCategoriesList.length > 0
                      ? `${newCategoriesList.length} missing categories (${newCategoriesList.join(', ')}) will be created automatically.`
                      : 'All categories exist in database.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={importing}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-400 active:scale-95 transition-all disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Importing to CashBook...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Confirm & Import Now
                    </>
                  )}
                </button>
              </div>

              {/* Preview Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:bg-slate-800/80 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3.5">#</th>
                        <th className="px-4 py-3.5">Description & User</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Type</th>
                        <th className="px-4 py-3.5">Amount</th>
                        <th className="px-4 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.map((row, idx) => {
                        const exists = isExistingCategory(row.categoryName)
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white whitespace-pre-line">
                                {row.description}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {row.createdByName && <span>Added by {row.createdByName} • </span>}
                                <span>{new Date(row.date).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {row.categoryName}
                                </span>
                                {exists ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    <Check className="h-3 w-3" /> Exists
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    <FolderPlus className="h-3 w-3" /> Will Create
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {row.type === 'CASH_IN' ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                  <ArrowDownLeft className="h-3.5 w-3.5" /> Cash In
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                  <ArrowUpRight className="h-3.5 w-3.5" /> Cash Out
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              <span className={row.type === 'CASH_IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {formatCurrencyAmount(row.type === 'CASH_IN' ? row.amount : -row.amount, row.currency, { showSign: true })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 transition-colors"
                                title="Remove row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="max-w-2xl mx-auto space-y-5">

          {/* ── Success banner after ZIP export ── */}
          {zipSuccess && (
            <div className="flex items-start justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    ZIP downloaded successfully!
                  </p>
                  {zipFailedFiles.length > 0 && (
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                      {zipFailedFiles.length} attachment{zipFailedFiles.length > 1 ? 's' : ''} could not be downloaded and were skipped:{' '}
                      <span className="font-semibold">{zipFailedFiles.join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setZipSuccess(false); setZipFailedFiles([]) }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ── Progress indicator while exporting ZIP ── */}
          {exportingZip && zipProgress && (
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">{zipProgress}</p>
            </div>
          )}

          {/* ── Option 1: Excel only ── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Download Excel Only</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Export all transaction records as a formatted <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.xlsx</code> file.
                Does not include attachments.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportClick}
              disabled={exportingZip}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </button>
          </div>

          {/* ── Option 2: Excel + Attachments ZIP ── */}
          <div className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm dark:border-violet-800/50 dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
            {/* subtle accent stripe */}
            <div className="absolute inset-y-0 left-0 w-1 rounded-l-3xl bg-gradient-to-b from-violet-500 to-indigo-500" />
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <Archive className="h-7 w-7" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Excel + Attachments</h3>
                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  ZIP
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Downloads a <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.zip</code> containing{' '}
                <strong className="text-slate-700 dark:text-slate-300">Transactions.xlsx</strong> plus an{' '}
                <strong className="text-slate-700 dark:text-slate-300">Attachments/</strong> folder with every invoice, receipt, and bill attached to your transactions.
              </p>
              {/* ZIP structure preview */}
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 text-left leading-relaxed">
                📦 O-Book-Export.zip<br />
                &nbsp;&nbsp;📄 Transactions.xlsx<br />
                &nbsp;&nbsp;📁 Attachments/<br />
                &nbsp;&nbsp;&nbsp;&nbsp;📎 Transaction-xxxxx-invoice.pdf<br />
                &nbsp;&nbsp;&nbsp;&nbsp;📎 Transaction-yyyyy-receipt.jpg
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportZip}
              disabled={exportingZip}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportingZip ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Export ZIP
                </>
              )}
            </button>
          </div>

          {/* ── Failed-files warning (shown after export if any files failed) ── */}
          {!zipSuccess && zipFailedFiles.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
              <FileWarning className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Some attachments could not be downloaded</p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {zipFailedFiles.join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
