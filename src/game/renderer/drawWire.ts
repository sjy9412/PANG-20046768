import { COLORS } from '../constants'
import type { Wire } from '../entities/wire'

export function drawWire(ctx: CanvasRenderingContext2D, wire: Wire): void {
  ctx.strokeStyle = COLORS.wire
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(wire.x, wire.yBottom)
  ctx.lineTo(wire.x, wire.yTop)
  ctx.stroke()

  // 선단 삼각형 (▲)
  ctx.fillStyle = COLORS.wire
  ctx.beginPath()
  ctx.moveTo(wire.x, wire.yTop - 8)
  ctx.lineTo(wire.x - 5, wire.yTop)
  ctx.lineTo(wire.x + 5, wire.yTop)
  ctx.closePath()
  ctx.fill()
}
