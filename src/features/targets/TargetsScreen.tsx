import {
  CalendarDays,
  History,
  Lock,
  Plus,
  Save,
  Target,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDay } from '../../app/format'
import type { TargetMilestoneView } from '../../app/targetProgress'
import type { DailyLog, MoneyTarget } from '../../app/types'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
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
  spins: number
  targetCount: number
}

type DailyLogForm = {
  amount: number
  selectedLogIsLocked: boolean
  onAmountChange: (value: number) => void
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
  const [confirmingDailyLogId, setConfirmingDailyLogId] = useState<
    string | null
  >(null)
  const visibleTargets = targets
    .filter(({ status }) => status !== 'reward-granted')
    .slice(0, 4)
  const visibleDailyLogEntries = dailyLogEntries.slice(0, 7)
  const dailyLogToRemove = visibleDailyLogEntries.find(
    ({ log }) => log.id === confirmingDailyLogId,
  )?.log

  function confirmRemoveDailyLog(id: string) {
    onRemoveDailyLog(id)
    setConfirmingDailyLogId(null)
  }

  return (
    <>
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
          {getProgressNudge(moneySummary)}
        </p>
      </section>

      <section className="daily-panel">
        <div className="daily-panel-copy">
          <p className="panel-kicker">Daily logging</p>
          <p>
            Log today's progress when you are ready. Earlier days stay empty.
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
            Dollars on today
            <Input
              aria-label="Dollars on today"
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
            Save
          </Button>
        </form>
      </section>

      <section className="target-panel-clean">
        <div className="panel-heading">
          <div className="panel-title">
            <span className="panel-icon panel-icon-target">
              <Target aria-hidden="true" size={18} />
            </span>
            <div>
              <h2>Money targets</h2>
              <p>The milestones that unlock spins.</p>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'target-list',
            visibleTargets.length === 0 && 'target-list-empty',
          )}
        >
          {visibleTargets.length > 0 ? (
            visibleTargets.map(({ target, status, progress }) => (
              <TargetMilestone
                key={target.id}
                onRemove={() => onRemoveTarget(target.id)}
                progress={progress}
                status={status}
                target={target}
              />
            ))
          ) : (
            <EmptyMessage
              icon={<Target aria-hidden="true" size={18} />}
              title={
                targets.length === 0 ? 'No targets yet' : 'All targets cleared'
              }
              copy={
                targets.length === 0
                  ? 'Add a target amount to create your first spin milestone.'
                  : 'Add another target when you want a new run.'
              }
            />
          )}
        </div>
        <form
          className="target-add-form"
          onSubmit={(event) => {
            event.preventDefault()
            targetForm.onAdd()
          }}
        >
          <label className="target-amount-control">
            <span aria-hidden="true">$</span>
            <Input
              aria-label="New target amount"
              min={1}
              type="number"
              value={targetForm.amount}
              onChange={(event) =>
                targetForm.onAmountChange(Number(event.target.value))
              }
            />
          </label>
          <Button type="submit" variant="secondary">
            <Plus aria-hidden="true" size={16} />
            Add target
          </Button>
        </form>
      </section>

      <section className="daily-ledger-panel">
        <div className="panel-heading">
          <div className="panel-title">
            <span className="panel-icon panel-icon-log">
              <History aria-hidden="true" size={18} />
            </span>
            <div>
              <h2>Daily log</h2>
              <p>Only days you choose to save appear here.</p>
            </div>
          </div>
        </div>
        <div className="daily-ledger-list">
          {visibleDailyLogEntries.length > 0 && (
            <div className="daily-ledger-head" aria-hidden="true">
              <span>Day</span>
              <span>Amount</span>
              <span />
            </div>
          )}
          {visibleDailyLogEntries.map(({ log, locked }) => {
            return (
              <div
                className={cn('daily-ledger-row', locked && 'ledger-locked')}
                key={log.id}
              >
                <div className="daily-date">
                  <div>
                    <strong>{formatDay(log.date)}</strong>
                    <span>{log.date}</span>
                  </div>
                </div>
                <strong className="ledger-value">
                  {formatCurrency(log.amount)}
                </strong>
                {locked ? (
                  <span
                    aria-label={`${log.date} is locked because a reward was granted`}
                    className="row-action row-action-locked"
                    role="img"
                    title="Locked"
                  >
                    <Lock aria-hidden="true" size={15} />
                  </span>
                ) : (
                  <button
                    aria-label={`Remove ${log.date}`}
                    className="row-action row-action-danger"
                    onClick={() => setConfirmingDailyLogId(log.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                )}
              </div>
            )
          })}
          {visibleDailyLogEntries.length === 0 && (
            <EmptyMessage
              icon={<CalendarDays aria-hidden="true" size={18} />}
              title="No days logged"
              copy="Save today’s total when you are ready."
            />
          )}
        </div>
      </section>
      </div>
      <ConfirmDialog
        description={
          dailyLogToRemove
            ? `${formatDay(dailyLogToRemove.date)} (${formatCurrency(
                dailyLogToRemove.amount,
              )}) will be removed from your daily log.`
            : ''
        }
        onCancel={() => setConfirmingDailyLogId(null)}
        onConfirm={() => {
          if (dailyLogToRemove) confirmRemoveDailyLog(dailyLogToRemove.id)
        }}
        open={Boolean(dailyLogToRemove)}
        title="Remove daily log?"
      />
    </>
  )
}

function getProgressNudge({
  completedTargetCount,
  earnedTotal,
  nextTarget,
  spins,
  targetCount,
}: MoneySummary) {
  if (spins > 0) {
    return `${spins} ${spins === 1 ? 'spin is' : 'spins are'} ready. Flick the wheel when you want your reward.`
  }

  if (nextTarget) {
    const remaining = Math.max(0, nextTarget.amount - earnedTotal)
    const spinLabel = completedTargetCount === 0 ? 'first spin' : 'next spin'

    return `${formatCurrency(remaining)} more unlocks your ${spinLabel}.`
  }

  if (targetCount === 0) {
    return 'Add a target to start earning spins.'
  }

  return 'All targets cleared. Add another target when you want a new run.'
}
