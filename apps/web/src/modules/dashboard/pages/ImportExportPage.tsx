'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react'
import { parseExcelFile, type ParsedImportRow } from '../utils/excel-import.parser'
import { getAuthUser } from '@/lib/auth-store'
import { formatCurrencyAmount, SupportedCurrency } from '../constants/currency'
import { TransactionFilters, type SortOption } from '../components/TransactionFilters'

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
  createdBy: { id?: string; name: string } | null
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

  // Attachment export state
  const [attachmentExportMode, setAttachmentExportMode] = useState<'zip' | 'images'>('zip')
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string | null>(null)
  const [failedFiles, setFailedFiles] = useState<string[]>([])
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null)

  // Export Filter & Sort State
  const [exportTransactions, setExportTransactions] = useState<TransactionWithAttachments[]>([])
  const [exportUsers, setExportUsers] = useState<{ id: string; name: string }[]>([])
  const [loadingExportData, setLoadingExportData] = useState(false)

  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('AED')
  const [selectedDateRange, setSelectedDateRange] = useState<'all-time' | 'today' | 'week' | 'last-30-days' | 'custom'>('all-time')
  const [selectedType, setSelectedType] = useState<'all' | 'cash-in' | 'cash-out'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedSort, setSelectedSort] = useState<SortOption>('date-desc')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Fetch transactions and users for export filtering
  const loadExportData = useCallback(async () => {
    setLoadingExportData(true)
    try {
      const [txRes, userRes] = await Promise.all([
        fetch('/api/v1/transactions'),
        fetch('/api/v1/users'),
      ])
      const txData = await txRes.json()
      const userData = await userRes.json()

      let fetchedTxs: TransactionWithAttachments[] = []
      if (txData.success && Array.isArray(txData.data)) {
        fetchedTxs = txData.data
        setExportTransactions(fetchedTxs)
        const currencyList = fetchedTxs
          .map((tx: TransactionWithAttachments) => tx.currency?.trim().toUpperCase())
          .filter(Boolean)
        const availableCurrencies = new Set(currencyList)

        const currentCurrUpper = selectedCurrency.trim().toUpperCase()
        if (!availableCurrencies.has(currentCurrUpper) && availableCurrencies.size > 0) {
          const firstAvailable = Array.from(availableCurrencies)[0] as SupportedCurrency
          setSelectedCurrency(firstAvailable)
        }
      }
      if (userData.success && Array.isArray(userData.data)) {
        setExportUsers(userData.data)
      }
      return fetchedTxs
    } catch (err) {
      console.error('Failed to load transactions for export filtering:', err)
      return []
    } finally {
      setLoadingExportData(false)
    }
  }, [selectedCurrency])

  useEffect(() => {
    loadExportData()
  }, [loadExportData])

  // Categories extracted from transactions
  const exportCategories = useMemo(() => {
    const set = new Set(exportTransactions.map((tx) => tx.category?.name).filter(Boolean))
    return Array.from(set) as string[]
  }, [exportTransactions])

  // Filtered and Sorted transactions calculation
  const filteredAndSortedTransactions = useMemo(() => {
    // 1. Currency filter: strictly filter to transactions matching selected currency (case-insensitive & trimmed)
    const currTarget = selectedCurrency ? selectedCurrency.trim().toUpperCase() : ''
    let list = currTarget
      ? exportTransactions.filter((tx) => (tx.currency || 'AED').trim().toUpperCase() === currTarget)
      : [...exportTransactions]

    // 2. Sort currency-filtered transactions chronologically (oldest to newest) to calculate accurate running balance
    // Reversing list first ensures baseline order is Oldest-to-Newest before sorting
    const oldestFirst = [...list].reverse().sort((a, b) => {
      const timeA = new Date(a.date).getTime()
      const timeB = new Date(b.date).getTime()
      if (timeA !== timeB) return timeA - timeB
      const createdA = ((a as any).createdAt ? new Date((a as any).createdAt) : new Date(a.date)).getTime()
      const createdB = ((b as any).createdAt ? new Date((b as any).createdAt) : new Date(b.date)).getTime()
      return createdA - createdB
    })

    let runningBalance = 0
    const balanceMap = new Map<string, number>()
    oldestFirst.forEach((tx) => {
      const signedAmount = tx.type === 'CASH_IN' ? Number(tx.amount) : -Number(tx.amount)
      runningBalance += signedAmount
      balanceMap.set(tx.id, runningBalance)
    })

    // Attach calculated currency-isolated balance to each transaction
    list = list.map((tx) => ({
      ...tx,
      balance: balanceMap.get(tx.id) ?? tx.balance,
    }))

    // 3. Type filter
    if (selectedType === 'cash-in') {
      list = list.filter((tx) => tx.type === 'CASH_IN')
    } else if (selectedType === 'cash-out') {
      list = list.filter((tx) => tx.type === 'CASH_OUT')
    }

    // 4. Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((tx) => tx.category?.name === selectedCategory)
    }

    // 5. User filter
    if (selectedUser !== 'all') {
      list = list.filter((tx) => tx.createdBy?.id === selectedUser || tx.createdBy?.name === selectedUser)
    }

    // 6. Date Range filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (selectedDateRange === 'today') {
      list = list.filter((tx) => new Date(tx.date) >= today)
    } else if (selectedDateRange === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      list = list.filter((tx) => new Date(tx.date) >= weekAgo)
    } else if (selectedDateRange === 'last-30-days') {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      list = list.filter((tx) => new Date(tx.date) >= thirtyDaysAgo)
    } else if (selectedDateRange === 'custom') {
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        list = list.filter((tx) => new Date(tx.date) >= start)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        list = list.filter((tx) => new Date(tx.date) <= end)
      }
    }

    // 7. Sorting
    list.sort((a, b) => {
      if (selectedSort === 'date-desc') {
        const timeA = new Date(a.date).getTime()
        const timeB = new Date(b.date).getTime()
        if (timeA !== timeB) return timeB - timeA
        const createdA = ((a as any).createdAt ? new Date((a as any).createdAt) : new Date(a.date)).getTime()
        const createdB = ((b as any).createdAt ? new Date((b as any).createdAt) : new Date(b.date)).getTime()
        return createdB - createdA
      }
      if (selectedSort === 'date-asc') {
        const timeA = new Date(a.date).getTime()
        const timeB = new Date(b.date).getTime()
        if (timeA !== timeB) return timeA - timeB
        const createdA = ((a as any).createdAt ? new Date((a as any).createdAt) : new Date(a.date)).getTime()
        const createdB = ((b as any).createdAt ? new Date((b as any).createdAt) : new Date(b.date)).getTime()
        return createdA - createdB
      }
      if (selectedSort === 'amount-desc') {
        return b.amount - a.amount
      }
      if (selectedSort === 'amount-asc') {
        return a.amount - b.amount
      }
      return 0
    })

    return list
  }, [exportTransactions, selectedCurrency, selectedType, selectedCategory, selectedUser, selectedDateRange, startDate, endDate, selectedSort])

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

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Balance', 'Status', 'Entered By']
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

    // Set column widths
    worksheet.getColumn(1).width = 15
    worksheet.getColumn(2).width = 35
    worksheet.getColumn(3).width = 20
    worksheet.getColumn(4).width = 18
    worksheet.getColumn(5).width = 18
    worksheet.getColumn(6).width = 15
    worksheet.getColumn(7).width = 20
    if (withAttachmentCol) {
      worksheet.getColumn(8).width = 30
    }

    transactions.forEach((tx) => {
      const dateStr = new Date(tx.date).toLocaleDateString()
      const descStr = tx.description || '-'
      const signedAmount = tx.type === 'CASH_IN' ? tx.amount : -tx.amount
      const amountStr = `${formatCurrencyAmount(signedAmount, tx.currency, { showSign: true })}\n${tx.currency}`
      const balanceStr = formatCurrencyAmount(tx.balance, tx.currency, { showSign: true })
      const enteredByStr = tx.createdBy?.name || 'User'

      const rowData: (string | number)[] = [
        dateStr,
        descStr,
        tx.category?.name || 'General',
        amountStr,
        balanceStr,
        'Approved',
        enteredByStr,
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
      if (exportTransactions.length === 0) {
        await loadExportData()
      }
      const transactions = filteredAndSortedTransactions
      if (transactions.length === 0) {
        alert('No transactions match the current filter criteria.')
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
  // Option 1: ZIP + Excel Export
  // ---------------------------------------------------------------------------

  const handleExportZip = async () => {
    if (exportTransactions.length === 0) {
      await loadExportData()
    }
    const transactions = filteredAndSortedTransactions
    if (transactions.length === 0) {
      alert('No transactions match the current filter criteria.')
      return
    }

    setExporting(true)
    setExportProgress('Preparing transactions…')
    setFailedFiles([])
    setExportSuccessMessage(null)

    try {

      type AttachmentJob = {
        txId: string
        txShortId: string
        originalFileName: string
        url: string
        zipName: string
      }

      const usedNames = new Map<string, number>()
      const jobs: AttachmentJob[] = []
      transactions.forEach((tx) => {
        const shortId = tx.id.slice(-5)
        ;(tx.attachments || []).forEach((att) => {
          const safe = att.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
          const base = `Transaction-${shortId}-${safe}`

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

      const attachmentMap = new Map<string, string[]>()
      transactions.forEach((tx) => attachmentMap.set(tx.id, []))
      jobs.forEach((j) => attachmentMap.get(j.txId)!.push(j.zipName))

      setExportProgress('Building Excel…')
      const workbook = await buildWorkbook(transactions, true, attachmentMap)
      const xlsxBuffer = await workbook.xlsx.writeBuffer()

      const failedList: string[] = []
      const zipFiles: Record<string, Uint8Array> = {
        'Transactions.xlsx': new Uint8Array(xlsxBuffer as ArrayBuffer),
      }

      const total = jobs.length
      let done = 0

      for (const job of jobs) {
        done++
        setExportProgress(
          total > 0
            ? `Downloading attachment ${done} of ${total}: ${job.originalFileName}`
            : 'Building ZIP package…'
        )

        try {
          const fileRes = await fetch(job.url)
          if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status}`)
          const arrayBuf = await fileRes.arrayBuffer()
          zipFiles[`Attachments/${job.zipName}`] = new Uint8Array(arrayBuf)
        } catch (err) {
          console.warn(`Failed to download attachment "${job.originalFileName}":`, err)
          failedList.push(job.originalFileName)
        }
      }

      setExportProgress('Generating ZIP package…')
      const { zipSync } = await import('fflate')
      const zipped = zipSync(zipFiles, { level: 0 })

      const blob = new Blob([zipped], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `O-Book-Export_${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      URL.revokeObjectURL(url)

      setFailedFiles(failedList)
      setExportSuccessMessage(`O-Book-Export.zip downloaded (${transactions.length} filtered transactions)!`)
    } catch (err) {
      console.error('ZIP export error:', err)
      alert(err instanceof Error ? err.message : 'Failed to generate ZIP export.')
    } finally {
      setExporting(false)
      setExportProgress(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Option 2: Images in Excel Export
  // ---------------------------------------------------------------------------

  const handleExportImagesInExcel = async () => {
    if (exportTransactions.length === 0) {
      await loadExportData()
    }
    const transactions = filteredAndSortedTransactions
    if (transactions.length === 0) {
      alert('No transactions match the current filter criteria.')
      return
    }

    setExporting(true)
    setExportProgress('Preparing transactions…')
    setFailedFiles([])
    setExportSuccessMessage(null)

    try {

      const ExcelJS = (await import('exceljs')).default || (await import('exceljs'))
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Transactions')

      worksheet.addRow(['Transaction Report'])
      worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true }
      worksheet.addRow([`Exported on: ${new Date().toLocaleString()}`])
      worksheet.addRow([])

      const headers = ['Date', 'Description', 'Category', 'Amount', 'Balance', 'Status', 'Entered By', 'Attachments']
      const headerRow = worksheet.addRow(headers)
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11, bold: true }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        }
      })

      worksheet.getColumn(1).width = 15
      worksheet.getColumn(2).width = 35
      worksheet.getColumn(3).width = 20
      worksheet.getColumn(4).width = 18
      worksheet.getColumn(5).width = 18
      worksheet.getColumn(6).width = 15
      worksheet.getColumn(7).width = 20
      worksheet.getColumn(8).width = 35

      const failedList: string[] = []
      const IMAGE_REGEX = /\.(jpg|jpeg|png|webp|gif)$/i
      let currentRowIdx = 5

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i]
        const dateStr = new Date(tx.date).toLocaleDateString()
        const descStr = tx.description || '-'
        const signedAmount = tx.type === 'CASH_IN' ? tx.amount : -tx.amount
        const amountStr = `${formatCurrencyAmount(signedAmount, tx.currency, { showSign: true })}\n${tx.currency}`
        const balanceStr = formatCurrencyAmount(tx.balance, tx.currency, { showSign: true })
        const enteredByStr = tx.createdBy?.name || 'User'

        const attachmentTexts: string[] = []
        let hasImage = false

        if (tx.attachments && tx.attachments.length > 0) {
          let imgColOffset = 0
          for (const att of tx.attachments) {
            attachmentTexts.push(att.fileName)
            const isImage = IMAGE_REGEX.test(att.fileName) || (att.mimeType && att.mimeType.startsWith('image/'))

            if (isImage) {
              hasImage = true
              setExportProgress(`Fetching image ${i + 1}/${transactions.length}: ${att.fileName}`)
              try {
                const fileRes = await fetch(att.filePath)
                if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status}`)
                const arrayBuf = await fileRes.arrayBuffer()
                const ext = (att.fileName.split('.').pop() || 'png').toLowerCase()
                const validExt = ['jpeg', 'jpg'].includes(ext) ? 'jpeg' : 'png'

                const imageId = workbook.addImage({
                  buffer: Buffer.from(arrayBuf) as any,
                  extension: validExt as any,
                })

                worksheet.addImage(imageId, {
                  tl: { col: 7 + imgColOffset * 0.4, row: currentRowIdx - 1 },
                  ext: { width: 100, height: 50 },
                  editAs: 'oneCell',
                })
                imgColOffset++
              } catch (err) {
                console.warn(`Failed to download image attachment ${att.fileName}:`, err)
                failedList.push(att.fileName)
              }
            }
          }
        }

        const rowData = [
          dateStr,
          descStr,
          tx.category?.name || 'General',
          amountStr,
          balanceStr,
          'Approved',
          enteredByStr,
          attachmentTexts.join(', '),
        ]

        const row = worksheet.addRow(rowData)
        if (hasImage) {
          row.height = 60
        }
        currentRowIdx++
      }

      setExportProgress('Building Excel spreadsheet…')
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `O-Book-Export_${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      URL.revokeObjectURL(url)

      setFailedFiles(failedList)
      setExportSuccessMessage('O-Book-Export.xlsx downloaded successfully with embedded images!')
    } catch (err) {
      console.error('Images in Excel export error:', err)
      alert(err instanceof Error ? err.message : 'Failed to export Excel file.')
    } finally {
      setExporting(false)
      setExportProgress(null)
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
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Filter & Sort Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Filter &amp; Sort Export Data
              </h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {loadingExportData ? (
                  <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin text-indigo-500" /> Loading data...</span>
                ) : (
                  `${filteredAndSortedTransactions.length} of ${exportTransactions.length} transaction${exportTransactions.length === 1 ? '' : 's'} matching`
                )}
              </span>
            </div>

            <TransactionFilters
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
              selectedDateRange={selectedDateRange}
              onDateRangeChange={setSelectedDateRange}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={exportCategories}
              users={exportUsers}
              selectedUser={selectedUser}
              onUserChange={setSelectedUser}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
            />
          </div>

          {/* ── Success banner after export ── */}
          {exportSuccessMessage && (
            <div className="flex items-start justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Export completed successfully!
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                    {exportSuccessMessage}
                  </p>
                  {failedFiles.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 font-medium">
                      ⚠️ Note: {failedFiles.length} attachment(s) could not be downloaded ({failedFiles.join(', ')}).
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExportSuccessMessage(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ── Progress indicator while exporting ── */}
          {exporting && exportProgress && (
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">{exportProgress}</p>
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
              disabled={exporting || loadingExportData}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </button>
          </div>

          {/* ── Attachment Export Section with Toggle ── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Attachment Export</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose how transaction attachments should be packaged in your export.
                </p>
              </div>

              {/* Toggle control */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 shrink-0 self-start sm:self-auto border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAttachmentExportMode('zip')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    attachmentExportMode === 'zip'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Archive className="h-3.5 w-3.5" />
                  ZIP + Excel
                </button>
                <button
                  type="button"
                  onClick={() => setAttachmentExportMode('images')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    attachmentExportMode === 'images'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Images in Excel
                </button>
              </div>
            </div>

            {/* Selected mode details */}
            {attachmentExportMode === 'zip' && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-start gap-3">
                  <Archive className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      ZIP + Excel Package (<code className="text-xs">O-Book-Export.zip</code>)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Generates a downloadable ZIP containing the complete <code className="bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded">Transactions.xlsx</code> spreadsheet plus a dedicated <code className="bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded">Attachments/</code> folder with all actual attachment files (PDFs, receipts, bills, images).
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 px-3.5 py-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
                  📦 O-Book-Export.zip<br />
                  &nbsp;&nbsp;📄 Transactions.xlsx<br />
                  &nbsp;&nbsp;📁 Attachments/<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;📎 Transaction-abc12-invoice.pdf<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;📎 Transaction-xyz99-receipt.jpg
                </div>
              </div>
            )}

            {attachmentExportMode === 'images' && (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20 space-y-3">
                <div className="flex items-start gap-3">
                  <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Images in Excel Sheet (<code className="text-xs">O-Book-Export.xlsx</code>)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Generates a single <code className="bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded">.xlsx</code> spreadsheet with actual image files (JPG, PNG) visually embedded directly inside transaction rows. PDFs and non-image files are listed cleanly by filename.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900 border border-violet-100 dark:border-slate-800 px-3.5 py-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
                  📄 O-Book-Export.xlsx<br />
                  &nbsp;&nbsp;├── Transactions Data &amp; Formatting<br />
                  &nbsp;&nbsp;└── Attachments Column (JPG/PNG images embedded inline, PDFs referenced as text)
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={attachmentExportMode === 'zip' ? handleExportZip : handleExportImagesInExcel}
                disabled={exporting || loadingExportData}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Export…
                  </>
                ) : attachmentExportMode === 'zip' ? (
                  <>
                    <Archive className="h-4 w-4" />
                    Export ZIP + Excel
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export Images in Excel
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Failed files warning banner if any */}
          {failedFiles.length > 0 && !exporting && (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
              <FileWarning className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Some attachments failed to download</p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {failedFiles.join(', ')}
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
