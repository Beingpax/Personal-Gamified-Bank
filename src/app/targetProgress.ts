import { normalizeDailyLogs } from './dailyLogs'
import { totalEarned } from './progress'
import type { AppState, DailyLog, MoneyTarget } from './types'

export type TargetMilestoneStatus =
  | 'active'
  | 'completed'
  | 'locked'
  | 'reward-granted'

export type TargetMilestoneView = {
  target: MoneyTarget
  status: TargetMilestoneStatus
  progress: number
}

export function reconcileTargetProgress(
  current: AppState,
  dailyLogs = current.dailyLogs,
  targets = current.targets,
): AppState {
  const normalizedDailyLogs = normalizeDailyLogs(dailyLogs)
  const earnedTotal = totalEarned(normalizedDailyLogs)
  const unlockedTargetIds = targets
    .filter((target) => earnedTotal >= target.amount)
    .map((target) => target.id)
  const spentTargetIds = getExistingSpentTargetIds(current, targets)
  const spentSpinCount = Math.max(
    0,
    current.spentSpinCount,
    spentTargetIds.length,
  )

  return {
    ...current,
    dailyLogs: normalizedDailyLogs,
    targets,
    spins: Math.max(0, unlockedTargetIds.length - spentSpinCount),
    spentSpinCount,
    spentTargetIds,
    unlockedTargetIds,
  }
}

export function getTargetProgressSummary(
  dailyLogs: DailyLog[],
  targets: MoneyTarget[],
) {
  const earnedTotal = totalEarned(dailyLogs)
  const sortedTargets = [...targets].sort((a, b) => a.amount - b.amount)
  const nextTarget = sortedTargets.find((target) => target.amount > earnedTotal)
  const completedTargets = sortedTargets.filter(
    (target) => earnedTotal >= target.amount,
  )
  const progressBase =
    completedTargets[completedTargets.length - 1]?.amount ?? 0
  const nextAmount = nextTarget?.amount ?? progressBase
  const nextProgress = nextTarget
    ? Math.min(
        100,
        ((earnedTotal - progressBase) / (nextAmount - progressBase)) * 100,
      )
    : 100

  return {
    completedTargets,
    earnedTotal,
    nextProgress,
    nextTarget,
    sortedTargets,
  }
}

export function getLockedLogIds(
  dailyLogs: DailyLog[],
  targets: MoneyTarget[],
  spentTargetIds: string[],
) {
  const spentTargetIdSet = new Set(spentTargetIds)
  const highestSpentTargetAmount = targets
    .filter((target) => spentTargetIdSet.has(target.id))
    .reduce((highest, target) => Math.max(highest, target.amount), 0)
  const lockedLogIds = new Set<string>()

  if (highestSpentTargetAmount <= 0) return lockedLogIds

  let cumulative = 0

  for (const log of [...dailyLogs].sort(compareLogsByEarnedOrder)) {
    if (cumulative >= highestSpentTargetAmount) break
    if (log.amount > 0) lockedLogIds.add(log.id)
    cumulative += log.amount
  }

  return lockedLogIds
}

export function getLockedTargetIds(spentTargetIds: string[]) {
  return new Set(spentTargetIds)
}

export function getTargetMilestones(
  targets: MoneyTarget[],
  earnedTotal: number,
  lockedTargetIds: Set<string>,
): TargetMilestoneView[] {
  return targets.map((target, index) => {
    const status = getTargetStatus(
      target,
      index,
      targets,
      earnedTotal,
      lockedTargetIds,
    )

    return {
      target,
      status,
      progress: getTargetProgress(index, targets, earnedTotal, status),
    }
  })
}

export function getNextSpendableTargetId(current: AppState) {
  const spentTargetIds = new Set(current.spentTargetIds)

  return [...current.targets]
    .filter(
      (target) =>
        current.unlockedTargetIds.includes(target.id) &&
        !spentTargetIds.has(target.id),
    )
    .sort((a, b) => a.amount - b.amount)[0]?.id
}

function getExistingSpentTargetIds(current: AppState, targets: MoneyTarget[]) {
  const targetIds = new Set(targets.map((target) => target.id))

  return current.spentTargetIds.filter((id) => targetIds.has(id))
}

function getTargetStatus(
  target: MoneyTarget,
  index: number,
  targets: MoneyTarget[],
  earnedTotal: number,
  lockedTargetIds: Set<string>,
): TargetMilestoneStatus {
  if (lockedTargetIds.has(target.id)) return 'reward-granted'
  if (earnedTotal >= target.amount) return 'completed'

  const previousTarget = targets[index - 1]

  if (!previousTarget || earnedTotal >= previousTarget.amount) return 'active'

  return 'locked'
}

function getTargetProgress(
  index: number,
  targets: MoneyTarget[],
  earnedTotal: number,
  status: TargetMilestoneStatus,
) {
  if (status === 'completed' || status === 'reward-granted') return 100
  if (status === 'locked') return 0

  const previousAmount = targets[index - 1]?.amount ?? 0
  const targetAmount = targets[index].amount
  const targetRange = Math.max(1, targetAmount - previousAmount)

  return Math.min(
    100,
    Math.max(0, ((earnedTotal - previousAmount) / targetRange) * 100),
  )
}

function compareLogsByEarnedOrder(first: DailyLog, second: DailyLog) {
  const dateOrder = first.date.localeCompare(second.date)
  if (dateOrder !== 0) return dateOrder

  return first.updatedAt.localeCompare(second.updatedAt)
}
