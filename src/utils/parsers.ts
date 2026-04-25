import Papa from 'papaparse'
import { categorizeTransaction } from './categorizer'

export interface ImportedTransaction {
  date: string
  amount: number
  description: string
  type: 'income' | 'expense'
  category: string
  fitid?: string
  source_id?: string
  confidence?: 'high' | 'medium' | 'low'
  installment?: { current: number; total: number }
  isRecurring?: boolean
  senderDomain?: string  // domain of the Gmail sender — used to save email rules
  anomaly?: string       // non-null when transaction looks unusual vs user history
  raw?: any
}

export const parseCSV = (file: File): Promise<ImportedTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: ImportedTransaction[] = results.data
            .map((row: any) => {
              const amount = parseFloat(
                String(row.Amount || row.Valor || row.amount || row.valor || row.Quantia || '0')
                  .replace(/[R$\s]/g, '')
                  .replace(/\./g, '')
                  .replace(',', '.')
              )

              if (isNaN(amount) || amount === 0) return null

              const dateRaw = row.Date || row.Data || row.date || row.data || row['Data Transação'] || row['Data Transacao'] || ''
              let date: string
              try {
                // Handle DD/MM/YYYY format (common in Brazilian exports)
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateRaw)) {
                  const [d, mo, y] = dateRaw.split('/')
                  date = new Date(`${y}-${mo}-${d}`).toISOString()
                } else {
                  date = new Date(dateRaw).toISOString()
                }
              } catch {
                date = new Date().toISOString()
              }

              const description = (
                row.Description || row.Descricao || row.Descrição || row.Memo ||
                row.historico || row.Historico || row.Histórico || row.memo ||
                'Sem descrição'
              ).trim()

              const type: 'income' | 'expense' = amount < 0 ? 'expense' : 'income'
              const category = categorizeTransaction(description, type)

              return {
                date,
                amount: Math.abs(amount),
                description,
                type,
                category,
                raw: row,
              }
            })
            .filter(Boolean) as ImportedTransaction[]

          resolve(transactions)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export const parseOFX = async (file: File): Promise<ImportedTransaction[]> => {
  const text = await file.text()
  const transactions: ImportedTransaction[] = []

  // More robust OFX regex - captures FITID, NAME, and MEMO (all optional except TRNAMT and DTPOSTED)
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g

  let block: RegExpExecArray | null
  while ((block = stmtTrnRegex.exec(text)) !== null) {
    const content = block[1]

    const getValue = (tag: string): string | null => {
      // OFX can use <TAG>value or <TAG>value</TAG>
      const match = content.match(new RegExp(`<${tag}>([^<\\r\\n]+)`))
      return match ? match[1].trim() : null
    }

    const amountRaw = getValue('TRNAMT')
    const dateRaw = getValue('DTPOSTED')

    if (!amountRaw || !dateRaw) continue

    const amount = parseFloat(amountRaw)
    if (isNaN(amount)) continue

    // OFX date: YYYYMMDD or YYYYMMDDHHMMSS or YYYYMMDDHHMMSS[timezone]
    const year = dateRaw.substring(0, 4)
    const month = dateRaw.substring(4, 6)
    const day = dateRaw.substring(6, 8)
    let date: string
    try {
      date = new Date(`${year}-${month}-${day}`).toISOString()
    } catch {
      date = new Date().toISOString()
    }

    const name = getValue('NAME') || ''
    const memo = getValue('MEMO') || ''
    const fitid = getValue('FITID') || undefined

    // Use NAME + MEMO for richer description
    const description = [name, memo].filter(Boolean).join(' - ') || 'Sem descrição'

    const type: 'income' | 'expense' = amount < 0 ? 'expense' : 'income'
    const category = categorizeTransaction(description, type)

    transactions.push({
      date,
      amount: Math.abs(amount),
      description,
      type,
      category,
      fitid,
      raw: block[0],
    })
  }

  return transactions
}

export const parseXLSX = async (file: File): Promise<ImportedTransaction[]> => {
  const { read, utils } = await import('xlsx')

  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { type: 'array' })

  // Use the first sheet
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('Planilha vazia')

  const sheet = workbook.Sheets[sheetName]
  const rows: any[] = utils.sheet_to_json(sheet)

  if (rows.length === 0) throw new Error('Nenhuma linha encontrada na planilha')

  const transactions: ImportedTransaction[] = rows
    .map((row) => {
      // Try common column names (pt-BR and en)
      const amountRaw = row.Amount || row.Valor || row.amount || row.valor || row.Quantia
      const amount = parseFloat(
        String(amountRaw || '0')
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      )

      if (isNaN(amount) || amount === 0) return null

      const dateRaw = row.Date || row.Data || row.date || row.data || row['Data Transação'] || row['Data Transacao'] || ''
      let date: string
      try {
        if (typeof dateRaw === 'number') {
          // Excel serial date number
          const excelEpoch = new Date(1899, 11, 30)
          const d = new Date(excelEpoch.getTime() + dateRaw * 86400000)
          date = d.toISOString()
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(dateRaw))) {
          const [d, mo, y] = String(dateRaw).split('/')
          date = new Date(`${y}-${mo}-${d}`).toISOString()
        } else {
          date = new Date(dateRaw).toISOString()
        }
      } catch {
        date = new Date().toISOString()
      }

      const description = (
        row.Description || row.Descricao || row.Descrição || row.Memo ||
        row.historico || row.Historico || row.Histórico ||
        'Sem descrição'
      ).toString().trim()

      const type: 'income' | 'expense' = amount < 0 ? 'expense' : 'income'
      const category = categorizeTransaction(description, type)

      return {
        date,
        amount: Math.abs(amount),
        description,
        type,
        category,
        raw: row,
      }
    })
    .filter(Boolean) as ImportedTransaction[]

  return transactions
}
