export type Screen = 'targets' | 'wheel' | 'rewards'

export type MoneyTarget = {
  id: string
  amount: number
}

export type DailyLog = {
  id: string
  date: string
  amount: number
  updatedAt: string
}

export type RewardItem = {
  id: string
  label: string
}

export type RewardHistoryItem = {
  id: string
  rewardId: string
  rewardLabel: string
  createdAt: string
}

export type AppState = {
  targets: MoneyTarget[]
  dailyLogs: DailyLog[]
  rewards: RewardItem[]
  history: RewardHistoryItem[]
  spins: number
  spentSpinCount: number
  spentTargetIds: string[]
  unlockedTargetIds: string[]
}

export type Segment = {
  reward: RewardItem
  start: number
  end: number
  color: string
}
