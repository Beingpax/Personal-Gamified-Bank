import { STORAGE_KEY } from './constants'
import { normalizeDailyLogs } from './dailyLogs'
import { isDateKey } from './format'
import type {
  AppState,
  DailyLog,
  MoneyTarget,
  RewardHistoryItem,
  RewardItem,
} from './types'

const STORAGE_SCHEMA_VERSION = 1

export function createInitialState(): AppState {
  return {
    spins: 0,
    spentSpinCount: 0,
    spentTargetIds: [],
    unlockedTargetIds: [],
    targets: [
      { id: crypto.randomUUID(), amount: 1000 },
      { id: crypto.randomUUID(), amount: 2000 },
      { id: crypto.randomUUID(), amount: 3000 },
    ],
    dailyLogs: [],
    rewards: [
      { id: crypto.randomUUID(), label: 'Buy one saved item' },
      { id: crypto.randomUUID(), label: 'Coffee outside' },
      { id: crypto.randomUUID(), label: 'Movie night' },
      { id: crypto.randomUUID(), label: 'Add to purchase fund' },
      { id: crypto.randomUUID(), label: 'Guilt-free tech accessory' },
    ],
    history: [],
  }
}

export function loadState(): AppState {
  const defaults = createInitialState()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults

    return decodeStoredState(JSON.parse(raw), defaults)
  } catch {
    return defaults
  }
}

export function decodeStoredState(
  value: unknown,
  defaults = createInitialState(),
): AppState {
  const source = unwrapStoredState(value)
  if (!source) return defaults

  return {
    ...defaults,
    targets: decodeArray(source.targets, defaults.targets, decodeTarget),
    dailyLogs: normalizeDailyLogs(
      decodeArray(source.dailyLogs, defaults.dailyLogs, decodeDailyLog),
    ),
    rewards: decodeArray(source.rewards, defaults.rewards, decodeReward),
    history: decodeArray(source.history, defaults.history, decodeHistoryItem),
    spins: readNonNegativeInteger(source.spins, defaults.spins),
    spentSpinCount: readNonNegativeInteger(
      source.spentSpinCount,
      defaults.spentSpinCount,
    ),
    spentTargetIds: decodeStringArray(
      source.spentTargetIds,
      defaults.spentTargetIds,
    ),
    unlockedTargetIds: decodeStringArray(
      source.unlockedTargetIds,
      defaults.unlockedTargetIds,
    ),
  }
}

function unwrapStoredState(value: unknown) {
  if (!isRecord(value)) return null

  if (value.schemaVersion === STORAGE_SCHEMA_VERSION && isRecord(value.state)) {
    return value.state
  }

  return value
}

function decodeArray<T>(
  value: unknown,
  fallback: T[],
  decodeItem: (item: unknown) => T | null,
) {
  if (!Array.isArray(value)) return fallback

  return value.flatMap((item) => {
    const decoded = decodeItem(item)
    return decoded ? [decoded] : []
  })
}

function decodeTarget(value: unknown): MoneyTarget | null {
  if (!isRecord(value)) return null

  const amount = readPositiveNumber(value.amount)
  if (amount == null) return null

  return {
    id: readId(value.id),
    amount,
    ...readSyncFields(value),
  }
}

function decodeDailyLog(value: unknown): DailyLog | null {
  if (!isRecord(value)) return null

  const date = readString(value.date)
  if (!isDateKey(date)) return null

  return {
    id: readId(value.id),
    date,
    amount: readNonNegativeNumber(value.amount, 0),
    updatedAt: readDateTime(value.updatedAt) ?? new Date().toISOString(),
    ...readSyncFields(value),
  }
}

function decodeReward(value: unknown): RewardItem | null {
  if (!isRecord(value)) return null

  const label = readString(value.label).trim()
  if (!label) return null

  return {
    id: readId(value.id),
    label,
    ...readSyncFields(value),
  }
}

function decodeHistoryItem(value: unknown): RewardHistoryItem | null {
  if (!isRecord(value)) return null

  const rewardLabel = readString(value.rewardLabel).trim()
  if (!rewardLabel) return null

  return {
    id: readId(value.id),
    targetId: readNullableId(value.targetId),
    rewardId: readId(value.rewardId),
    rewardLabel,
    createdAt: readDateTime(value.createdAt) ?? new Date().toISOString(),
    ...readSyncFields(value),
  }
}

function readSyncFields(value: Record<string, unknown>) {
  const createdAt = readDateTime(value.createdAt)
  const updatedAt = readDateTime(value.updatedAt)

  return {
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    deletedAt: readDeletedAt(value.deletedAt),
  }
}

function decodeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback

  return value.filter((item): item is string => readString(item).length > 0)
}

function readPositiveNumber(value: unknown) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

function readNonNegativeNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue >= 0
    ? numberValue
    : fallback
}

function readNonNegativeInteger(value: unknown, fallback: number) {
  return Math.floor(readNonNegativeNumber(value, fallback))
}

function readId(value: unknown) {
  const id = readString(value).trim()

  return id || crypto.randomUUID()
}

function readNullableId(value: unknown) {
  if (value == null) return null

  return readId(value)
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function readDateTime(value: unknown) {
  const dateTime = readString(value)

  return Number.isNaN(new Date(dateTime).getTime()) ? null : dateTime
}

function readDeletedAt(value: unknown) {
  return value == null ? null : readDateTime(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
