import type { BubbleSize } from '../entities/bubble'

export type BubbleConfig = {
  size: BubbleSize
  x: number
  dir: 1 | -1
}

export type BlockConfig = {
  x: number
  y: number
  width: number
  height: number
}

export type StageConfig = {
  bubbles: BubbleConfig[]
  blocks: BlockConfig[]
  timeLimit: number
}

export const STAGES: StageConfig[] = [
  // Stage 1 — Large 1개, Block 없음
  {
    bubbles: [{ size: 'large', x: 240, dir: 1 }],
    blocks: [],
    timeLimit: 60,
  },
  // Stage 2 — Large 2개, Block 없음
  {
    bubbles: [
      { size: 'large', x: 120, dir:  1 },
      { size: 'large', x: 360, dir: -1 },
    ],
    blocks: [],
    timeLimit: 60,
  },
  // Stage 3 — Large 1개 + Medium 2개, Block 없음
  {
    bubbles: [
      { size: 'large',  x: 240, dir:  1 },
      { size: 'medium', x:  80, dir: -1 },
      { size: 'medium', x: 400, dir:  1 },
    ],
    blocks: [],
    timeLimit: 60,
  },
  // Stage 4 — Large 2개, Block 좌우 대칭
  {
    bubbles: [
      { size: 'large', x: 160, dir:  1 },
      { size: 'large', x: 320, dir: -1 },
    ],
    blocks: [
      { x:  40, y: 440, width: 80, height: 20 },
      { x: 360, y: 440, width: 80, height: 20 },
    ],
    timeLimit: 60,
  },
  // Stage 5 — Large 2개 + Medium 2개, Block 복합 배치
  {
    bubbles: [
      { size: 'large',  x: 120, dir:  1 },
      { size: 'large',  x: 360, dir: -1 },
      { size: 'medium', x: 200, dir: -1 },
      { size: 'medium', x: 280, dir:  1 },
    ],
    blocks: [
      { x: 160, y: 410, width: 160, height: 20 },
      { x:  40, y: 470, width:  80, height: 20 },
    ],
    timeLimit: 60,
  },
]
