import { segmentColors } from '../../app/constants'
import type { RewardItem, Segment } from '../../app/types'

function polarToCartesian(radius: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180
  return {
    x: 50 + radius * Math.cos(angleInRadians),
    y: 50 + radius * Math.sin(angleInRadians),
  }
}

export function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(48, endAngle)
  const end = polarToCartesian(48, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M 50 50',
    `L ${start.x} ${start.y}`,
    `A 48 48 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

export function makeSegments(rewards: RewardItem[]): Segment[] {
  const size = 360 / Math.max(1, rewards.length)

  return rewards.map((reward, index) => ({
    reward,
    start: index * size,
    end: (index + 1) * size,
    color: segmentColors[index % segmentColors.length],
  }))
}

export function getLabelPoint(angle: number) {
  return polarToCartesian(31, angle)
}

export function getRewardAtPointer(rotation: number, segments: Segment[]) {
  if (segments.length === 0) return undefined

  const normalizedRotation = ((rotation % 360) + 360) % 360
  const pointerAngle = (360 - normalizedRotation) % 360

  return (
    segments.find(
      (segment) => pointerAngle >= segment.start && pointerAngle < segment.end,
    )?.reward ?? segments[segments.length - 1].reward
  )
}
