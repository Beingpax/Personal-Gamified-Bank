import type { AppState, RewardHistoryItem, RewardItem } from './types'

const HISTORY_LIMIT = 60

export function spendSpin(current: AppState): AppState {
  if (current.spins <= 0) return current

  return {
    ...current,
    spins: current.spins - 1,
    spentSpinCount: current.spentSpinCount + 1,
    spentTargetIds: [
      ...current.spentTargetIds,
      getNextSpendableTargetId(current),
    ].filter((id): id is string => Boolean(id)),
  }
}

export function createRewardHistoryItem(
  reward: RewardItem,
): RewardHistoryItem {
  return {
    id: crypto.randomUUID(),
    rewardId: reward.id,
    rewardLabel: reward.label,
    createdAt: new Date().toISOString(),
  }
}

export function addRewardToHistory(
  current: AppState,
  reward: RewardHistoryItem,
): AppState {
  return {
    ...current,
    history: [reward, ...current.history].slice(0, HISTORY_LIMIT),
  }
}

function getNextSpendableTargetId(current: AppState) {
  const spentTargetIds = new Set(current.spentTargetIds)

  return [...current.targets]
    .filter(
      (target) =>
        current.unlockedTargetIds.includes(target.id) &&
        !spentTargetIds.has(target.id),
    )
    .sort((a, b) => a.amount - b.amount)[0]?.id
}
