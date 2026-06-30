import { useEffect, useMemo, useState } from 'react'
import { upsertDailyLog } from './dailyLogs'
import { isDateKey, todayDateKey } from './format'
import {
  addRewardToHistory,
  createRewardHistoryItem,
  spendSpin,
} from './spins'
import {
  createInitialState,
  loadState,
  persistState,
} from './storage'
import {
  getLockedLogIds,
  getLockedTargetIds,
  getTargetProgressSummary,
  reconcileTargetProgress,
} from './targetProgress'
import type { RewardItem } from './types'

export function usePersonalBankState() {
  const [state, setState] = useState(() => reconcileTargetProgress(loadState()))
  const [selectedDate, setSelectedDate] = useState(todayDateKey)
  const [dailyAmount, setDailyAmount] = useState(0)
  const [targetAmount, setTargetAmount] = useState(4000)
  const [rewardLabel, setRewardLabel] = useState('')

  const targetProgress = useMemo(
    () => getTargetProgressSummary(state.dailyLogs, state.targets),
    [state.dailyLogs, state.targets],
  )
  const lockedLogIds = useMemo(
    () => getLockedLogIds(state.dailyLogs, state.targets, state.spentTargetIds),
    [state.dailyLogs, state.spentTargetIds, state.targets],
  )
  const lockedTargetIds = useMemo(
    () => getLockedTargetIds(state.spentTargetIds),
    [state.spentTargetIds],
  )
  const selectedLog = state.dailyLogs.find((log) => log.date === selectedDate)
  const selectedLogIsLocked = selectedLog
    ? lockedLogIds.has(selectedLog.id)
    : false

  useEffect(() => {
    persistState(state)
  }, [state])

  useEffect(() => {
    const selectedLog = state.dailyLogs.find((log) => log.date === selectedDate)
    setDailyAmount(selectedLog?.amount ?? 0)
  }, [selectedDate, state.dailyLogs])

  function saveDailyLog() {
    if (!isDateKey(selectedDate)) return
    if (selectedDate !== todayDateKey()) return
    if (selectedLogIsLocked) return

    const amount = Math.max(0, Number(dailyAmount) || 0)

    setState((current) =>
      reconcileTargetProgress(
        current,
        upsertDailyLog(current.dailyLogs, selectedDate, amount),
        current.targets,
      ),
    )
  }

  function addTarget() {
    const amount = Math.max(1, Number(targetAmount) || 0)
    if (state.targets.some((target) => target.amount === amount)) return

    setState((current) =>
      reconcileTargetProgress(current, current.dailyLogs, [
        ...current.targets,
        { id: crypto.randomUUID(), amount },
      ]),
    )
    setTargetAmount(amount + 1000)
  }

  function removeTarget(id: string) {
    if (lockedTargetIds.has(id)) return

    setState((current) =>
      reconcileTargetProgress(
        current,
        current.dailyLogs,
        current.targets.filter((target) => target.id !== id),
      ),
    )
  }

  function removeDailyLog(id: string) {
    if (lockedLogIds.has(id)) return

    setState((current) =>
      reconcileTargetProgress(
        current,
        current.dailyLogs.filter((entry) => entry.id !== id),
        current.targets,
      ),
    )
  }

  function addReward() {
    const label = rewardLabel.trim()
    if (!label) return

    setState((current) => ({
      ...current,
      rewards: [...current.rewards, { id: crypto.randomUUID(), label }],
    }))
    setRewardLabel('')
  }

  function removeReward(id: string) {
    setState((current) => ({
      ...current,
      rewards: current.rewards.filter((reward) => reward.id !== id),
    }))
  }

  function spendAvailableSpin() {
    if (state.spins <= 0) return false

    setState((current) => spendSpin(current))
    return true
  }

  function recordReward(reward: RewardItem) {
    const earnedReward = createRewardHistoryItem(reward)

    setState((current) => addRewardToHistory(current, earnedReward))

    return earnedReward
  }

  function resetBank() {
    setState(createInitialState())
    setSelectedDate(todayDateKey())
    setDailyAmount(0)
  }

  function updateSelectedDate(value: string) {
    if (isDateKey(value) && value === todayDateKey()) setSelectedDate(value)
  }

  return {
    addReward,
    addTarget,
    dailyAmount,
    lockedLogIds,
    lockedTargetIds,
    recordReward,
    removeDailyLog,
    removeReward,
    removeTarget,
    resetBank,
    rewardLabel,
    saveDailyLog,
    selectedDate,
    selectedLogIsLocked,
    setDailyAmount,
    setRewardLabel,
    setTargetAmount,
    spendAvailableSpin,
    state,
    targetAmount,
    targetProgress,
    updateSelectedDate,
  }
}
