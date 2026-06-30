import type { Segment } from '../../app/types'
import { describeArc, getLabelPoint } from './wheelMath'

export function WheelSvg({ segments }: { segments: Segment[] }) {
  if (segments.length === 0) {
    return (
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="var(--surface-deep)" r="48" />
      </svg>
    )
  }

  return (
    <svg className="h-full w-full" viewBox="0 0 100 100">
      <circle cx="50" cy="50" fill="var(--ink)" r="49" />
      {segments.map((segment) => {
        const mid = (segment.start + segment.end) / 2
        const labelPoint = getLabelPoint(mid)
        const label =
          segment.reward.label.length > 15
            ? `${segment.reward.label.slice(0, 13)}...`
            : segment.reward.label

        return (
          <g key={segment.reward.id}>
            <path
              d={describeArc(segment.start, segment.end)}
              fill={segment.color}
              stroke="var(--bg)"
              strokeWidth="0.9"
            />
            {segment.end - segment.start > 24 && (
              <text
                dominantBaseline="middle"
                fill="white"
                fontSize="3.4"
                fontWeight="800"
                textAnchor="middle"
                transform={`rotate(${mid}, ${labelPoint.x}, ${labelPoint.y})`}
                x={labelPoint.x}
                y={labelPoint.y}
              >
                {label}
              </text>
            )}
          </g>
        )
      })}
      <circle
        cx="50"
        cy="50"
        fill="none"
        r="48.2"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
    </svg>
  )
}
