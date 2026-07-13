import { RefObject, useEffect, useRef } from 'react'
import {
  CANVAS_HEIGHT, CANVAS_WIDTH, CLEAR_WAIT, COLORS,
  DEAD_WAIT, FLOOR_HEIGHT, FLOOR_Y,
  MISSION_CLEAR_BONUS, NO_MISS_BONUS,
  SCORE_BY_SIZE, TIME_BONUS_PER_SEC,
} from './constants'
import { Block, createBlock } from './entities/block'
import { Bubble, createBubble, createSplitBubbles, updateBubble } from './entities/bubble'
import { Player, createPlayer, updatePlayer } from './entities/player'
import { Wire, createWire, updateWire } from './entities/wire'
import { drawBubble } from './renderer/drawBubble'
import { drawBlock } from './renderer/drawBlock'
import { drawHUD, drawOverlay } from './renderer/drawHUD'
import { drawPlayer } from './renderer/drawPlayer'
import { drawWire } from './renderer/drawWire'
import { STAGES } from './stages/stageData'
import type { GameStatus } from './types'

function checkWireBubble(wire: Wire, bubble: Bubble): boolean {
  return (
    Math.abs(wire.x - bubble.x) <= bubble.radius &&
    wire.yTop    <= bubble.y + bubble.radius &&
    wire.yBottom >= bubble.y - bubble.radius
  )
}

function checkPlayerBubble(player: Player, bubble: Bubble): boolean {
  const nearX = Math.max(player.x - player.width  / 2, Math.min(bubble.x, player.x + player.width  / 2))
  const nearY = Math.max(player.y - player.height / 2, Math.min(bubble.y, player.y + player.height / 2))
  const dx = bubble.x - nearX
  const dy = bubble.y - nearY
  return dx * dx + dy * dy < bubble.radius * bubble.radius
}

