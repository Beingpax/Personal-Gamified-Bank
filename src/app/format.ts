export function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDay(value: string) {
  if (!isDateKey(value)) return 'Select a date'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${value}T00:00:00`))
}

export function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(`${value}T00:00:00`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function todayDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
