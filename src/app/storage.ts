import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from './constants'
import { normalizeDailyLogs } from './dailyLogs'
import type { AppState } from './types'

export function createInitialState(): AppState {
  return {
    spins: 0,
    spentSpinCount: 0,
    spentTargetIds: [],
    pendingRewardRemovalIds: [],
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
    const raw = getStoredState()
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    const fallback = createInitialState()
    const pendingRewardRemovalIds = parsed.pendingRewardRemovalIds ?? []
    const rewards = (parsed.rewards ?? fallback.rewards).filter(
      (reward: { id: string }) => !pendingRewardRemovalIds.includes(reward.id),
    )

    return {
      ...fallback,
      ...parsed,
      dailyLogs: normalizeDailyLogs(parsed.dailyLogs ?? []),
      rewards,
      pendingRewardRemovalIds: [],
      spentSpinCount:
        typeof parsed.spentSpinCount === 'number' &&
        Number.isFinite(parsed.spentSpinCount)
          ? Math.max(0, parsed.spentSpinCount)
          : Math.max(
              0,
              (parsed.unlockedTargetIds?.length ?? 0) - (parsed.spins ?? 0),
            ),
      spentTargetIds: parsed.spentTargetIds ?? [],
      unlockedTargetIds: parsed.unlockedTargetIds ?? [],
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

function getStoredState() {
  const current = window.localStorage.getItem(STORAGE_KEY)
  if (current) return current

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = window.localStorage.getItem(key)
    if (legacy) return legacy
  }

  return null
}