export function useGameLoop(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  const playerRef    = useRef<Player>(createPlayer())
  const bubblesRef   = useRef<Bubble[]>([])
  const blocksRef    = useRef<Block[]>([])
  const wireRef      = useRef<Wire | null>(null)
  const pressedKeys  = useRef<Set<string>>(new Set())
  const rafId        = useRef<number>(0)
  const lastTime     = useRef<number>(0)
  const status       = useRef<GameStatus>('playing')
  const lives        = useRef<number>(3)
  const timeLeft     = useRef<number>(60)
  const stateTimer   = useRef<number>(0)
  const currentStage = useRef<number>(0)
  const score        = useRef<number>(0)
  const startLives   = useRef<number>(3)
  const hitCooldown  = useRef<number>(0)  // 피격 후 무적 시간(초)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    lastTime.current = 0

    function loadStage(stageIndex: number): void {
      const config = STAGES[stageIndex]
      playerRef.current  = createPlayer()
      bubblesRef.current = config.bubbles.map(b => createBubble(b.size, b.x, b.dir))
      blocksRef.current  = config.blocks.map(b => createBlock(b.x, b.y, b.width, b.height))
      wireRef.current    = null
      timeLeft.current   = config.timeLimit
      status.current     = 'playing'
      stateTimer.current = 0
      hitCooldown.current = 0
    }

    function startGame(): void {
      lives.current        = 3
      startLives.current   = 3
      score.current        = 0
      currentStage.current = 0
      loadStage(0)
    }

    startGame()

    const onKeyDown = (e: KeyboardEvent): void => {
      pressedKeys.current.add(e.key)

      if (e.key === ' ' && wireRef.current === null && status.current === 'playing') {
        const p = playerRef.current
        wireRef.current = createWire(p.x, p.y - p.height / 2)
      }
      if ((e.key === 'r' || e.key === 'R') && (status.current === 'gameOver' || status.current === 'missionClear')) {
        startGame()
      }
    }
    const onKeyUp = (e: KeyboardEvent): void => { pressedKeys.current.delete(e.key) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const loop = (timestamp: number): void => {
      const dt = lastTime.current
        ? Math.min((timestamp - lastTime.current) / 1000, 0.05)
        : 0
      lastTime.current = timestamp

      // ── update ──────────────────────────────────────────────
      if (status.current === 'playing') {
        updatePlayer(playerRef.current, pressedKeys.current, dt)
        bubblesRef.current.forEach(b => updateBubble(b, dt, blocksRef.current))

        if (wireRef.current) {
          const reached = updateWire(wireRef.current, dt)
          if (reached) {
            wireRef.current = null
          } else {
            // 와이어 ↔ Block 충돌: 장애물에 막히면 제거
            const wire = wireRef.current
            const blocked = blocksRef.current.some(b =>
              wire.x >= b.x &&
              wire.x <= b.x + b.width &&
              wire.yTop <= b.y + b.height
            )
            if (blocked) wireRef.current = null
          }
        }

        // 와이어 ↔ 버블 충돌
        if (wireRef.current) {
          const wire = wireRef.current
          let hitBubble: Bubble | null = null
          const next: Bubble[] = []
          for (const b of bubblesRef.current) {
            if (!hitBubble && checkWireBubble(wire, b)) {
              hitBubble = b
              next.push(...createSplitBubbles(b))
            } else {
              next.push(b)
            }
          }
          if (hitBubble) {
            score.current += SCORE_BY_SIZE[hitBubble.size]
            wireRef.current = null
          }
          bubblesRef.current = next
        }

        // 피격 무적 시간 감소
        if (hitCooldown.current > 0) hitCooldown.current -= dt

        // 플레이어 ↔ 버블 충돌: 무적 중이 아닐 때만 생명 감소, 스테이지 재시작 없음
        if (hitCooldown.current <= 0 && bubblesRef.current.some(b => checkPlayerBubble(playerRef.current, b))) {
          lives.current -= 1
          if (lives.current <= 0) {
            status.current = 'gameOver'
            stateTimer.current = 0
          } else {
            hitCooldown.current = 2.0
          }
        }

        // 타이머
        timeLeft.current -= dt
        if (timeLeft.current <= 0) {
          lives.current -= 1
          status.current  = lives.current > 0 ? 'dead' : 'gameOver'
          stateTimer.current = 0
        }

        // 스테이지 클리어
        if (bubblesRef.current.length === 0) {
          score.current += Math.floor(timeLeft.current) * TIME_BONUS_PER_SEC
          status.current = 'stageClear'
          stateTimer.current = 0
        }
      } else if (status.current === 'dead') {
        stateTimer.current += dt
        if (stateTimer.current >= DEAD_WAIT) {
          loadStage(currentStage.current)
        }
      } else if (status.current === 'stageClear') {
        stateTimer.current += dt
        if (stateTimer.current >= CLEAR_WAIT) {
          const next = currentStage.current + 1
          if (next >= STAGES.length) {
            score.current += MISSION_CLEAR_BONUS
            if (lives.current >= startLives.current) score.current += NO_MISS_BONUS
            status.current = 'missionClear'
            stateTimer.current = 0
          } else {
            currentStage.current = next
            loadStage(next)
          }
        }
      } else if (status.current === 'missionClear') {
        stateTimer.current += dt
        // MISSION_CLEAR_WAIT 이후에도 R키로만 재시작 (자동 전환 없음)
      }

      // ── render ──────────────────────────────────────────────
      ctx.fillStyle = COLORS.background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = COLORS.floor
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, FLOOR_HEIGHT)

      blocksRef.current.forEach(bl => drawBlock(ctx, bl))
      bubblesRef.current.forEach(b => drawBubble(ctx, b))
      if (wireRef.current) drawWire(ctx, wireRef.current)
      drawPlayer(ctx, playerRef.current)
      drawHUD(ctx, lives.current, timeLeft.current, score.current, currentStage.current + 1)
      drawOverlay(ctx, status.current, score.current)

      rafId.current = requestAnimationFrame(loop)
    }

    rafId.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [canvasRef])
}
