export const CANVAS_WIDTH = 480
export const CANVAS_HEIGHT = 640
export const FLOOR_HEIGHT = 50
export const FLOOR_Y = CANVAS_HEIGHT - FLOOR_HEIGHT

export const GRAVITY = 1200 // px/s²

export const PLAYER_WIDTH = 30
export const PLAYER_HEIGHT = 40
export const PLAYER_SPEED = 200 // px/s

export const BUBBLE_SIZES = {
  large:  { radius: 32, initialVy: -500, vx: 150 },
  medium: { radius: 20, initialVy: -420, vx: 200 },
  small:  { radius: 12, initialVy: -320, vx: 250 },
} as const

export const WIRE_SPEED = 800  // px/s
export const STAGE_TIME = 60   // seconds
export const DEAD_WAIT  = 0.8  // seconds
export const CLEAR_WAIT = 1.5  // seconds

export const COLORS = {
  background:   '#1a1a2e',
  floor:        '#e0e0e0',
  player:       '#00d4ff',
  bubbleLarge:  '#ff6b6b',
  bubbleMedium: '#ffa94d',
  bubbleSmall:  '#ffd43b',
  wire:         '#ffffff',
  block:        '#4a9eff',
  hud:          '#ffffff',
} as const
