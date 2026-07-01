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
  velocitySamples: VelocitySample[]
}

type VelocitySample = {
  time: number
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

// A dense but short canvas burst. The time-based step keeps the celebration
// moving briskly even when drawing many pieces.
const CONFETTI_COUNT = 5000
const CONFETTI_FRAME_MS = 1000 / 60
const CONFETTI_MAX_FRAME_STEP = 2.4

const MIN_FLICK_VELOCITY = 0.12
const MAX_FLICK_VELOCITY = 2.8
const RELEASE_SAMPLE_WINDOW_MS = 120
const RELEASE_VELOCITY_BOOST = 1.85
const SPIN_DECAY_PER_MS = 0.999
const REST_VELOCITY = 0.002
const MAX_SPIN_DURATION_MS = 7600

function createConfettiBurst(originX: number, originY: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < CONFETTI_COUNT; i += 1) {
    // Launch in an upward fan: straight up (-90°) with a wide spread sideways.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 1.05)
    const speed = 12 + Math.random() * 30
    particles.push({
      x: originX + (Math.random() - 0.5) * 24,
      y: originY + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.42 + Math.random() * 0.22,
      drag: 0.972 + Math.random() * 0.014,
      w: 5 + Math.random() * 7,
      h: 7 + Math.random() * 9,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: (Math.random() - 0.5) * 0.28,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.06 + Math.random() * 0.08,
      life: 0,
      maxLife: 76 + Math.random() * 84,
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
    velocitySamples: [],
  })
  const [isDragging, setIsDragging] = useState(false)
  const [hint, setHint] = useState('Grab the wheel and flick it.')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const confettiRafRef = useRef<number | null>(null)
  const hasRewards = rewards.length > 0
  const canUseWheel =
    spins > 0 && hasRewards && !isSpinning && latestReward == null

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
    let lastFrameTime = performance.now()

    const step = (now: number) => {
      const frameStep = Math.min(
        CONFETTI_MAX_FRAME_STEP,
        Math.max(0.5, (now - lastFrameTime) / CONFETTI_FRAME_MS),
      )
      lastFrameTime = now
      ctx.clearRect(0, 0, width, height)
      let alive = 0

      for (const p of particles) {
        if (p.dead) continue

        p.life += frameStep
        p.vy += p.gravity * frameStep
        p.vx *= Math.pow(p.drag, frameStep)
        p.vy *= Math.pow(p.drag, frameStep)
        p.wobble += p.wobbleSpeed * frameStep
        p.x += (p.vx + Math.sin(p.wobble) * 1.15) * frameStep
        p.y += p.vy * frameStep
        p.rot += p.spin * frameStep
        p.tilt += p.tiltSpeed * frameStep

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
      velocitySamples: [],
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
    const velocity = delta / elapsed
    const velocitySamples = [
      ...dragRef.current.velocitySamples.filter(
        (sample) => now - sample.time <= RELEASE_SAMPLE_WINDOW_MS,
      ),
      { time: now, velocity },
    ]

    dragRef.current = {
      active: true,
      lastAngle: angle,
      lastRotation: nextRotation,
      lastTime: now,
      velocity,
      velocitySamples,
    }
    rotationRef.current = nextRotation
    setRotation(nextRotation)
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current.active) return

    event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current.active = false
    setIsDragging(false)

    const releaseVelocity = getReleaseVelocity(dragRef.current, performance.now())

    if (Math.abs(releaseVelocity) < MIN_FLICK_VELOCITY) {
      setHint('Flick faster to spend a spin.')
      return
    }

    beginPhysicalSpin(releaseVelocity * RELEASE_VELOCITY_BOOST)
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
    const startRotation = rotationRef.current
    const startedAt = performance.now()
    const decay = -Math.log(SPIN_DECAY_PER_MS)
    const duration = Math.min(
      MAX_SPIN_DURATION_MS,
      Math.log(Math.abs(initialVelocity) / REST_VELOCITY) / decay,
    )
    const finalRotation =
      startRotation +
      (initialVelocity * (1 - Math.exp(-decay * duration))) / decay

    const step = (now: number) => {
      const elapsed = Math.min(duration, now - startedAt)
      const travelled =
        (initialVelocity * (1 - Math.exp(-decay * elapsed))) / decay
      const nextRotation =
        elapsed >= duration ? finalRotation : startRotation + travelled
      rotationRef.current = nextRotation
      setRotation(nextRotation)

      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(step)
        return
      }

      const reward = getRewardAtPointer(finalRotation, segments)
      animationRef.current = null
      setHint('Grab the wheel and flick it.')
      if (reward) completeSpin(reward, finalRotation)
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
            ? 'Reward moved to the shelf.'
            : !hasRewards
              ? 'Add a reward to refresh the wheel.'
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
              <p>
                {!hasRewards
                  ? 'Add rewards to fill the wheel'
                  : spins > 0
                    ? 'Flick the wheel to reveal your reward'
                    : 'Earn a spin to use the wheel'}
              </p>
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

function getReleaseVelocity(drag: DragState, releaseTime: number) {
  if (drag.velocitySamples.length === 0) return drag.velocity

  const recentSamples = drag.velocitySamples.filter(
    (sample) => releaseTime - sample.time <= RELEASE_SAMPLE_WINDOW_MS,
  )
  if (recentSamples.length === 0) return 0

  const weightedVelocity = recentSamples.reduce(
    (total, sample, index) => total + sample.velocity * (index + 1),
    0,
  )
  const totalWeight = recentSamples.reduce(
    (total, _sample, index) => total + index + 1,
    0,
  )

  return weightedVelocity / totalWeight
}

function shortestAngleDelta(next: number, previous: number) {
  return ((next - previous + 540) % 360) - 180
}
