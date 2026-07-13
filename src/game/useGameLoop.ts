import { RefObject, useEffect, useRef } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, FLOOR_HEIGHT, FLOOR_Y } from './constants'
import { Bubble, createBubble, updateBubble } from './entities/bubble'
import { Player, createPlayer, updatePlayer } from './entities/player'
import { drawBubble } from './renderer/drawBubble'
import { drawPlayer } from './renderer/drawPlayer'

export function useGameLoop(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  const playerRef   = useRef<Player>(createPlayer())
  const bubblesRef  = useRef<Bubble[]>([createBubble('large', CANVAS_WIDTH / 3, 1)])
  const pressedKeys = useRef<Set<string>>(new Set())
  const rafId       = useRef<number>(0)
  const lastTime    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    lastTime.current = 0

    const onKeyDown = (e: KeyboardEvent) => pressedKeys.current.add(e.key)
    const onKeyUp   = (e: KeyboardEvent) => pressedKeys.current.delete(e.key)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const loop = (timestamp: number) => {
      const dt = lastTime.current
        ? Math.min((timestamp - lastTime.current) / 1000, 0.05)
        : 0
      lastTime.current = timestamp

      // --- update ---
      updatePlayer(playerRef.current, pressedKeys.current, dt)
      bubblesRef.current.forEach(b => updateBubble(b, dt))

      // --- render ---
      ctx.fillStyle = COLORS.background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = COLORS.floor
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, FLOOR_HEIGHT)

      bubblesRef.current.forEach(b => drawBubble(ctx, b))
      drawPlayer(ctx, playerRef.current)

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
