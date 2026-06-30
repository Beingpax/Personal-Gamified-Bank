import { isDateKey } from './format'
import type { DailyLog } from './types'

export function normalizeDailyLogs(dailyLogs: DailyLog[]) {
  const logsByDate = new Map<string, DailyLog>()

  for (const log of dailyLogs) {
    if (!isDateKey(log.date)) continue

    const normalizedLog = {
      ...log,
      amount: Math.max(0, Number(log.amount) || 0),
      updatedAt: isValidDateTime(log.updatedAt)
        ? log.updatedAt
        : new Date().toISOString(),
    }
    const existingLog = logsByDate.get(log.date)

    if (
      !existingLog ||
      new Date(normalizedLog.updatedAt).getTime() >=
        new Date(existingLog.updatedAt).getTime()
    ) {
      logsByDate.set(log.date, normalizedLog)
    }
  }

  return [...logsByDate.values()]
}

export function upsertDailyLog(
  currentDailyLogs: DailyLog[],
  date: string,
  amount: number,
) {
  const normalizedLogs = normalizeDailyLogs(currentDailyLogs)
  const existingLog = normalizedLogs.find((log) => log.date === date)
  const updatedAt = new Date().toISOString()
  const safeAmount = Math.max(0, Number(amount) || 0)

  if (existingLog) {
    return normalizedLogs.map((log) =>
      log.date === date ? { ...log, amount: safeAmount, updatedAt } : log,
    )
  }

  return [
    {
      id: crypto.randomUUID(),
      date,
      amount: safeAmount,
      updatedAt,
    },
    ...normalizedLogs,
  ]
}

function isValidDateTime(value: string) {
  return !Number.isNaN(new Date(value).getTime())
}
