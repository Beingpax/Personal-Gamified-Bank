import { BadgeDollarSign, Gift, Sparkles, Target } from 'lucide-react'
import type { Screen } from '../../app/types'
import { formatCurrency } from '../../app/format'
import { APP_NAME } from '../../app/constants'
import { ScreenButton } from './ScreenButton'

export function SideRail({
  activeScreen,
  earnedTotal,
  setActiveScreen,
  spins,
}: {
  activeScreen: Screen
  earnedTotal: number
  setActiveScreen: (screen: Screen) => void
  spins: number
}) {
  return (
    <aside className="side-rail">
      <div>
        <div className="brand-mark">
          <BadgeDollarSign aria-hidden="true" size={28} strokeWidth={2.4} />
        </div>
        <p className="rail-kicker">{APP_NAME}</p>
      </div>

      <nav aria-label="Primary screens" className="rail-nav">
        <ScreenButton
          active={activeScreen === 'targets'}
          icon={<Target aria-hidden="true" size={18} />}
          label="All targets"
          onClick={() => setActiveScreen('targets')}
        />
        <ScreenButton
          active={activeScreen === 'wheel'}
          icon={<Sparkles aria-hidden="true" size={18} />}
          label="Spin wheel"
          onClick={() => setActiveScreen('wheel')}
        />
        <ScreenButton
          active={activeScreen === 'rewards'}
          icon={<Gift aria-hidden="true" size={18} />}
          label="Rewards"
          onClick={() => setActiveScreen('rewards')}
        />
      </nav>

      <div className="rail-balance">
        <span>Total earned</span>
        <strong>{formatCurrency(earnedTotal)}</strong>
        <small>{spins} spins available</small>
      </div>
    </aside>
  )
}
