import { COLORS } from '../constants'
import type { Block } from '../entities/block'

export function drawBlock(ctx: CanvasRenderingContext2D, block: Block): void {
  ctx.fillStyle = COLORS.block
  ctx.fillRect(block.x, block.y, block.width, block.height)
}
