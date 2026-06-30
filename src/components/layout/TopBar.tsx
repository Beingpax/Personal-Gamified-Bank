import { RotateCcw } from 'lucide-react'

export function TopBar({
  onReset,
}: {
  onReset: () => void
}) {
  return (
    <header className="topbar">

      <div className="topbar-actions">
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
