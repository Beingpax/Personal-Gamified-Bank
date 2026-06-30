import { AnimatePresence, motion } from 'motion/react'
import { Check, Gift } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { RewardHistoryItem, RewardItem, Segment } from '../../app/types'
import { cn } from '../../lib/utils'
import { getRewardAtPointer } from './wheelMath'
import { WheelSvg } from './WheelSvg'

type DragState = {
  active: boolean
  lastAngle: number
  lastRotation: number
  lastTime: number
  velocity: number
}

const MIN_FLICK_VELOCITY = 0.12
const MAX_FLICK_VELOCITY = 2.8
const FRICTION_PER_MS = 0.999
const STOP_VELOCITY = 0.018

export function WheelScreen({
  completeSpin,
  isSpinning,
  latestReward,
  rewards,
  rotation,
  segments,
  setRotation,
  startSpin,
  spins,
  onAcknowledgeReward,
}: {
  completeSpin: (reward: RewardItem, finalRotation: number) => void
  isSpinning: boolean
  latestReward: RewardHistoryItem | null
  rewards: RewardItem[]
  rotation: number
  segments: Segment[]
  setRotation: (rotation: number) => void
  startSpin: () => boolean
  spins: number
  onAcknowledgeReward: () => void
}) {
  const wheelPanelRef = useRef<HTMLElement | null>(null)
  const rotationRef = useRef(rotation)
  const animationRef = useRef<number | null>(null)
  const dragRef = useRef<DragState>({
    active: false,
    lastAngle: 0,
    lastRotation: 0,
    lastTime: 0,
    velocity: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [hint, setHint] = useState('Grab the wheel and flick it.')
  const canUseWheel =
    spins > 0 && rewards.length > 0 && !isSpinning && latestReward == null

  useEffect(() => {
    rotationRef.current = rotation
  }, [rotation])

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  function getPointerAngle(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)

    return normalizeAngle((Math.atan2(y, x) * 180) / Math.PI + 90)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!canUseWheel) return

    const angle = getPointerAngle(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      active: true,
      lastAngle: angle,
      lastRotation: rotationRef.current,
      lastTime: performance.now(),
      velocity: 0,
    }
    setHint('Release with speed.')
    setIsDragging(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current.active) return

    const now = performance.now()
    const angle = getPointerAngle(event)
    const delta = shortestAngleDelta(angle, dragRef.current.lastAngle)
    const elapsed = Math.max(1, now - dragRef.current.lastTime)
    const nextRotation = dragRef.current.lastRotation + delta

    dragRef.current = {
      active: true,
      lastAngle: angle,
      lastRotation: nextRotation,
      lastTime: now,
      velocity: delta / elapsed,
    }
    rotationRef.current = nextRotation
    setRotation(nextRotation)
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current.active) return

    event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current.active = false
    setIsDragging(false)

    if (Math.abs(dragRef.current.velocity) < MIN_FLICK_VELOCITY) {
      setHint('Flick faster to spend a spin.')
      return
    }

    beginPhysicalSpin(dragRef.current.velocity * 1.85)
  }

  function beginPhysicalSpin(rawVelocity: number) {
    if (!startSpin()) return

    const direction = Math.sign(rawVelocity) || 1
    const velocity =
      direction *
      Math.min(
        MAX_FLICK_VELOCITY,
        Math.max(MIN_FLICK_VELOCITY * 2.5, Math.abs(rawVelocity)),
      )

    setHint('Spinning...')
    animateSpin(velocity)
  }

  function animateSpin(initialVelocity: number) {
    let velocity = initialVelocity
    let lastTime = performance.now()

    const step = (now: number) => {
      const elapsed = Math.min(32, now - lastTime)
      lastTime = now
      velocity *= Math.pow(FRICTION_PER_MS, elapsed)

      const nextRotation = rotationRef.current + velocity * elapsed
      rotationRef.current = nextRotation
      setRotation(nextRotation)

      if (Math.abs(velocity) > STOP_VELOCITY) {
        animationRef.current = requestAnimationFrame(step)
        return
      }

      const reward = getRewardAtPointer(nextRotation, segments)
      setHint('Grab the wheel and flick it.')
      if (reward) completeSpin(reward, nextRotation)
    }

    animationRef.current = requestAnimationFrame(step)
  }

  return (
    <div className="wheel-layout">
      <section className="wheel-copy">
        <p className="panel-kicker">Available spins</p>
        <strong>{spins}</strong>
        <span>
          {latestReward
            ? 'Reward locked on the wheel.'
            : spins > 0
              ? hint
              : 'Hit a money target to unlock the wheel.'}
        </span>
      </section>

      <section
        aria-label="Physical reward wheel"
        className={cn(
          'wheel-panel',
          canUseWheel && 'wheel-panel-ready',
          isDragging && 'wheel-panel-dragging',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={wheelPanelRef}
      >
        <div className="wheel-clicker" aria-hidden="true">
          <span />
        </div>
        <div className="wheel-aura" aria-hidden="true" />
        <div
          className={cn(
            'wheel',
            (isSpinning || isDragging) && 'wheel-live',
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <WheelSvg segments={segments} />
        </div>
        <div className="wheel-center" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="result-panel">
        <AnimatePresence mode="wait">
          {latestReward ? (
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="result-card"
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              key={latestReward.id}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <Check aria-hidden="true" size={18} />
              </div>
              <p>Reward earned</p>
              <strong>{latestReward.rewardLabel}</strong>
              <button
                className="claim-reward-button"
                onClick={onAcknowledgeReward}
                type="button"
              >
                Get reward
              </button>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="quiet-result"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="empty-result"
            >
              <Gift aria-hidden="true" size={18} />
              <p>Your next result will land here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360
}

function shortestAngleDelta(next: number, previous: number) {
  return ((next - previous + 540) % 360) - 180
}
