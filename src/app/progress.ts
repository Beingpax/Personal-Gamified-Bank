import type { DailyLog } from './types'

export function totalEarned(dailyLogs: DailyLog[]) {
  return dailyLogs.reduce((total, entry) => total + entry.amount, 0)
}
