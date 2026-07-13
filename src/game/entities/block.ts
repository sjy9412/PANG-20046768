export type Block = {
  x: number
  y: number
  width: number
  height: number
}

export function createBlock(x: number, y: number, width: number, height: number): Block {
  return { x, y, width, height }
}
