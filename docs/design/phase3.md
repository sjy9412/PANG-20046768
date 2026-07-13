# Phase 3 설계 문서

## 목표

Stage 1부터 Stage 5까지 순서대로 플레이할 수 있는 **Mission 1 전체**가 완성된다.  
스테이지를 클리어하면 자동으로 다음 스테이지로 전환되고, 버블 파괴·시간 보너스·Mission 클리어 보너스를 포함한 점수가 집계된다.  
Stage 5 클리어 시 Mission 클리어 화면이 표시되며, 게임 오버 후 R키로 재시작하면 Stage 1부터 다시 시작한다.

---

## 1. 파일 구조

```
src/game/
├── stages/
│   └── stageData.ts          # ★ 신규 — Stage 1~5 버블·Block 배치 데이터
├── types.ts                  # 수정 — GameStatus에 'missionClear' 추가
├── constants.ts              # 수정 — 점수 상수 추가
├── useGameLoop.ts            # 수정 — 스테이지 전환, 점수 집계, missionClear 처리
└── renderer/
    └── drawHUD.ts            # 수정 — 점수 표시, missionClear 오버레이 추가
```

**변경 없는 파일**: `entities/`, `renderer/draw*.ts` (drawHUD 제외), `Game.tsx`, `App.tsx`

---

## 2. 타입 및 상수 변경

### 2.1 GameStatus 확장 (`types.ts`)

```ts
export type GameStatus =
  | 'playing'
  | 'dead'
  | 'stageClear'
  | 'gameOver'
  | 'missionClear'   // ← 신규
```

### 2.2 점수 상수 추가 (`constants.ts`)

```ts
// 버블 파괴 점수 (PRD: 크기가 클수록 높은 점수)
export const SCORE_BY_SIZE = {
  large:  300,
  medium: 200,
  small:  100,
} as const

// 스테이지 클리어 보너스
export const TIME_BONUS_PER_SEC   = 10    // 남은 시간(초) × 10점
export const MISSION_CLEAR_BONUS  = 5000  // Mission 1 전체 클리어
export const NO_MISS_BONUS        = 3000  // 목숨을 한 번도 소모하지 않은 경우

// 상태 전환 대기 시간 (기존 CLEAR_WAIT 1.5s 유지, 추가 정의)
export const MISSION_CLEAR_WAIT   = 3.0   // seconds
```

---

## 3. 스테이지 데이터 (`stages/stageData.ts`)

### 3.1 타입 정의

```ts
import type { BubbleSize } from '../entities/bubble'

export type BubbleConfig = {
  size: BubbleSize
  x: number      // 초기 x 좌표
  dir: 1 | -1    // 초기 수평 방향 (1=오른쪽, -1=왼쪽)
}

export type BlockConfig = {
  x: number      // Block 좌상단 x
  y: number      // Block 좌상단 y
  width: number
  height: number
}

export type StageConfig = {
  bubbles: BubbleConfig[]
  blocks: BlockConfig[]
  timeLimit: number  // 초 (전 스테이지 동일하게 60초, 추후 조정 가능)
}
```

### 3.2 Stage 1~5 배치 데이터

```
Canvas 좌표계: 너비 480, 높이 640, FLOOR_Y = 590
```

| 스테이지 | 버블 구성 | Block 구성 | 시간 |
|----------|-----------|-----------|------|
| Stage 1  | Large 1개 | 없음 | 60s |
| Stage 2  | Large 2개 | 없음 | 60s |
| Stage 3  | Large 1개 + Medium 2개 | 없음 | 60s |
| Stage 4  | Large 2개 | 좌·우 각 1개 | 60s |
| Stage 5  | Large 2개 + Medium 2개 | 중앙 1개 + 좌측 1개 | 60s |

#### Stage 1 — 기본 조작 학습

```ts
bubbles: [{ size: 'large', x: 240, dir: 1 }]
blocks: []
```

#### Stage 2 — 복수 버블 처리

```ts
bubbles: [
  { size: 'large', x: 120, dir:  1 },
  { size: 'large', x: 360, dir: -1 },
]
blocks: []
```

#### Stage 3 — 혼합 크기

```ts
bubbles: [
  { size: 'large',  x: 240, dir:  1 },
  { size: 'medium', x:  80, dir: -1 },
  { size: 'medium', x: 400, dir:  1 },
]
blocks: []
```

