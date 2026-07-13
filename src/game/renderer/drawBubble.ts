import { COLORS } from '../constants'
import type { Bubble, BubbleSize } from '../entities/bubble'

const BUBBLE_COLOR: Record<BubbleSize, string> = {
  large:  COLORS.bubbleLarge,
  medium: COLORS.bubbleMedium,
  small:  COLORS.bubbleSmall,
}

export function drawBubble(ctx: CanvasRenderingContext2D, bubble: Bubble): void {
  ctx.beginPath()
  ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
  ctx.fillStyle = BUBBLE_COLOR[bubble.size]
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 2
  ctx.stroke()
}
