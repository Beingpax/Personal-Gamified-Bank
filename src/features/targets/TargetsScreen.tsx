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
import type { TargetMilestoneView } from '../../app/targetProgress'
import type { DailyLog, MoneyTarget } from '../../app/types'
import { EmptyMessage } from '../../components/shared/EmptyMessage'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import { TargetMilestone } from './TargetMilestone'

type MoneySummary = {
  completedTargetCount: number
  earnedTotal: number
  nextProgress: number
  nextTarget?: MoneyTarget
  targetCount: number
}

type DailyLogForm = {
  amount: number
  selectedDate: string
  selectedLogIsLocked: boolean
  onAmountChange: (value: number) => void
  onDateChange: (value: string) => void
  onSave: () => void
}

type DailyLogEntry = {
  log: DailyLog
  locked: boolean
}

type TargetForm = {
  amount: number
  onAmountChange: (value: number) => void
  onAdd: () => void
}

export function TargetsScreen({
  dailyLogEntries,
  dailyLogForm,
  moneySummary,
  onRemoveDailyLog,
  onRemoveTarget,
  targetForm,
  targets,
}: {
  dailyLogEntries: DailyLogEntry[]
  dailyLogForm: DailyLogForm
  moneySummary: MoneySummary
  onRemoveDailyLog: (id: string) => void
  onRemoveTarget: (id: string) => void
  targetForm: TargetForm
  targets: TargetMilestoneView[]
}) {
  return (
    <div className="targets-grid">
      <section className="money-panel">
        <div>
          <p className="panel-kicker">Bank</p>
          <strong>{formatCurrency(moneySummary.earnedTotal)}</strong>
          <span>
            {moneySummary.nextTarget
              ? `${formatCurrency(
                  moneySummary.nextTarget.amount - moneySummary.earnedTotal,
                )} to next target`
              : 'All targets cleared'}
          </span>
        </div>
        <div className="hero-progress">
          <div style={{ width: `${moneySummary.nextProgress}%` }} />
        </div>
        <p>
          {moneySummary.completedTargetCount} of {moneySummary.targetCount}{' '}
          targets complete. Each target unlocks one spin once.
        </p>
      </section>

      <section className="daily-panel">
        <div className="daily-panel-copy">
          <p className="panel-kicker">Daily logging</p>
          <h2>{formatDay(dailyLogForm.selectedDate)}</h2>
          <p>
            Save your daily logs when you are ready. Missing earlier days stay
            empty.
          </p>
        </div>
        <form
          className="daily-form"
          onSubmit={(event) => {
            event.preventDefault()
            dailyLogForm.onSave()
          }}
        >
          <label className="field-label">
            Date
            <Input
              aria-label="Daily log date"
              disabled
              max={dailyLogForm.selectedDate}
              min={dailyLogForm.selectedDate}
              type="date"
              value={dailyLogForm.selectedDate}
              onChange={(event) => dailyLogForm.onDateChange(event.target.value)}
            />
          </label>
          <label className="field-label">
            Dollars earned today
            <Input
              aria-label="Dollars earned today"
              disabled={dailyLogForm.selectedLogIsLocked}
              min={0}
              type="number"
              value={dailyLogForm.amount}
              onChange={(event) =>
                dailyLogForm.onAmountChange(Number(event.target.value))
              }
            />
          </label>
          <Button
            className="daily-save"
            disabled={dailyLogForm.selectedLogIsLocked}
            type="submit"
          >
            <Save aria-hidden="true" size={16} />
            {dailyLogForm.selectedLogIsLocked ? 'Reward granted' : 'Save day'}
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
          {targets.map(({ target, status, progress }) => (
            <TargetMilestone
              key={target.id}
              onRemove={() => onRemoveTarget(target.id)}
              progress={progress}
              status={status}
              target={target}
            />
          ))}
        </div>
        <form
          className="target-add-form"
          onSubmit={(event) => {
            event.preventDefault()
            targetForm.onAdd()
          }}
        >
          <Input
            aria-label="New target amount"
            min={1}
            type="number"
            value={targetForm.amount}
            onChange={(event) =>
              targetForm.onAmountChange(Number(event.target.value))
            }
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
          {dailyLogEntries.map(({ log, locked }) => {
            return (
              <div
                className={cn('daily-ledger-row', locked && 'ledger-locked')}
                key={log.id}
              >
                <div className="daily-date">
                  <CalendarDays aria-hidden="true" size={17} />
                  <div>
                    <strong>{formatDay(log.date)}</strong>
                    <span>{locked ? 'Reward granted' : log.date}</span>
                  </div>
                </div>
                <div className="ledger-amount">
                  <strong>{formatCurrency(log.amount)}</strong>
                  {locked && <Lock aria-hidden="true" size={15} />}
                  <button
                    aria-label={
                      locked
                        ? `${log.date} is locked because a reward was granted`
                        : `Remove ${log.date}`
                    }
                    disabled={locked}
                    onClick={() => onRemoveDailyLog(log.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              </div>
            )
          })}
          {dailyLogEntries.length === 0 && (
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
