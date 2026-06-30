import { RotateCcw } from 'lucide-react'
import type { Screen } from '../../app/types'

export function TopBar({
  activeScreen,
  onReset,
}: {
  activeScreen: Screen
  onReset: () => void
}) {
  return (
    <header className="topbar">

      <div className="topbar-actions">
        {activeScreen === 'targets' && (
          <button
            className="reset-button"
            onClick={onReset}
            title="Reset all data"
            type="button"
          >
            <RotateCcw aria-hidden="true" size={15} />
            Reset
          </button>
        )}
      </div>
    </header>
  )
}
