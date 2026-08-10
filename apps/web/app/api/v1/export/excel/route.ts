import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiKeyOrSession } from '@/lib/api-auth'
import ExcelJS from 'exceljs'
import * as fflate from 'fflate'
import * as CFB from 'cfb'

const DEFAULT_CASHBOOK_ID = 'default-cashbook'

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

/**
 * Creates an OLE10Native binary stream Buffer for a file,
 * which Windows Excel uses for embedded "Package" objects.
 */
function createOle10NativeBuffer(fileName: string, fileData: Uint8Array): Uint8Array {
  const enc = new TextEncoder()
  const nameBytes = enc.encode(fileName)
  const tempPathBytes = enc.encode(`C:\\Windows\\Temp\\${fileName}`)

  const innerSize =
    2 +
    (nameBytes.length + 1) +
    (tempPathBytes.length + 1) +
    4 +
    4 +
    (tempPathBytes.length + 1) +
    4 +
    fileData.length

  const totalBuffer = new Uint8Array(4 + innerSize)
  const view = new DataView(totalBuffer.buffer)

  let offset = 0
  view.setUint32(offset, innerSize, true)
  offset += 4

  // Type: 2 (File package)
  view.setUint16(offset, 2, true)
  offset += 2

  // Label / Filename
  totalBuffer.set(nameBytes, offset)
  offset += nameBytes.length
  totalBuffer[offset++] = 0 // null byte

  // Original path
  totalBuffer.set(tempPathBytes, offset)
  offset += tempPathBytes.length
  totalBuffer[offset++] = 0 // null byte

  // Flags (0x00030000 in little endian)
  view.setUint8(offset++, 0x00)
  view.setUint8(offset++, 0x00)
  view.setUint8(offset++, 0x03)
  view.setUint8(offset++, 0x00)

  // Temp path len
  view.setUint32(offset, tempPathBytes.length + 1, true)
  offset += 4

  // Temp path string
  totalBuffer.set(tempPathBytes, offset)
  offset += tempPathBytes.length
  totalBuffer[offset++] = 0 // null byte

  // File size
  view.setUint32(offset, fileData.length, true)
  offset += 4

  // Raw file bytes
  totalBuffer.set(fileData, offset)

  return totalBuffer
}

/**
 * Wraps an embedded file in an OLE2 CFB container expected by Excel oleObjectN.bin
 */
