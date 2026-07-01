import { useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../app/format'
import type { TargetMilestoneStatus } from '../../app/targetProgress'
import type { MoneyTarget } from '../../app/types'
import { cn } from '../../lib/utils'

export function TargetMilestone({
  index,
  onRemove,
  progress,
  status,
  target,
}: {
  index: number
  onRemove: () => void
  progress: number
  status: TargetMilestoneStatus
  target: MoneyTarget
}) {
  const rewardGranted = status === 'reward-granted'
  const milestoneLocked = status === 'locked'
  const complete = status === 'completed' || rewardGranted
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  function confirmRemove() {
    onRemove()
    setConfirmingRemove(false)
  }

  return (
    <div
      className={cn(
        'target-milestone',
        complete && 'target-complete',
        (rewardGranted || milestoneLocked) && 'target-locked',
      )}
    >
      <span className="target-rung">{index + 1}</span>
      <div className="target-main">
        <div className="target-topline">
          <strong>{formatCurrency(target.amount)}</strong>
        </div>
        <div className="target-progress-line">
          <div className="target-meter" aria-hidden="true">
            <div style={{ width: `${progress}%` }} />
          </div>
          <span className="target-percent">
            {rewardGranted || milestoneLocked ? (
              <Lock aria-hidden="true" size={13} />
            ) : (
              `${Math.round(progress)}%`
            )}
          </span>
        </div>
      </div>
      {confirmingRemove ? (
        <div className="row-confirm target-confirm">
          <span>Remove?</span>
          <button onClick={confirmRemove} type="button">
            Yes
          </button>
          <button onClick={() => setConfirmingRemove(false)} type="button">
            No
          </button>
        </div>
      ) : rewardGranted ? (
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
    </div>
  )
}
