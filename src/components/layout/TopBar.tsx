import { RotateCcw, Sparkles } from 'lucide-react'
import type { Screen } from '../../app/types'

export function TopBar({
  activeScreen,
  canSpin,
  spins,
  onReset,
  setActiveScreen,
}: {
  activeScreen: Screen
  canSpin: boolean
  spins: number
  onReset: () => void
  setActiveScreen: (screen: Screen) => void
}) {
  return (
    <header className="topbar">

      <div className="topbar-actions">
        {canSpin && activeScreen !== 'wheel' && (
          <button
            className="spin-cta"
            onClick={() => setActiveScreen('wheel')}
            type="button"
          >
            <Sparkles aria-hidden="true" size={17} />
            Spin to win
            <span className="spin-cta-count">{spins}</span>
          </button>
        )}
        <button
          className="reset-button"
          onClick={onReset}
          title="Reset all data"
          type="button"
        >
          <RotateCcw aria-hidden="true" size={15} />
          Reset
        </button>
      </div>
    </header>
  )
}
