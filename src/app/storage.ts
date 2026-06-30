import { STORAGE_KEY } from './constants'
import { normalizeDailyLogs } from './dailyLogs'
import type { AppState } from './types'

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
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as AppState

    return {
      ...parsed,
      dailyLogs: normalizeDailyLogs(parsed.dailyLogs),
    }
  } catch {
    return createInitialState()
  }
}

export function persistState(state: AppState) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      dailyLogs: normalizeDailyLogs(state.dailyLogs),
    }),
  )
}
