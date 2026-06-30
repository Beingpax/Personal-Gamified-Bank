import type React from 'react'
import { Gift, ListPlus, Trash2, Trophy } from 'lucide-react'
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
  const sliceCount = rewards.length

  return (
    <div className="rewards-grid">
      <section className="reward-editor">
        <div className="section-heading">
          <Gift aria-hidden="true" size={20} />
          <div>
            <h2>Rewards to win</h2>
            <p>Each reward gets one equal slice of the wheel.</p>
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
            placeholder="Name a reward you actually want"
            value={rewardLabel}
            onChange={(event) => setRewardLabel(event.target.value)}
          />
          <Button type="submit">
            <ListPlus aria-hidden="true" size={16} />
            Add reward
          </Button>
        </form>
        <div className="reward-list">
          {rewards.map((reward, index) => {
            const color = segmentColors[index % segmentColors.length]

            return (
              <div className="reward-card" key={reward.id}>
                <span
                  className="reward-swatch"
                  style={{ '--slice': color } as React.CSSProperties}
                >
                  <span className="reward-swatch-dot" />
                </span>
                <div className="reward-body">
                  <strong>{reward.label}</strong>
                  <span
                    className="reward-odds"
                    style={{ '--slice': color } as React.CSSProperties}
                  >
                    <span className="reward-odds-dot" />
                    {sliceCount > 1
                      ? `1 in ${sliceCount}`
                      : 'Always wins'}
                  </span>
                </div>
                <button
                  className="reward-remove"
                  aria-label={`Remove ${reward.label}`}
                  onClick={() => removeReward(reward.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              </div>
            )
          })}
          {rewards.length === 0 && (
            <EmptyMessage
              icon={<Gift aria-hidden="true" size={18} />}
              title="No rewards yet"
              copy="Add at least one reward before you spin."
            />
          )}
        </div>
      </section>

      <section className="history-panel">
        <div className="section-heading">
          <Trophy aria-hidden="true" size={20} />
          <div>
            <h2>Reward shelf</h2>
            <p>Every reward the wheel has handed you, kept on display.</p>
          </div>
        </div>
        <div className="history-list">
          {history.map((item, index) => (
            <div className="trophy-row" key={item.id}>
              <span className="trophy-medal">
                {history.length - index}
              </span>
              <div className="trophy-body">
                <strong>{item.rewardLabel}</strong>
                <span>Won on {formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <EmptyMessage
              icon={<Trophy aria-hidden="true" size={18} />}
              title="Nothing on the shelf yet"
              copy="Win a spin and your reward lands here."
            />
          )}
        </div>
      </section>
    </div>
  )
}
