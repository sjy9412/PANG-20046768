import { COLORS } from '../constants'
import type { Player } from '../entities/player'

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  ctx.fillStyle = COLORS.player
  ctx.fillRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height,
  )
}
