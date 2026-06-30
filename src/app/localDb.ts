import Dexie, { type Table } from 'dexie'
import { STORAGE_KEY } from './constants'
import { loadState } from './storage'
import type {
  AppState,
  DailyLog,
  MoneyTarget,
  RewardHistoryItem,
  RewardItem,
} from './types'

export type SyncTable = 'targets' | 'dailyLogs' | 'rewards' | 'spinClaims'
export type SyncAction = 'upsert' | 'delete'

export type PendingChange = {
  id: string
  table: SyncTable
  action: SyncAction
  recordId: string
  payload: unknown
  createdAt: string
}

export type LocalMeta = {
  key: string
  value: string
}

export type LocalTarget = Required<
  Pick<MoneyTarget, 'id' | 'amount' | 'createdAt' | 'updatedAt'>
> & {
  deletedAt: string | null
}

export type LocalDailyLog = Required<
  Pick<DailyLog, 'id' | 'date' | 'amount' | 'createdAt' | 'updatedAt'>
> & {
  deletedAt: string | null
}

export type LocalReward = Required<
  Pick<RewardItem, 'id' | 'label' | 'createdAt' | 'updatedAt'>
> & {
  deletedAt: string | null
}

export type LocalSpinClaim = Required<
  Pick<
    RewardHistoryItem,
    'id' | 'rewardId' | 'rewardLabel' | 'createdAt' | 'updatedAt'
  >
> & {
  targetId: string | null
  deletedAt: string | null
}

class PersonalBankDb extends Dexie {
  targets!: Table<LocalTarget, string>
  dailyLogs!: Table<LocalDailyLog, string>
  rewards!: Table<LocalReward, string>
  spinClaims!: Table<LocalSpinClaim, string>
  pendingChanges!: Table<PendingChange, string>
  meta!: Table<LocalMeta, string>

  constructor() {
    super('personal-bank-local')

    this.version(1).stores({
      targets: 'id, updatedAt, deletedAt',
      dailyLogs: 'id, date, updatedAt, deletedAt',
      rewards: 'id, updatedAt, deletedAt',
      spinClaims: 'id, targetId, rewardId, createdAt, updatedAt, deletedAt',
      pendingChanges: 'id, table, recordId, createdAt',
      meta: 'key',
    })
  }
}

export const db = new PersonalBankDb()

export async function initializeLocalData() {
  const initialized = await db.meta.get('initialized')
  if (initialized) return

  const hasLegacyState = Boolean(window.localStorage.getItem(STORAGE_KEY))
  const initialState = hasLegacyState ? loadState() : createDefaultLocalState()

  await importAppState(initialState, { queueUpload: hasLegacyState })
  await db.meta.put({ key: 'initialized', value: nowIso() })
}

export async function importAppState(
  state: AppState,
  { queueUpload }: { queueUpload: boolean },
) {
  const targets = state.targets.map(toLocalTarget)
  const dailyLogs = state.dailyLogs.map(toLocalDailyLog)
  const rewards = state.rewards.map(toLocalReward)
  const spinClaims = state.history.map(toLocalSpinClaim)

  await db.transaction(
    'rw',
    db.targets,
    db.dailyLogs,
    db.rewards,
    db.spinClaims,
    db.pendingChanges,
    async () => {
      await db.targets.bulkPut(targets)
      await db.dailyLogs.bulkPut(dailyLogs)
      await db.rewards.bulkPut(rewards)
      await db.spinClaims.bulkPut(spinClaims)

      if (!queueUpload) return

      await Promise.all([
        ...targets.map((record) => enqueueChange('targets', 'upsert', record)),
        ...dailyLogs.map((record) =>
          enqueueChange('dailyLogs', 'upsert', record),
        ),
        ...rewards.map((record) => enqueueChange('rewards', 'upsert', record)),
        ...spinClaims.map((record) =>
          enqueueChange('spinClaims', 'upsert', record),
        ),
      ])
    },
  )
}

export async function getLocalAppState(): Promise<AppState> {
  const [targets, dailyLogs, rewards, spinClaims] = await Promise.all([
    db.targets.toArray(),
    db.dailyLogs.toArray(),
    db.rewards.toArray(),
    db.spinClaims.toArray(),
  ])

  return {
    targets: targets
      .filter(isVisible)
      .map(({ id, amount, createdAt, updatedAt, deletedAt }) => ({
        id,
        amount,
        createdAt,
        updatedAt,
        deletedAt,
      })),
    dailyLogs: dailyLogs
      .filter(isVisible)
      .map(({ id, date, amount, createdAt, updatedAt, deletedAt }) => ({
        id,
        date,
        amount,
        createdAt,
        updatedAt,
        deletedAt,
      })),
    rewards: rewards
      .filter(isVisible)
      .map(({ id, label, createdAt, updatedAt, deletedAt }) => ({
        id,
        label,
        createdAt,
        updatedAt,
        deletedAt,
      })),
    history: spinClaims
      .filter(isVisible)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .slice(0, 60)
      .map(
        ({
          id,
          targetId,
          rewardId,
          rewardLabel,
          createdAt,
          updatedAt,
          deletedAt,
        }) => ({
          id,
          targetId,
          rewardId,
          rewardLabel,
          createdAt,
          updatedAt,
          deletedAt,
        }),
      ),
    spins: 0,
    spentSpinCount: 0,
    spentTargetIds: spinClaims
      .filter(isVisible)
      .map((claim) => claim.targetId)
      .filter((id): id is string => Boolean(id)),
    unlockedTargetIds: [],
  }
}

