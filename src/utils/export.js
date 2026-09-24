export function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        let val = obj[header]
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val)
        }
        val = String(val ?? '').replace(/"/g, '""')
        return `"${val}"`
      })
      .join(',')
  )
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(data, filename = 'export.json') {
  const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2))
  const link = document.createElement('a')
  link.setAttribute('href', jsonString)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

