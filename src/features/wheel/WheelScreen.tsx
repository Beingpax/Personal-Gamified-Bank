import { AnimatePresence, motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
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

type ConfettiParticle = {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  drag: number
  w: number
  h: number
  color: string
  rot: number
  spin: number
  tilt: number
  tiltSpeed: number
  wobble: number
  wobbleSpeed: number
  life: number
  maxLife: number
  dead: boolean
}

const CONFETTI_COLORS = ['#f97316', '#a855f7', '#06b6d4', '#eab308', '#ec4899', '#22c55e', '#f43f5e', '#3b82f6']

// A dense canvas confetti cannon. Thousands of pieces are launched from the
// click point with real launch velocity, then pulled down by gravity with air
// drag and a fluttering tilt — like a real-life confetti burst.
const CONFETTI_COUNT = 6000

const MIN_FLICK_VELOCITY = 0.12
const MAX_FLICK_VELOCITY = 2.8
const FRICTION_PER_MS = 0.999
const STOP_VELOCITY = 0.018

function createConfettiBurst(originX: number, originY: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < CONFETTI_COUNT; i += 1) {
    // Launch in an upward fan: straight up (-90°) with a wide spread sideways.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9)
    const speed = 7 + Math.random() * 21
    particles.push({
      x: originX + (Math.random() - 0.5) * 24,
      y: originY + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.26 + Math.random() * 0.14,
      drag: 0.984 + Math.random() * 0.012,
      w: 5 + Math.random() * 7,
      h: 7 + Math.random() * 9,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: (Math.random() - 0.5) * 0.28,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.04 + Math.random() * 0.06,
      life: 0,
      maxLife: 200 + Math.random() * 160,
      dead: false,
    })
  }
  return particles
}

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const confettiRafRef = useRef<number | null>(null)
  const canUseWheel =
    spins > 0 && rewards.length > 0 && !isSpinning && latestReward == null

  useEffect(() => {
    rotationRef.current = rotation
  }, [rotation])

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (confettiRafRef.current) cancelAnimationFrame(confettiRafRef.current)
    }
  }, [])

  function fireConfetti(originX: number, originY: number) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const canvasRect = canvas.getBoundingClientRect()
    canvas.style.left = `${-canvasRect.left}px`
    canvas.style.top = `${-canvasRect.top}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const particles = createConfettiBurst(originX, originY)
    if (confettiRafRef.current) cancelAnimationFrame(confettiRafRef.current)

    const step = () => {
      ctx.clearRect(0, 0, width, height)
      let alive = 0

      for (const p of particles) {
        if (p.dead) continue

        p.life += 1
        p.vy += p.gravity
        p.vx *= p.drag
        p.vy *= p.drag
        p.wobble += p.wobbleSpeed
        p.x += p.vx + Math.sin(p.wobble) * 0.9
        p.y += p.vy
        p.rot += p.spin
        p.tilt += p.tiltSpeed

        const fadeStart = p.maxLife * 0.7
        const opacity =
          p.life > fadeStart
            ? Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart))
            : 1

        if (p.y > height + 50 || p.life > p.maxLife || opacity <= 0) {
          p.dead = true
          continue
        }

        alive += 1
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = opacity
        ctx.fillStyle = p.color
        // Vertical squash by the tilt simulates a thin sheet fluttering.
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.tilt)) + 1)
        ctx.restore()
      }

      if (alive > 0) {
        confettiRafRef.current = requestAnimationFrame(step)
      } else {
        ctx.clearRect(0, 0, width, height)
        confettiRafRef.current = null
      }
    }

    confettiRafRef.current = requestAnimationFrame(step)
  }

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

  function handleYay(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    // Launch the burst from the button the user just clicked.
    fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2)
    // Clear the reward right away so the wheel is ready to spin again; the
    // confetti keeps flying over the top on its own full-screen canvas.
    onAcknowledgeReward()
  }

  return (
    <div className="wheel-layout">
      <canvas
        ref={canvasRef}
        className="confetti-canvas"
        aria-hidden="true"
      />

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
              className="result-reward"
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              key={latestReward.id}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="panel-kicker result-kicker">Reward unlocked</p>
              <strong className="result-label">{latestReward.rewardLabel}</strong>
              <button
                className="yay-button"
                onClick={handleYay}
                type="button"
              >
                Yay!
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
              <Sparkles aria-hidden="true" size={20} />
              <p>Flick the wheel to reveal your reward</p>
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
