import { BUBBLE_SIZES, CANVAS_WIDTH, FLOOR_Y, GRAVITY } from '../constants'
import type { Block } from './block'

export type BubbleSize = 'large' | 'medium' | 'small'

export type Bubble = {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  size: BubbleSize
}

export function createBubble(size: BubbleSize, x: number, direction: 1 | -1 = 1): Bubble {
  const { radius, initialVy, vx } = BUBBLE_SIZES[size]
  return {
    x,
    y: FLOOR_Y - radius,
    radius,
    vx: vx * direction,
    vy: initialVy,
    size,
  }
}

export function createSplitBubbles(hit: Bubble): Bubble[] {
  if (hit.size === 'large')  return [createBubble('medium', hit.x, -1), createBubble('medium', hit.x, 1)]
  if (hit.size === 'medium') return [createBubble('small',  hit.x, -1), createBubble('small',  hit.x, 1)]
  return []
}

export function updateBubble(bubble: Bubble, dt: number, blocks: Block[]): void {
  bubble.vy += GRAVITY * dt
  bubble.x  += bubble.vx * dt
  bubble.y  += bubble.vy * dt

  // 벽 반사
  if (bubble.x - bubble.radius < 0) {
    bubble.x = bubble.radius
    bubble.vx = Math.abs(bubble.vx)
  } else if (bubble.x + bubble.radius > CANVAS_WIDTH) {
    bubble.x = CANVAS_WIDTH - bubble.radius
    bubble.vx = -Math.abs(bubble.vx)
  }

  // 바닥 반사: 속도를 초기값으로 리셋 (에너지 감쇠 없음)
  if (bubble.y + bubble.radius > FLOOR_Y) {
    bubble.y  = FLOOR_Y - bubble.radius
    bubble.vy = -Math.abs(BUBBLE_SIZES[bubble.size].initialVy)
  }

  // Block 윗면 반사
  for (const block of blocks) {
    if (
      bubble.vy > 0 &&
      bubble.y + bubble.radius >= block.y &&
      bubble.y - bubble.radius <= block.y &&
      bubble.x + bubble.radius >  block.x &&
      bubble.x - bubble.radius <  block.x + block.width
    ) {
      bubble.y  = block.y - bubble.radius
      bubble.vy = -Math.abs(BUBBLE_SIZES[bubble.size].initialVy)
    }
  }
}
