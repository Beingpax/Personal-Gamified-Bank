import { useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../app/format'
import type { TargetMilestoneStatus } from '../../app/targetProgress'
import type { MoneyTarget } from '../../app/types'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { cn } from '../../lib/utils'

export function TargetMilestone({
  onRemove,
  progress,
  status,
  target,
}: {
  onRemove: () => void
  progress: number
  status: TargetMilestoneStatus
  target: MoneyTarget
}) {
  const rewardGranted = status === 'reward-granted'
  const complete = status === 'completed' || rewardGranted
  const progressValue = Math.round(progress)
  const progressLabel =
    status === 'completed' ? 'Spin ready' : `${progressValue}%`
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  function confirmRemove() {
    setConfirmingRemove(false)
    onRemove()
  }

  return (
    <div
      className={cn(
        'target-milestone',
        complete && 'target-complete',
        rewardGranted && 'target-locked',
      )}
    >
      <div className="target-main">
        <div className="target-topline">
          <strong>{formatCurrency(target.amount)}</strong>
          <span className="target-progress-value">{progressLabel}</span>
        </div>
        <div
          aria-label={`${formatCurrency(target.amount)} target progress`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progressValue}
          aria-valuetext={progressLabel}
          className="target-meter"
          role="progressbar"
        >
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>
      {rewardGranted ? (
        <span
          aria-label={`${formatCurrency(target.amount)} target is locked because a reward was granted`}
          className="row-action row-action-locked"
          role="img"
          title="Locked"
        >
          <Lock aria-hidden="true" size={15} />
        </span>
      ) : (
        <button
          aria-label={`Remove ${formatCurrency(target.amount)} target`}
          className="row-action row-action-danger"
          onClick={() => setConfirmingRemove(true)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} />
        </button>
      )}
      <ConfirmDialog
        description={`${formatCurrency(target.amount)} will be removed from your future money targets.`}
        onCancel={() => setConfirmingRemove(false)}
        onConfirm={confirmRemove}
        open={confirmingRemove}
        title="Remove money target?"
      />
    </div>
  )
}