export async function putTarget(record: MoneyTarget) {
  const localRecord = toLocalTarget(record)

  await db.targets.put(localRecord)
  await enqueueChange('targets', 'upsert', localRecord)
}

export async function putDailyLog(record: DailyLog) {
  const localRecord = toLocalDailyLog(record)

  await db.dailyLogs.put(localRecord)
  await enqueueChange('dailyLogs', 'upsert', localRecord)
}

export async function putReward(record: RewardItem) {
  const localRecord = toLocalReward(record)

  await db.rewards.put(localRecord)
  await enqueueChange('rewards', 'upsert', localRecord)
}

export async function putSpinClaim(record: RewardHistoryItem) {
  const localRecord = toLocalSpinClaim(record)

  await db.spinClaims.put(localRecord)
  await enqueueChange('spinClaims', 'upsert', localRecord)
}

export async function softDeleteRecord(table: SyncTable, recordId: string) {
  const deletedAt = nowIso()
  const payload = { id: recordId, updatedAt: deletedAt, deletedAt }

  if (table === 'targets') {
    await db.targets.update(recordId, payload)
  } else if (table === 'dailyLogs') {
    await db.dailyLogs.update(recordId, payload)
  } else if (table === 'rewards') {
    await db.rewards.update(recordId, payload)
  } else {
    await db.spinClaims.update(recordId, payload)
  }

  await enqueueChange(table, 'delete', payload)
}

export async function getPendingChangeCount() {
  return db.pendingChanges.count()
}

export async function enqueueChange<T extends { id: string }>(
  table: SyncTable,
  action: SyncAction,
  payload: T,
) {
  await db.pendingChanges.put({
    id: crypto.randomUUID(),
    table,
    action,
    recordId: payload.id,
    payload,
    createdAt: nowIso(),
  })
}

export function nowIso() {
  return new Date().toISOString()
}

function toLocalTarget(target: MoneyTarget): LocalTarget {
  const timestamp = target.updatedAt ?? target.createdAt ?? nowIso()

  return {
    id: target.id,
    amount: Math.max(1, Number(target.amount) || 0),
    createdAt: target.createdAt ?? timestamp,
    updatedAt: target.updatedAt ?? timestamp,
    deletedAt: target.deletedAt ?? null,
  }
}

function toLocalDailyLog(log: DailyLog): LocalDailyLog {
  const timestamp = log.updatedAt ?? log.createdAt ?? nowIso()

  return {
    id: log.id,
    date: log.date,
    amount: Math.max(0, Number(log.amount) || 0),
    createdAt: log.createdAt ?? timestamp,
    updatedAt: log.updatedAt ?? timestamp,
    deletedAt: log.deletedAt ?? null,
  }
}

function toLocalReward(reward: RewardItem): LocalReward {
  const timestamp = reward.updatedAt ?? reward.createdAt ?? nowIso()

  return {
    id: reward.id,
    label: reward.label,
    createdAt: reward.createdAt ?? timestamp,
    updatedAt: reward.updatedAt ?? timestamp,
    deletedAt: reward.deletedAt ?? null,
  }
}

function toLocalSpinClaim(claim: RewardHistoryItem): LocalSpinClaim {
  const timestamp = claim.updatedAt ?? claim.createdAt ?? nowIso()

  return {
    id: claim.id,
    targetId: claim.targetId ?? null,
    rewardId: claim.rewardId,
    rewardLabel: claim.rewardLabel,
    createdAt: claim.createdAt,
    updatedAt: timestamp,
    deletedAt: claim.deletedAt ?? null,
  }
}

function isVisible(record: { deletedAt: string | null }) {
  return !record.deletedAt
}

function createDefaultLocalState(): AppState {
  const createdAt = nowIso()

  return {
    spins: 0,
    spentSpinCount: 0,
    spentTargetIds: [],
    unlockedTargetIds: [],
    targets: [
      { id: crypto.randomUUID(), amount: 1000, createdAt, updatedAt: createdAt },
      { id: crypto.randomUUID(), amount: 2000, createdAt, updatedAt: createdAt },
      { id: crypto.randomUUID(), amount: 3000, createdAt, updatedAt: createdAt },
    ],
    dailyLogs: [],
    rewards: [
      {
        id: crypto.randomUUID(),
        label: 'Buy one saved item',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: crypto.randomUUID(),
        label: 'Coffee outside',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: crypto.randomUUID(),
        label: 'Movie night',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: crypto.randomUUID(),
        label: 'Add to purchase fund',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: crypto.randomUUID(),
        label: 'Guilt-free tech accessory',
        createdAt,
        updatedAt: createdAt,
      },
    ],
    history: [],
  }
}
