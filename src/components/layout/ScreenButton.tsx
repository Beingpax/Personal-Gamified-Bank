import type React from 'react'
import { cn } from '../../lib/utils'

export function ScreenButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn('screen-button', active && 'screen-button-active')}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
