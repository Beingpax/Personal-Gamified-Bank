import { AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { normalizeDailyLogs, upsertDailyLog } from './app/dailyLogs'
import { isDateKey, todayDateKey } from './app/format'
import { totalEarned } from './app/progress'
import {
  createInitialState,
  loadState,
  persistState,
} from './app/storage'
import type {
  AppState,
  DailyLog,
  MoneyTarget,
  RewardHistoryItem,
  RewardItem,
  Screen,
} from './app/types'
import { ScreenFrame } from './components/layout/ScreenFrame'
import { SideRail } from './components/layout/SideRail'
import { TopBar } from './components/layout/TopBar'
import { RewardsScreen } from './features/rewards/RewardsScreen'
import { TargetsScreen } from './features/targets/TargetsScreen'
import { WheelScreen } from './features/wheel/WheelScreen'
import { makeSegments } from './features/wheel/wheelMath'

function App() {
  const [state, setState] = useState<AppState>(() =>
    reconcileTargetProgress(loadState()),
  )
  const [activeScreen, setActiveScreen] = useState<Screen>('targets')
  const [selectedDate, setSelectedDate] = useState(todayDateKey)
  const [dailyAmount, setDailyAmount] = useState(0)
  const [targetAmount, setTargetAmount] = useState(4000)
  const [rewardLabel, setRewardLabel] = useState('')
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [latestReward, setLatestReward] = useState<RewardHistoryItem | null>(
    null,
  )

  const earnedTotal = totalEarned(state.dailyLogs)
  const sortedTargets = useMemo(
    () => [...state.targets].sort((a, b) => a.amount - b.amount),
    [state.targets],
  )
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
  const segments = useMemo(() => makeSegments(state.rewards), [state.rewards])
  const lockedLogIds = useMemo(
    () => getLockedLogIds(state.dailyLogs, state.targets, state.spentTargetIds),
    [state.dailyLogs, state.spentTargetIds, state.targets],
  )
  const lockedTargetIds = useMemo(
    () => new Set(state.spentTargetIds),
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

  function startSpin() {
    if (state.spins <= 0 || isSpinning || latestReward || segments.length === 0) {
      return false
    }
    setIsSpinning(true)
    setState((current) => {
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
    })
    return true
  }

  function updateSelectedDate(value: string) {
    if (isDateKey(value)) setSelectedDate(value)
  }

  function completeSpin(reward: RewardItem, finalRotation: number) {
    const earnedReward: RewardHistoryItem = {
      id: crypto.randomUUID(),
      rewardId: reward.id,
      rewardLabel: reward.label,
      createdAt: new Date().toISOString(),
    }

    setRotation(finalRotation)
    setLatestReward(earnedReward)
    setIsSpinning(false)
    setState((current) => ({
      ...current,
      history: [earnedReward, ...current.history].slice(0, 60),
    }))
  }

  function acknowledgeReward() {
    if (!latestReward) return

    // Celebrate and clear the reward, staying on the wheel so the user can
    // spin again while spins remain. The win is already recorded in history.
    setLatestReward(null)
  }

  function resetApp() {
    setState(createInitialState())
    setLatestReward(null)
    setRotation(0)
    setSelectedDate(todayDateKey())
    setDailyAmount(0)
    setActiveScreen('targets')
  }

  function confirmReset() {
    const confirmed = window.confirm(
      'Reset everything? This clears your targets, daily logs, rewards, and history. This cannot be undone.',
    )
    if (confirmed) resetApp()
  }

  return (
    <main className="min-h-svh bg-[var(--bg)] text-[var(--ink)]">
      <div className="app-shell">
        <SideRail
          activeScreen={activeScreen}
          earnedTotal={earnedTotal}
          setActiveScreen={setActiveScreen}
          spins={state.spins}
        />

        <section className="workspace">
          <TopBar
            activeScreen={activeScreen}
            canSpin={
              state.spins > 0 && state.rewards.length > 0 && latestReward == null
            }
            spins={state.spins}
            onReset={confirmReset}
            setActiveScreen={setActiveScreen}
          />

          <AnimatePresence mode="wait">
            {activeScreen === 'targets' && (
              <ScreenFrame key="targets">
                <TargetsScreen
                  addTarget={addTarget}
                  completedTargets={completedTargets.length}
                  dailyAmount={dailyAmount}
                  earnedTotal={earnedTotal}
                  nextProgress={nextProgress}
                  nextTarget={nextTarget}
                  removeDailyLog={removeDailyLog}
                  removeTarget={removeTarget}
                  saveDailyLog={saveDailyLog}
                  selectedDate={selectedDate}
                  selectedLogIsLocked={selectedLogIsLocked}
                  setDailyAmount={setDailyAmount}
                  setSelectedDate={updateSelectedDate}
                  setTargetAmount={setTargetAmount}
                  state={state}
                  targetAmount={targetAmount}
                  targets={sortedTargets}
                  lockedLogIds={lockedLogIds}
                  lockedTargetIds={lockedTargetIds}
                />
              </ScreenFrame>
            )}

            {activeScreen === 'wheel' && (
              <ScreenFrame key="wheel">
                <WheelScreen
                  completeSpin={completeSpin}
                  isSpinning={isSpinning}
                  latestReward={latestReward}
                  rewards={state.rewards}
                  rotation={rotation}
                  segments={segments}
                  setRotation={setRotation}
                  startSpin={startSpin}
                  spins={state.spins}
                  onAcknowledgeReward={acknowledgeReward}
                />
              </ScreenFrame>
            )}

            {activeScreen === 'rewards' && (
              <ScreenFrame key="rewards">
                <RewardsScreen
                  addReward={addReward}
                  history={state.history}
                  removeReward={removeReward}
                  rewardLabel={rewardLabel}
                  rewards={state.rewards}
                  setRewardLabel={setRewardLabel}
                />
              </ScreenFrame>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}

function reconcileTargetProgress(
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

function getExistingSpentTargetIds(current: AppState, targets: MoneyTarget[]) {
  const targetIds = new Set(targets.map((target) => target.id))

  return current.spentTargetIds.filter((id) => targetIds.has(id))
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

function getLockedLogIds(
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

function compareLogsByEarnedOrder(first: DailyLog, second: DailyLog) {
  const dateOrder = first.date.localeCompare(second.date)
  if (dateOrder !== 0) return dateOrder

  return first.updatedAt.localeCompare(second.updatedAt)
}

export default App
