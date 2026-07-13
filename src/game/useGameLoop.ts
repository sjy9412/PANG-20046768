import { RefObject, useEffect, useRef } from 'react'
import {
  CANVAS_HEIGHT, CANVAS_WIDTH, CLEAR_WAIT, COLORS,
  DEAD_WAIT, FLOOR_HEIGHT, FLOOR_Y, STAGE_TIME,
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
import type { GameStatus } from './types'

const STAGE_BLOCKS: Block[] = [createBlock(160, 420, 160, 20)]

function stageBubbles(): Bubble[] {
  return [createBubble('large', CANVAS_WIDTH / 3, 1)]
}

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
  const playerRef   = useRef<Player>(createPlayer())
  const bubblesRef  = useRef<Bubble[]>(stageBubbles())
  const wireRef     = useRef<Wire | null>(null)
  const pressedKeys = useRef<Set<string>>(new Set())
  const rafId       = useRef<number>(0)
  const lastTime    = useRef<number>(0)
  const status     = useRef<GameStatus>('playing')
  const lives      = useRef<number>(3)
  const timeLeft   = useRef<number>(STAGE_TIME)
  const stateTimer = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    lastTime.current = 0

    function resetStage(): void {
      playerRef.current  = createPlayer()
      bubblesRef.current = stageBubbles()
      wireRef.current  = null
      timeLeft.current = STAGE_TIME
      status.current   = 'playing'
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      pressedKeys.current.add(e.key)

      if (e.key === ' ' && wireRef.current === null && status.current === 'playing') {
        const p = playerRef.current
        wireRef.current = createWire(p.x, p.y - p.height / 2)
      }
      if ((e.key === 'r' || e.key === 'R') && status.current === 'gameOver') {
        lives.current = 3
        resetStage()
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
        bubblesRef.current.forEach(b => updateBubble(b, dt, STAGE_BLOCKS))

        // 와이어 이동
        if (wireRef.current) {
          const reached = updateWire(wireRef.current, dt)
          if (reached) wireRef.current = null
        }

        // 와이어 ↔ 버블 충돌
        if (wireRef.current) {
          const wire = wireRef.current
          let hit = false
          const next: Bubble[] = []
          for (const b of bubblesRef.current) {
            if (!hit && checkWireBubble(wire, b)) {
              hit = true
              next.push(...createSplitBubbles(b))
            } else {
              next.push(b)
            }
          }
          if (hit) wireRef.current = null
          bubblesRef.current = next
        }

        // 플레이어 ↔ 버블 충돌
        if (bubblesRef.current.some(b => checkPlayerBubble(playerRef.current, b))) {
          lives.current -= 1
          status.current  = lives.current > 0 ? 'dead' : 'gameOver'
          stateTimer.current = 0
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
          status.current = 'stageClear'
          stateTimer.current = 0
        }
      } else if (status.current === 'dead') {
        stateTimer.current += dt
        if (stateTimer.current >= DEAD_WAIT) resetStage()
      } else if (status.current === 'stageClear') {
        stateTimer.current += dt
        if (stateTimer.current >= CLEAR_WAIT) resetStage()
      }

      // ── render ──────────────────────────────────────────────
      ctx.fillStyle = COLORS.background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = COLORS.floor
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, FLOOR_HEIGHT)

      STAGE_BLOCKS.forEach(bl => drawBlock(ctx, bl))
      bubblesRef.current.forEach(b => drawBubble(ctx, b))
      if (wireRef.current) drawWire(ctx, wireRef.current)
      drawPlayer(ctx, playerRef.current)
      drawHUD(ctx, lives.current, timeLeft.current)
      drawOverlay(ctx, status.current)

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
