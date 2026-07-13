import { BUBBLE_SIZES, CANVAS_WIDTH, FLOOR_Y, GRAVITY } from '../constants'

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

export function updateBubble(bubble: Bubble, dt: number): void {
  bubble.vy += GRAVITY * dt
  bubble.x += bubble.vx * dt
  bubble.y += bubble.vy * dt

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
    bubble.y = FLOOR_Y - bubble.radius
    bubble.vy = -Math.abs(BUBBLE_SIZES[bubble.size].initialVy)
  }
}
