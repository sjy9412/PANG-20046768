import { WIRE_SPEED } from '../constants'

export type Wire = {
  x: number
  yBottom: number
  yTop: number
}

export function createWire(x: number, yBottom: number): Wire {
  return { x, yBottom, yTop: yBottom }
}

// true 반환 시 천장 도달 → 호출 측에서 제거
export function updateWire(wire: Wire, dt: number): boolean {
  wire.yTop -= WIRE_SPEED * dt
  return wire.yTop <= 0
}