function createOleObjectCfb(fileName: string, fileData: Uint8Array): Uint8Array {
  const oleNativeData = createOle10NativeBuffer(fileName, fileData)

  const container = CFB.utils.cfb_new()
  CFB.utils.cfb_add(container, '\x01Ole10Native', oleNativeData)

  const output = CFB.write(container, { type: 'array' })
  return new Uint8Array(output)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKeyOrSession(request, 'transactions:read')
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, message: auth.error ?? 'Unauthorized' },
        { status: auth.status ?? 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cashbookId = searchParams.get('cashbookId') ?? DEFAULT_CASHBOOK_ID
    const withAttachments = searchParams.get('attachments') !== 'false'

    const transactions = await prisma.transaction.findMany({
      where: { cashbookId },
      include: {
        category: true,
        paymentMethod: true,
        createdBy: true,
        cashbook: true,
        attachments: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })

    let runningBalance = 0
    const withBalance = transactions.map((tx) => {
      const amount = Number(tx.amount)
      const signedAmount = tx.type === 'CASH_IN' ? amount : -amount
      runningBalance += signedAmount
      return {
        id: tx.id,
        type: tx.type,
        amount,
        signedAmount,
        balance: runningBalance,
        currency: tx.currency,
        description: tx.description,
        date: tx.date,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        createdBy: tx.createdBy,
        cashbook: tx.cashbook,
        attachments: tx.attachments,
      }
    })

    // Prepare Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Transactions')

    worksheet.addRow(['Transaction Report'])
    worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true }
    worksheet.addRow([`Exported on: ${new Date().toLocaleString()}`])
    worksheet.addRow([])

    const headers = ['Description & User', 'Category', 'Amount', 'Balance', 'Status']
    if (withAttachments) {
      headers.push('Attachments')
    }

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
    worksheet.getColumn(1).width = 35
    worksheet.getColumn(2).width = 20
    worksheet.getColumn(3).width = 18
    worksheet.getColumn(4).width = 18
    worksheet.getColumn(5).width = 15
    if (withAttachments) {
      worksheet.getColumn(6).width = 30
    }

    type NonImageOleJob = {
      rowIndex: number
      fileName: string
      fileData: Uint8Array
    }

    const nonImageJobs: NonImageOleJob[] = []

    // Fetch and embed attachments row by row
    let currentRowIdx = 5 // Row index in worksheet (1-indexed, starting after headers)

    for (const tx of withBalance) {
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

      const attachmentNames: string[] = []

      if (withAttachments && tx.attachments.length > 0) {
        for (const att of tx.attachments) {
          attachmentNames.push(att.fileName)
          try {
            // Download file from Supabase storage URL
            const res = await fetch(att.filePath)
            if (!res.ok) continue

            const arrayBuf = await res.arrayBuffer()
            const fileData = new Uint8Array(arrayBuf)
            const isImage =
              IMAGE_MIME_TYPES.has(att.mimeType.toLowerCase()) ||
              /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileName)

            if (isImage) {
              // Standard ExcelJS image insertion
              const imageExtension = (att.fileName.split('.').pop() || 'png').toLowerCase() as any
              const imageId = workbook.addImage({
                buffer: Buffer.from(fileData.buffer, fileData.byteOffset, fileData.byteLength) as any,
                extension: ['jpeg', 'jpg'].includes(imageExtension) ? 'jpeg' : 'png',
              })

              worksheet.addImage(imageId, {
                tl: { col: 5, row: currentRowIdx - 1 },
                ext: { width: 120, height: 60 },
                editAs: 'oneCell',
              })

              // Set row height to accommodate image preview nicely
              worksheet.getRow(currentRowIdx).height = 65
            } else {
              // Queue non-image attachment for OLE embedding
              nonImageJobs.push({
                rowIndex: currentRowIdx,
                fileName: att.fileName,
                fileData,
              })
            }
          } catch (err) {
            console.error(`Failed to process attachment ${att.fileName}:`, err)
          }
        }

        rowData.push(attachmentNames.join(', '))
      } else if (withAttachments) {
        rowData.push('')
      }

      worksheet.addRow(rowData)
      currentRowIdx++
    }

    // Build standard ExcelJS buffer
    const baseExcelBuffer = await workbook.xlsx.writeBuffer()

    // If no non-image OLE objects need to be embedded, return standard Excel buffer
    if (nonImageJobs.length === 0) {
      return new NextResponse(baseExcelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="O-Book-Export_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      })
    }

    // Unzip standard XLSX generated by ExcelJS and inject OLE parts
    const unzipped = fflate.unzipSync(new Uint8Array(baseExcelBuffer as ArrayBuffer)) as Record<string, Uint8Array>

    // 1. Add OLE binary objects into xl/embeddings/oleObjectN.bin
    const oleRels: { id: string; target: string }[] = []

    nonImageJobs.forEach((job, idx) => {
      const oleFileName = `oleObject${idx + 1}.bin`
      const cfbBuffer = createOleObjectCfb(job.fileName, job.fileData)

      unzipped[`xl/embeddings/${oleFileName}`] = cfbBuffer
      oleRels.push({
        id: `rIdOle${idx + 1}`,
        target: `../embeddings/${oleFileName}`,
      })
    })

    // 2. Add Content_Types entry for oleObject
    let contentTypesXml = new TextDecoder().decode(unzipped['[Content_Types].xml'])
    if (!contentTypesXml.includes('Extension="bin"')) {
      contentTypesXml = contentTypesXml.replace(
        '</Types>',
        '<Default Extension="bin" ContentType="application/vnd.openxmlformats-officedocument.oleObject"/><Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/></Types>'
      )
      unzipped['[Content_Types].xml'] = new TextEncoder().encode(contentTypesXml)
    }

    // 3. Add relationships to xl/worksheets/_rels/sheet1.xml.rels
    let sheetRelsPath = 'xl/worksheets/_rels/sheet1.xml.rels'
    let sheetRelsXml = unzipped[sheetRelsPath]
      ? new TextDecoder().decode(unzipped[sheetRelsPath])
      : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'

    oleRels.forEach((rel) => {
      const relTag = `<Relationship Id="${rel.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="${rel.target}"/>`
      sheetRelsXml = sheetRelsXml.replace('</Relationships>', `${relTag}</Relationships>`)
    })
    unzipped[sheetRelsPath] = new TextEncoder().encode(sheetRelsXml)

    // 4. Update xl/worksheets/sheet1.xml with <oleObjects> tag
    let sheetXml = new TextDecoder().decode(unzipped['xl/worksheets/sheet1.xml'])
    let oleObjectsXml = '<oleObjects>'

    nonImageJobs.forEach((job, idx) => {
      const relId = `rIdOle${idx + 1}`
      // Reference cell F + row
      const cellRef = `F${job.rowIndex}`
      oleObjectsXml += `<oleObject progId="Package" shapeId="0" r:id="${relId}" drawAspect="Icon" objectUpdateMode="Always" ref="${cellRef}"/>`
    })
    oleObjectsXml += '</oleObjects>'

    if (sheetXml.includes('</worksheet>')) {
      sheetXml = sheetXml.replace('</worksheet>', `${oleObjectsXml}</worksheet>`)
    }
    unzipped['xl/worksheets/sheet1.xml'] = new TextEncoder().encode(sheetXml)

    // Repack zipped XLSX
    const finalZipped = fflate.zipSync(unzipped, { level: 6 })

    return new NextResponse(finalZipped, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="O-Book-Export_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Excel Export error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate Excel export' },
      { status: 500 }
    )
  }
}
