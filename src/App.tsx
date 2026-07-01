import { AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'
import type { RewardHistoryItem, RewardItem, Screen } from './app/types'
import { usePersonalBankState } from './app/usePersonalBankState'
import { ScreenFrame } from './components/layout/ScreenFrame'
import { SideRail } from './components/layout/SideRail'
import { TopBar } from './components/layout/TopBar'
import { RewardsScreen } from './features/rewards/RewardsScreen'
import { TargetsScreen } from './features/targets/TargetsScreen'
import { WheelScreen } from './features/wheel/WheelScreen'
import { makeSegments } from './features/wheel/wheelMath'

function App() {
  const bank = usePersonalBankState()
  const [activeScreen, setActiveScreen] = useState<Screen>('targets')
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [latestReward, setLatestReward] = useState<RewardHistoryItem | null>(
    null,
  )

  const {
    completedTargets,
    earnedTotal,
    nextProgress,
    nextTarget,
    sortedTargets,
  } = bank.targetProgress
  const segments = useMemo(
    () => makeSegments(bank.state.rewards),
    [bank.state.rewards],
  )

  function startSpin() {
    if (
      bank.state.spins <= 0 ||
      isSpinning ||
      latestReward ||
      segments.length === 0
    ) {
      return false
    }

    const spentSpin = bank.spendAvailableSpin()
    if (spentSpin) setIsSpinning(true)

    return spentSpin
  }

  function completeSpin(reward: RewardItem, finalRotation: number) {
    const earnedReward = bank.recordReward(reward)

    setRotation(finalRotation)
    setLatestReward(earnedReward)
    setIsSpinning(false)
  }

  function acknowledgeReward() {
    if (!latestReward) return

    // Celebrate and clear the reward, staying on the wheel so the user can
    // spin again while spins remain. The win is already recorded in history.
    setLatestReward(null)
  }

  function resetApp() {
    bank.resetBank()
    setLatestReward(null)
    setRotation(0)
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
          spins={bank.state.spins}
        />

        <section className="workspace">
          <TopBar
            activeScreen={activeScreen}
            authEmail={bank.authEmail}
            authMessage={bank.authMessage}
            isSupabaseConfigured={bank.isSupabaseConfigured}
            onReset={confirmReset}
            pendingChangeCount={bank.pendingChangeCount}
            sessionEmail={bank.session?.user.email}
            setAuthEmail={bank.setAuthEmail}
            signInWithEmail={bank.signInWithEmail}
            signOut={bank.signOut}
            syncNow={bank.syncNow}
            syncStatus={bank.syncStatus}
          />

          <AnimatePresence mode="wait">
            {activeScreen === 'targets' && (
              <ScreenFrame key="targets">
                <TargetsScreen
                  dailyLogEntries={bank.dailyLogEntries}
                  dailyLogForm={{
                    amount: bank.dailyAmount,
                    selectedDate: bank.selectedDate,
                    selectedLogIsLocked: bank.selectedLogIsLocked,
                    onAmountChange: bank.setDailyAmount,
                    onDateChange: bank.updateSelectedDate,
                    onSave: bank.saveDailyLog,
                  }}
                  moneySummary={{
                    completedTargetCount: completedTargets.length,
                    earnedTotal,
                    nextProgress,
                    nextTarget,
                    targetCount: sortedTargets.length,
                  }}
                  onRemoveDailyLog={bank.removeDailyLog}
                  onRemoveTarget={bank.removeTarget}
                  targetForm={{
                    amount: bank.targetAmount,
                    onAmountChange: bank.setTargetAmount,
                    onAdd: bank.addTarget,
                  }}
                  targets={bank.targetMilestones}
                />
              </ScreenFrame>
            )}

            {activeScreen === 'wheel' && (
              <ScreenFrame key="wheel">
                <WheelScreen
                  completeSpin={completeSpin}
                  isSpinning={isSpinning}
                  latestReward={latestReward}
                  rewards={bank.state.rewards}
                  rotation={rotation}
                  segments={segments}
                  setRotation={setRotation}
                  startSpin={startSpin}
                  spins={bank.state.spins}
                  onAcknowledgeReward={acknowledgeReward}
                />
              </ScreenFrame>
            )}

            {activeScreen === 'rewards' && (
              <ScreenFrame key="rewards">
                <RewardsScreen
                  addReward={bank.addReward}
                  history={bank.state.history}
                  removeReward={bank.removeReward}
                  rewardLabel={bank.rewardLabel}
                  rewards={bank.state.rewards}
                  setRewardLabel={bank.setRewardLabel}
                />
              </ScreenFrame>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}

export default App
