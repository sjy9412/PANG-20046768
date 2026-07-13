import {
  CANVAS_WIDTH,
  FLOOR_Y,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_WIDTH,
} from '../constants'

export type Player = {
  x: number
  y: number
  width: number
  height: number
  vx: number
}

export function createPlayer(): Player {
  return {
    x: CANVAS_WIDTH / 2,
    y: FLOOR_Y - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
  }
}

export function updatePlayer(player: Player, pressedKeys: Set<string>, dt: number): void {
  if (pressedKeys.has('ArrowLeft')) {
    player.vx = -PLAYER_SPEED
  } else if (pressedKeys.has('ArrowRight')) {
    player.vx = PLAYER_SPEED
  } else {
    player.vx = 0
  }

  player.x += player.vx * dt

  const half = player.width / 2
  player.x = Math.max(half, Math.min(CANVAS_WIDTH - half, player.x))
}
