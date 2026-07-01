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
