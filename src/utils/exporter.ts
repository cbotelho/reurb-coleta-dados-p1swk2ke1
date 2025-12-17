import { Lote, Project, Quadra } from '@/types'
import { format } from 'date-fns'

export const exporter = {
  toCSV: (
    data: any[],
    filename: string = 'export.csv',
    columns?: { key: string; label: string }[],
  ) => {
    if (!data.length) return

    const headers = columns ? columns.map((c) => c.label) : Object.keys(data[0])
    const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0])

    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        keys
          .map((key) => {
            const val = key.split('.').reduce((o, k) => (o || {})[k], row)
            return `"${val === undefined || val === null ? '' : val}"`
          })
          .join(','),
      ),
    ].join('\n')

    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')
  },

  toExcel: (
    data: any[],
    filename: string = 'export.xls',
    columns?: { key: string; label: string }[],
  ) => {
    if (!data.length) return

    const headers = columns ? columns.map((c) => c.label) : Object.keys(data[0])
    const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0])

    const tableRows = data
      .map(
        (row) => `
      <tr>
        ${keys
          .map((key) => {
            const val = key.split('.').reduce((o, k) => (o || {})[k], row)
            return `<td>${val === undefined || val === null ? '' : val}</td>`
          })
          .join('')}
      </tr>
    `,
      )
      .join('')

    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
        <x:ExcelWorkbook>
        <x:ExcelWorksheets>
        <x:ExcelWorksheet>
        <x:Name>Sheet1</x:Name>
        <x:WorksheetOptions>
        <x:DisplayGridlines/>
        </x:WorksheetOptions>
        </x:ExcelWorksheet>
        </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `

    downloadFile(
      excelContent,
      filename,
      'application/vnd.ms-excel;charset=utf-8;',
    )
  },
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
