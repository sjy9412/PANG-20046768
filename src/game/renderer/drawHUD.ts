import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS } from '../constants'
import type { GameStatus } from '../types'

export function drawHUD(ctx: CanvasRenderingContext2D, lives: number, timeLeft: number): void {
  ctx.fillStyle = COLORS.hud
  ctx.font = 'bold 18px monospace'

  const hearts = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives))
  ctx.textAlign = 'left'
  ctx.fillText(`LIVES: ${hearts}`, 16, 30)

  ctx.textAlign = 'right'
  ctx.fillText(`TIME: ${Math.ceil(Math.max(0, timeLeft))}`, CANVAS_WIDTH - 16, 30)

  ctx.textAlign = 'left'
}

export function drawOverlay(ctx: CanvasRenderingContext2D, status: GameStatus): void {
  if (status === 'playing') return

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'

  if (status === 'dead') {
    ctx.font = 'bold 48px monospace'
    ctx.fillText('MISS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
  } else if (status === 'stageClear') {
    ctx.font = 'bold 48px monospace'
    ctx.fillText('CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
  } else if (status === 'gameOver') {
    ctx.font = 'bold 48px monospace'
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
    ctx.font = 'bold 20px monospace'
    ctx.fillText('R키로 재시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
  }

  ctx.textAlign = 'left'
}
