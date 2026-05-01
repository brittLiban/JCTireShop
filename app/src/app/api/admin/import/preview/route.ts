import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'Only .xlsx and .xls files are supported' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Parse as array of arrays (row 0 = headers)
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

    if (rawRows.length < 2) {
      return NextResponse.json(
        { error: 'File has no data rows — ensure the first row is headers and subsequent rows are data' },
        { status: 400 }
      )
    }

    const headers = (rawRows[0] as unknown[]).map((h) =>
      h !== null && h !== undefined && h !== '' ? String(h).trim() : ''
    )

    // Filter out completely empty rows
    const dataRows = (rawRows.slice(1) as unknown[][]).filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && cell !== '')
    )

    if (dataRows.length === 0) {
      return NextResponse.json({ error: 'No data rows found after the header row' }, { status: 400 })
    }

    // Convert to objects using headers as keys
    const toObject = (row: unknown[]) =>
      headers.reduce<Record<string, unknown>>((obj, header, i) => {
        obj[header] = row[i] ?? ''
        return obj
      }, {})

    const allRows = dataRows.map(toObject)
    const preview = allRows.slice(0, 10)

    return NextResponse.json({
      fileName: file.name,
      columns: headers.filter(Boolean),
      preview,
      totalRows: allRows.length,
      allRows,
    })
  } catch (err) {
    console.error('Import preview error:', err)
    return NextResponse.json(
      { error: 'Failed to parse file — ensure it is a valid Excel spreadsheet' },
      { status: 500 }
    )
  }
}
