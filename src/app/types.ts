export type Screen = 'targets' | 'wheel' | 'rewards'

export type MoneyTarget = {
  id: string
  amount: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type DailyLog = {
  id: string
  date: string
  amount: number
  createdAt?: string
  updatedAt: string
  deletedAt?: string | null
}

export type RewardItem = {
  id: string
  label: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type RewardHistoryItem = {
  id: string
  targetId?: string | null
  rewardId: string
  rewardLabel: string
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
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

export type SyncStatus =
  | 'loading'
  | 'local'
  | 'offline'
  | 'syncing'
  | 'synced'
  | 'error'
