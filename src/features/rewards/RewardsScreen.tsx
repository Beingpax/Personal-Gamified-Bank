import { Gift, History, ListPlus, Trash2 } from 'lucide-react'
import { segmentColors } from '../../app/constants'
import { formatDate } from '../../app/format'
import type { RewardHistoryItem, RewardItem } from '../../app/types'
import { EmptyMessage } from '../../components/shared/EmptyMessage'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export function RewardsScreen({
  addReward,
  history,
  removeReward,
  rewardLabel,
  rewards,
  setRewardLabel,
}: {
  addReward: () => void
  history: RewardHistoryItem[]
  removeReward: (id: string) => void
  rewardLabel: string
  rewards: RewardItem[]
  setRewardLabel: (value: string) => void
}) {
  return (
    <div className="rewards-grid">
      <section className="action-panel reward-editor">
        <div className="section-heading">
          <Gift aria-hidden="true" size={20} />
          <div>
            <h2>Wheel rewards</h2>
            <p>Every reward gets one clean slice.</p>
          </div>
        </div>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            addReward()
          }}
        >
          <Input
            aria-label="Reward"
            placeholder="Add reward"
            value={rewardLabel}
            onChange={(event) => setRewardLabel(event.target.value)}
          />
          <Button type="submit">
            <ListPlus aria-hidden="true" size={16} />
            Add reward
          </Button>
        </form>
        <div className="reward-list">
          {rewards.map((reward, index) => (
            <div className="reward-row" key={reward.id}>
              <span
                style={{ background: segmentColors[index % segmentColors.length] }}
              />
              <strong>{reward.label}</strong>
              <button
                aria-label={`Remove ${reward.label}`}
                onClick={() => removeReward(reward.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
              </button>
            </div>
          ))}
          {rewards.length === 0 && (
            <EmptyMessage
              icon={<Gift aria-hidden="true" size={18} />}
              title="No rewards yet"
              copy="Add at least one reward before spinning."
            />
          )}
        </div>
      </section>

      <section className="action-panel history-panel">
        <div className="section-heading">
          <History aria-hidden="true" size={20} />
          <div>
            <h2>Reward history</h2>
            <p>What the wheel picked for you.</p>
          </div>
        </div>
        <div className="history-list">
          {history.map((item) => (
            <div className="history-row" key={item.id}>
              <div>
                <strong>{item.rewardLabel}</strong>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <Gift aria-hidden="true" size={18} />
            </div>
          ))}
          {history.length === 0 && (
            <EmptyMessage
              icon={<History aria-hidden="true" size={18} />}
              title="No rewards claimed"
              copy="Spin results will appear here."
            />
          )}
        </div>
      </section>
    </div>
  )
}
