import { ArrowRight, RotateCcw } from 'lucide-react'
import type { Screen } from '../../app/types'
import { Button } from '../ui/button'

const labels: Record<Screen, string> = {
  targets: 'All targets',
  wheel: 'Spin wheel',
  rewards: 'Rewards',
}

const titles: Record<Screen, string> = {
  targets: 'All targets',
  wheel: 'Spin wheel',
  rewards: 'Rewards',
}

export function TopBar({
  activeScreen,
  canSpin,
  onReset,
  setActiveScreen,
}: {
  activeScreen: Screen
  canSpin: boolean
  onReset: () => void
  setActiveScreen: (screen: Screen) => void
}) {
  return (
    <header className="topbar">
      <div>
        <p className="screen-label">{labels[activeScreen]}</p>
        <h1>{titles[activeScreen]}</h1>
      </div>
      <div className="topbar-actions">
        <Button onClick={onReset} variant="danger">
          <RotateCcw aria-hidden="true" size={16} />
          Reset data
        </Button>
        <Button disabled={!canSpin} onClick={() => setActiveScreen('wheel')}>
          <ArrowRight aria-hidden="true" size={16} />
          Go spin
        </Button>
      </div>
    </header>
  )
}
