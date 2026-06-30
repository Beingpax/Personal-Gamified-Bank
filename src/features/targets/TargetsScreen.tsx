import {
  CalendarDays,
  History,
  Lock,
  Plus,
  Save,
  Target,
  Trash2,
} from 'lucide-react'
import { formatCurrency, formatDay } from '../../app/format'
import type { AppState, MoneyTarget } from '../../app/types'
import { EmptyMessage } from '../../components/shared/EmptyMessage'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import {
  TargetMilestone,
  type TargetMilestoneStatus,
} from './TargetMilestone'

export function TargetsScreen({
  addTarget,
  completedTargets,
  dailyAmount,
  earnedTotal,
  nextProgress,
  nextTarget,
  removeDailyLog,
  removeTarget,
  saveDailyLog,
  selectedDate,
  selectedLogIsLocked,
  setDailyAmount,
  setSelectedDate,
  setTargetAmount,
  state,
  targetAmount,
  targets,
  lockedLogIds,
  lockedTargetIds,
}: {
  addTarget: () => void
  completedTargets: number
  dailyAmount: number
  earnedTotal: number
  nextProgress: number
  nextTarget?: MoneyTarget
  removeDailyLog: (id: string) => void
  removeTarget: (id: string) => void
  saveDailyLog: () => void
  selectedDate: string
  selectedLogIsLocked: boolean
  setDailyAmount: (value: number) => void
  setSelectedDate: (value: string) => void
  setTargetAmount: (value: number) => void
  state: AppState
  targetAmount: number
  targets: MoneyTarget[]
  lockedLogIds: Set<string>
  lockedTargetIds: Set<string>
}) {
  const sortedLogs = [...state.dailyLogs].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  return (
    <div className="targets-grid">
      <section className="money-panel">
        <div>
          <p className="panel-kicker">Bank</p>
          <strong>{formatCurrency(earnedTotal)}</strong>
          <span>
            {nextTarget
              ? `${formatCurrency(nextTarget.amount - earnedTotal)} to next target`
              : 'All targets cleared'}
          </span>
        </div>
        <div className="hero-progress">
          <div style={{ width: `${nextProgress}%` }} />
        </div>
        <p>
          {completedTargets} of {targets.length} targets complete. Each target
          unlocks one spin once.
        </p>
      </section>

      <section className="daily-panel">
        <div className="daily-panel-copy">
          <p className="panel-kicker">Daily dollars</p>
          <h2>{formatDay(selectedDate)}</h2>
          <p>
            Save one total for the selected day. Missing earlier days stay
            empty.
          </p>
        </div>
        <form
          className="daily-form"
          onSubmit={(event) => {
            event.preventDefault()
            saveDailyLog()
          }}
        >
          <label className="field-label">
            Date
            <Input
              aria-label="Daily log date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <label className="field-label">
            Dollars for this day
            <Input
              aria-label="Dollars for this day"
              disabled={selectedLogIsLocked}
              min={0}
              type="number"
              value={dailyAmount}
              onChange={(event) => setDailyAmount(Number(event.target.value))}
            />
          </label>
          <Button
            className="daily-save"
            disabled={selectedLogIsLocked}
            type="submit"
          >
            <Save aria-hidden="true" size={16} />
            {selectedLogIsLocked ? 'Reward granted' : 'Save day'}
          </Button>
        </form>
      </section>

      <section className="target-panel-clean">
        <div className="section-heading">
          <Target aria-hidden="true" size={20} />
          <div>
            <h2>Money targets</h2>
            <p>The milestones that unlock spins.</p>
          </div>
        </div>
        <div className="target-list">
          {targets.map((target, index) => {
            const status = getTargetStatus(
              target,
              index,
              targets,
              earnedTotal,
              lockedTargetIds,
            )

            return (
              <TargetMilestone
                key={target.id}
                onRemove={() => removeTarget(target.id)}
                progress={getTargetProgress(
                  index,
                  targets,
                  earnedTotal,
                  status,
                )}
                status={status}
                target={target}
              />
            )
          })}
        </div>
        <form
          className="target-add-form"
          onSubmit={(event) => {
            event.preventDefault()
            addTarget()
          }}
        >
          <Input
            aria-label="New target amount"
            min={1}
            type="number"
            value={targetAmount}
            onChange={(event) => setTargetAmount(Number(event.target.value))}
          />
          <Button type="submit" variant="secondary">
            <Plus aria-hidden="true" size={16} />
            Add target
          </Button>
        </form>
      </section>

      <section className="daily-ledger-panel">
        <div className="section-heading">
          <History aria-hidden="true" size={20} />
          <div>
            <h2>Daily log</h2>
            <p>Only days you choose to save appear here.</p>
          </div>
        </div>
        <div className="daily-ledger-list">
          {sortedLogs.map((entry) => {
            const locked = lockedLogIds.has(entry.id)

            return (
              <div
                className={cn('daily-ledger-row', locked && 'ledger-locked')}
                key={entry.id}
              >
                <div className="daily-date">
                  <CalendarDays aria-hidden="true" size={17} />
                  <div>
                    <strong>{formatDay(entry.date)}</strong>
                    <span>{locked ? 'Reward granted' : entry.date}</span>
                  </div>
                </div>
                <div className="ledger-amount">
                  <strong>{formatCurrency(entry.amount)}</strong>
                  {locked && <Lock aria-hidden="true" size={15} />}
                  <button
                    aria-label={
                      locked
                        ? `${entry.date} is locked because a reward was granted`
                        : `Remove ${entry.date}`
                    }
                    disabled={locked}
                    onClick={() => removeDailyLog(entry.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              </div>
            )
          })}
          {state.dailyLogs.length === 0 && (
            <EmptyMessage
              icon={<CalendarDays aria-hidden="true" size={18} />}
              title="No days logged"
              copy="Save today’s total when you are ready."
            />
          )}
        </div>
      </section>
    </div>
  )
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
