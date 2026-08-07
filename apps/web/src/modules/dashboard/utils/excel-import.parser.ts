import ExcelJS from 'exceljs'

export type ParsedImportRow = {
  id: string
  rowIndex: number
  description: string
  categoryName: string
  type: 'CASH_IN' | 'CASH_OUT'
  amount: number
  currency: string
  date: string
  createdByName?: string
  paymentMethodName?: string
  rawRow: Record<string, string>
}

/**
 * Extracts a clean string representation from any ExcelJS cell
 * (handles strings, numbers, formula objects { result: ... }, richText, etc.)
 */
function extractCellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return ''

  // 1. String text if available
  if (typeof cell.text === 'string' && cell.text.trim()) {
    return cell.text.trim()
  }

  const val = cell.value
  if (val === null || val === undefined) return ''

  // 2. Primitives
  if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') {
    return String(val).trim()
  }

  // 3. Date
  if (val instanceof Date) {
    return val.toISOString()
  }

  // 4. Formula object: { formula: '...', result: 500 }
  if (typeof val === 'object' && val !== null) {
    if ('result' in val && val.result !== undefined && val.result !== null) {
      if (typeof val.result === 'object' && 'error' in (val.result as any)) {
        return ''
      }
      return String(val.result).trim()
    }

    // 5. Rich text object
    if ('richText' in val && Array.isArray((val as any).richText)) {
      return (val as any).richText.map((rt: any) => rt.text || '').join('').trim()
    }

    // 6. Hyperlink object
    if ('text' in val && typeof (val as any).text === 'string') {
      return (val as any).text.trim()
    }
  }

  return String(val).trim()
}

/**
 * Auto-detects currency from text strings (cell value, header, row details)
 */
function detectCurrencyFromText(...sources: (string | undefined)[]): string | undefined {
  const combined = sources.filter(Boolean).join(' ')
  if (!combined) return undefined

  const upper = combined.toUpperCase()

  // 1. AED indicators (Arabic symbol 'د.إ', 'AED', 'DIRHAM', 'DHS')
  if (
    combined.includes('د.إ') ||
    upper.includes('AED') ||
    upper.includes('DIRHAM') ||
    upper.includes('DHS') ||
    /\bDH\b/i.test(combined)
  ) {
    return 'AED'
  }

  // 2. INR indicators ('₹', 'INR', 'RUPEE', 'RS')
  if (
    combined.includes('₹') ||
    upper.includes('INR') ||
    upper.includes('RUPEE') ||
    /\bRS\b/i.test(combined) ||
    /\bRS\./i.test(combined)
  ) {
    return 'INR'
  }

  // 3. USD indicators ('$', 'USD')
  if (combined.includes('$') || upper.includes('USD')) {
    return 'USD'
  }

  return undefined
}

/**
 * Parses raw text containing money string like "-₹1,200.00 INR" or "-0.50د.إ" or "+650.00"
 */
function parseAmountAndType(
  amountStr: string,
  rowTextFallback: string = '',
  headerCurrency?: string
): { amount: number; type: 'CASH_IN' | 'CASH_OUT'; currency: string } {
  const cleanStr = String(amountStr || '').replace(/\r?\n/g, ' ').trim()

  // Detect Currency
  let currency =
    detectCurrencyFromText(cleanStr, headerCurrency, rowTextFallback) || 'AED'

  // Extract sign (- vs +)
  const isNegative = cleanStr.includes('-') && !cleanStr.includes('+')

  // Clean numeric string: remove commas from numbers like 1,200.50 -> 1200.50
  const normalizedNumStr = cleanStr.replace(/,/g, '')
  const match = normalizedNumStr.match(/(\d+(?:\.\d+)?)/)
  const numericVal = match ? parseFloat(match[1]) : 0

  return {
    amount: Math.abs(numericVal),
    type: isNegative ? 'CASH_OUT' : 'CASH_IN',
    currency,
  }
}

/**
 * Parses multi-line "Description & User" cell content
 */
function parseDescriptionAndUserCell(cellText: string): { description: string; createdByName?: string; date?: string } {
  const lines = String(cellText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) {
    return { description: '' }
  }

  let createdByName: string | undefined = undefined
  let dateStr: string | undefined = undefined
  const descriptionLines: string[] = []

  for (const line of lines) {
    const addedByMatch = line.match(/^Added by\s+([^•\n]+)(?:•\s*([^\n]+))?/i)
    if (addedByMatch) {
      createdByName = addedByMatch[1]?.trim()
      const rawDatePart = addedByMatch[2]?.trim()
      if (rawDatePart) {
        const dateClean = rawDatePart.replace('•', ' ').trim()
        const parsed = new Date(dateClean)
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toISOString()
        }
      }
    } else {
      descriptionLines.push(line)
    }
  }

  return {
    description: descriptionLines.join('\n'),
    createdByName,
    date: dateStr,
  }
}

