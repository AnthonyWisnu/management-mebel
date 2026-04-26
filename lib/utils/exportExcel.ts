import * as XLSX from "xlsx"

export interface ExcelColumn<T> {
  header: string
  key: keyof T
  width?: number
  formatter?: (value: unknown) => string
}

export function exportToExcel<T extends object>(
  data: T[],
  columns: ExcelColumn<T>[],
  filename: string,
  sheetName = "Laporan"
): void {
  const header = columns.map((c) => c.header)
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key]
      return col.formatter ? col.formatter(value) : (value ?? "")
    })
  )

  const wsData = [header, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? 20 }))

  // Bold header row
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1")
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c })
    if (ws[cellAddr]) {
      ws[cellAddr].s = { font: { bold: true } }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