#### Stage 4 — Block 첫 등장 (좌우 대칭)

```ts
bubbles: [
  { size: 'large', x: 160, dir:  1 },
  { size: 'large', x: 320, dir: -1 },
]
blocks: [
  { x:  40, y: 440, width: 80, height: 20 },  // 좌측
  { x: 360, y: 440, width: 80, height: 20 },  // 우측
]
```

#### Stage 5 — Mission 1 최종 관문 (복합 배치)

```ts
bubbles: [
  { size: 'large',  x: 120, dir:  1 },
  { size: 'large',  x: 360, dir: -1 },
  { size: 'medium', x: 200, dir: -1 },
  { size: 'medium', x: 280, dir:  1 },
]
blocks: [
  { x: 160, y: 410, width: 160, height: 20 },  // 중앙 (넓음)
  { x:  40, y: 470, width:  80, height: 20 },  // 좌측 (낮음)
]
```

---

## 4. 스테이지 전환 로직 (`useGameLoop.ts`)

### 4.1 추가되는 상태 Ref

```ts
const currentStage = useRef<number>(0)   // 0-indexed (0 = Stage 1)
const score        = useRef<number>(0)
const initialLives = useRef<number>(3)   // 노미스 보너스 판정용
```

### 4.2 resetStage 확장

```ts
function loadStage(stageIndex: number): void {
  const config = STAGES[stageIndex]
  playerRef.current  = createPlayer()
  bubblesRef.current = config.bubbles.map(b => createBubble(b.size, b.x, b.dir))
  blocksRef.current  = config.blocks.map(b => createBlock(b.x, b.y, b.width, b.height))
  wireRef.current    = null
  timeLeft.current   = config.timeLimit
  status.current     = 'playing'
}
```

> Phase 2에서 `STAGE_BLOCKS`는 파일 레벨 상수였지만, Phase 3에서는 `blocksRef`를 도입하여 스테이지마다 Block이 달라지도록 변경한다.

### 4.3 stageClear 처리 확장

```ts
// 기존: stageClear 후 → resetStage() (같은 스테이지 재시작)
// 변경: stageClear 후 → 다음 스테이지 or missionClear

if (stateTimer.current >= CLEAR_WAIT) {
  const next = currentStage.current + 1
  if (next >= STAGES.length) {
    score.current += MISSION_CLEAR_BONUS
    if (lives.current === initialLives.current) score.current += NO_MISS_BONUS
    status.current = 'missionClear'
  } else {
    currentStage.current = next
    loadStage(next)
  }
}
```

### 4.4 점수 집계

버블 파괴 시 (와이어 충돌 처리 직후):
```ts
if (hit) {
  score.current += SCORE_BY_SIZE[hitBubble.size]
  wireRef.current = null
}
```

스테이지 클리어 시 (버블 0개 감지 직후):
```ts
if (bubblesRef.current.length === 0) {
  score.current += Math.floor(timeLeft.current) * TIME_BONUS_PER_SEC
  status.current = 'stageClear'
  stateTimer.current = 0
}
```

### 4.5 gameOver 재시작 변경

```ts
// 기존: lives=3, resetStage() (같은 스테이지)
// 변경: lives=3, score=0, currentStage=0, loadStage(0) (Stage 1부터)

if ((e.key === 'r' || e.key === 'R') && status.current === 'gameOver') {
  lives.current = 3
  score.current = 0
  currentStage.current = 0
  loadStage(0)
}
```

missionClear 후 재시작도 동일하게 R키로 처리한다.

---

## 5. HUD 및 오버레이 수정 (`renderer/drawHUD.ts`)

### 5.1 drawHUD 시그니처 변경

```ts
// 기존
drawHUD(ctx, lives, timeLeft)

// 변경 (score, stage 추가)
drawHUD(ctx, lives, timeLeft, score, stage)
```

HUD 레이아웃 (상단 바):

```
[♥ ♥ ♥]   STAGE 1   00:45   1200pt
```

| 요소 | 위치 | 표시 형식 |
|------|------|----------|
| 목숨 | 좌측 | ♥ 아이콘 × lives |
| 스테이지 | 중앙 | `STAGE N` |
| 남은 시간 | 우측-중 | `MM:SS` or 정수 초 |
| 점수 | 우측 | `NNNNpt` |

