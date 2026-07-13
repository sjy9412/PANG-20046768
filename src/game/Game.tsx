import { useRef } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants'
import { useGameLoop } from './useGameLoop'

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useGameLoop(canvasRef)

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}