export async function parseExcelFile(file: File): Promise<ParsedImportRow[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()

  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = new TextDecoder().decode(arrayBuffer)
    const lines = text.split(/\r?\n/)
    const worksheet = workbook.addWorksheet('CSV_Data')
    lines.forEach((line) => {
      if (line.trim()) {
        const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim())
        worksheet.addRow(cells)
      }
    })
  } else {
    await workbook.xlsx.load(arrayBuffer as any)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('Excel sheet is empty')
  }

  // Column Index Maps
  let descColIdx = -1
  let categoryColIdx = -1
  let amountColIdx = -1
  let balanceColIdx = -1
  let typeColIdx = -1
  let dateColIdx = -1
  let userColIdx = -1
  let pmColIdx = -1
  let currencyColIdx = -1

  let headerRowIndex = -1
  let headerCurrency: string | undefined = undefined

  // 1. Identify Header Row & Column Indexes
  worksheet.eachRow((row, rowNumber) => {
    if (headerRowIndex !== -1) return

    const cellTexts: { text: string; colIdx: number }[] = []
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const text = extractCellText(cell).toLowerCase()
      if (text) cellTexts.push({ text, colIdx: colNumber })
    })

    const joined = cellTexts.map((c) => c.text).join(' ')
    if (joined.includes('description') || joined.includes('category') || joined.includes('amount')) {
      headerRowIndex = rowNumber

      cellTexts.forEach(({ text, colIdx }) => {
        // Detect Header Level Currency e.g. "Amount (AED)" or "Amount (INR)"
        const detectedHdrCurr = detectCurrencyFromText(text)
        if (detectedHdrCurr) headerCurrency = detectedHdrCurr

        // EXPLICIT Header Matching
        if (text.includes('balance')) {
          balanceColIdx = colIdx
        } else if (
          (text.includes('amount') || text.includes('value') || text.includes('total') || text.includes('price')) &&
          amountColIdx === -1
        ) {
          amountColIdx = colIdx
        } else if (text.includes('category') || text.includes('cat')) {
          categoryColIdx = colIdx
        } else if (text.includes('description') || text.includes('particulars') || text.includes('details')) {
          descColIdx = colIdx
        } else if (text.includes('type') || text.includes('kind') || text.includes('direction')) {
          typeColIdx = colIdx
        } else if (text.includes('date') || text.includes('time')) {
          dateColIdx = colIdx
        } else if (text.includes('user') || text.includes('added by') || text.includes('created by')) {
          userColIdx = colIdx
        } else if (text.includes('payment') || text.includes('method') || text.includes('mode')) {
          pmColIdx = colIdx
        } else if (text.includes('currency') || text.includes('curr')) {
          currencyColIdx = colIdx
        }
      })
    }
  })

  if (headerRowIndex === -1) {
    headerRowIndex = 1
  }

  // Fallback defaults if column header identification failed
  if (descColIdx === -1) descColIdx = 1
  if (categoryColIdx === -1) categoryColIdx = 2
  if (amountColIdx === -1) amountColIdx = 3 // Column 3 is ALWAYS Amount by default!

  const rows: ParsedImportRow[] = []

  // 2. Iterate Data Rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return // Skip header rows

    const descUserVal = extractCellText(row.getCell(descColIdx))
    const categoryVal = extractCellText(row.getCell(categoryColIdx))
    const amountVal = extractCellText(row.getCell(amountColIdx)) // EXCLUSIVELY gets Amount column, NOT Balance!

    const typeVal = typeColIdx !== -1 ? extractCellText(row.getCell(typeColIdx)) : ''
    const dateVal = dateColIdx !== -1 ? extractCellText(row.getCell(dateColIdx)) : ''
    const userVal = userColIdx !== -1 ? extractCellText(row.getCell(userColIdx)) : ''
    const pmVal = pmColIdx !== -1 ? extractCellText(row.getCell(pmColIdx)) : ''
    const currencyColVal = currencyColIdx !== -1 ? extractCellText(row.getCell(currencyColIdx)) : ''

    if (!descUserVal && !amountVal && !categoryVal) {
      return // Skip completely blank rows
    }

    const parsedDesc = parseDescriptionAndUserCell(descUserVal)

    // Detect currency from Amount cell, Currency column, header, or row text
    const rowCurrency =
      detectCurrencyFromText(currencyColVal, amountVal, headerCurrency, descUserVal) || 'AED'

    const parsedAmount = parseAmountAndType(amountVal, descUserVal, rowCurrency)

    let finalType = parsedAmount.type
    if (typeVal) {
      const tLower = typeVal.toLowerCase()
      if (tLower.includes('in') || tLower.includes('income') || tLower.includes('cash_in')) {
        finalType = 'CASH_IN'
      } else if (tLower.includes('out') || tLower.includes('expense') || tLower.includes('cash_out')) {
        finalType = 'CASH_OUT'
      }
    }

    let finalDate = parsedDesc.date || new Date().toISOString()
    if (dateVal) {
      const d = new Date(dateVal)
      if (!isNaN(d.getTime())) {
        finalDate = d.toISOString()
      }
    }

    const createdByName = userVal || parsedDesc.createdByName || undefined

    rows.push({
      id: `row-${rowNumber}-${Date.now()}`,
      rowIndex: rowNumber,
      description: parsedDesc.description || 'Imported Transaction',
      categoryName: categoryVal || 'General',
      type: finalType,
      amount: parsedAmount.amount,
      currency: rowCurrency,
      date: finalDate,
      createdByName,
      paymentMethodName: pmVal || undefined,
      rawRow: {
        descUserVal,
        categoryVal,
        amountVal,
      },
    })
  })

  return rows
}
