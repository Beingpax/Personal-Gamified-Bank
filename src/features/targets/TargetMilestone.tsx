import { Lock, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../app/format'
import type { TargetMilestoneStatus } from '../../app/targetProgress'
import type { MoneyTarget } from '../../app/types'
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
  const milestoneLocked = status === 'locked'
  const complete = status === 'completed' || rewardGranted
  const label = getStatusLabel(status)

  return (
    <div
      className={cn(
        'target-milestone',
        complete && 'target-complete',
        (rewardGranted || milestoneLocked) && 'target-locked',
      )}
    >
      <div className="target-copy">
        <span>{label}</span>
        <strong>{formatCurrency(target.amount)}</strong>
      </div>
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
      <button
        aria-label={
          rewardGranted
            ? `${formatCurrency(target.amount)} target is locked because a reward was granted`
            : `Remove ${formatCurrency(target.amount)} target`
        }
        disabled={rewardGranted}
        onClick={onRemove}
        type="button"
      >
        <Trash2 aria-hidden="true" size={15} />
      </button>
    </div>
  )
}

function getStatusLabel(status: TargetMilestoneStatus) {
  switch (status) {
    case 'active':
      return 'Current target'
    case 'completed':
      return 'Completed'
    case 'locked':
      return 'Locked'
    case 'reward-granted':
      return 'Reward granted'
  }
}