### 5.2 drawOverlay 확장

```ts
// 기존: 'dead' | 'stageClear' | 'gameOver' 처리
// 추가: 'missionClear' 처리

case 'missionClear':
  // 반투명 오버레이
  // "MISSION CLEAR!" 대형 텍스트
  // 최종 점수 표시
  // "Press R to Restart" 안내
```

---

## 6. 흐름 다이어그램

```
게임 시작
    │
    ▼
loadStage(0) ─── Stage 1 플레이
    │ 클리어
    ▼
loadStage(1) ─── Stage 2 플레이
    │ 클리어
    ▼
  ...
    │
loadStage(4) ─── Stage 5 플레이
    │ 클리어
    ▼
missionClear 화면
    │ R키
    ▼
loadStage(0) (처음부터)

※ 어느 스테이지에서든 목숨 0 → gameOver 화면 → R키 → loadStage(0)
※ 피격/타임오버 → 목숨 감소 → dead 상태(0.8s) → 같은 스테이지 재시작
```

---

## 8. 수정 사항 (구현 중 반영)

### 8.1 버블 반사 높이 상향 (`constants.ts`)

초기 구현에서 버블이 바닥에서 튕길 때 너무 낮게 올라오는 문제가 확인되어 `initialVy` 값을 상향했다.  
바닥·Block 반사 시 `vy`를 `initialVy`로 리셋하는 구조이므로, 이 값이 곧 매 반사의 최대 높이를 결정한다.

| 크기 | 변경 전 | 변경 후 | 반사 최대 높이 (GRAVITY=1200 기준) |
|------|---------|---------|----------------------------------|
| large  | -500 | -900 | 약 338px (바닥 기준) |
| medium | -420 | -720 | 약 216px |
| small  | -320 | -560 | 약 130px |

### 8.2 버블 피격 시 재시작 제거 (`useGameLoop.ts`)

피격 시 `'dead'` 상태로 스테이지를 재시작하는 대신, 생명만 감소하고 2초간 무적 상태를 부여하는 방식으로 변경했다.  
타임오버(시간 초과)는 기존대로 `'dead'` 상태를 거쳐 스테이지를 재시작한다.

| 이벤트 | 변경 전 | 변경 후 |
|--------|---------|---------|
| 버블 피격 | 생명 감소 → `'dead'` (0.8s 후 재시작) | 생명 감소 → 2초 무적, 스테이지 유지 |
| 타임오버 | 생명 감소 → `'dead'` (재시작) | 변경 없음 |

구현: `hitCooldown` ref(초)를 추가하여 양수인 동안 피격 판정을 건너뜀.

### 8.3 와이어가 Block을 통과하지 못하도록 수정 (`useGameLoop.ts`)

와이어 끝(yTop)이 Block의 하단(b.y + b.height) 이하로 진입하면 와이어를 즉시 제거한다.  
조건: `wire.x ∈ [b.x, b.x + b.width]` AND `wire.yTop <= b.y + b.height`

---

## 7. 검토 요청 사항

1. **Block 좌표** — Stage 4·5의 Block y좌표(440, 410, 470)가 버블 반사 난이도 측면에서 적절한지. 너무 낮으면 플레이어 동선과 겹치고, 너무 높으면 버블이 닿지 않을 수 있습니다.

2. **Stage 3 버블 배치** — Medium 2개가 처음부터 등장하는 구성이 Stage 2(Large 2개)보다 어렵게 느껴질 수 있습니다. Medium 대신 Large + Large → Medium 순서로 배치를 조정할지 여부.

3. **점수 수치** — `Large=300, Medium=200, Small=100`, `시간보너스 10pt/s`, `미션클리어 5000pt`, `노미스 3000pt`가 적절한지. 전체 퍼펙트 클리어 시 대략 `(300+200+200+100+100+100)×5스테이지 + 시간보너스 + 미션보너스` 기준으로 검토 부탁드립니다.

4. **노미스 보너스 조건** — 현재는 "시작 시 목숨 수와 동일하면 보너스"로 판정합니다. 스테이지 중 피격 후 재시작이 없어야 한다는 조건이 맞는지 확인 부탁드립니다.

5. **missionClear 대기 시간** — 3.0초 후 R키로만 재시작하는 방식으로 할지, 일정 시간 후 자동으로 돌아갈지 결정이 필요합니다.
