import type React from 'react'

export function EmptyMessage({
  copy,
  icon,
  title,
}: {
  copy: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="empty-message">
      {icon}
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  )
}
