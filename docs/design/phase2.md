# Phase 2 설계 문서

## 목표

Space 키로 와이어를 발사해 버블을 분열·소멸시킬 수 있고, Block에 버블이 반사되며, 피격·시간초과 시 목숨이 줄고, 버블을 전부 제거하면 클리어가 표시되는 상태를 구현한다.
Phase 1의 코드 위에 기능을 추가하며, **"게임의 기본 규칙이 올바르게 동작하는가"** 를 검증하는 단계다.

---

## 1. 파일 구조

Phase 1에서 추가/변경되는 파일만 표시한다.

```
src/game/
├── constants.ts          # WIRE_SPEED, STAGE_TIME, Block 색상 상수 추가
├── useGameLoop.ts        # 게임 상태 관리 및 전체 로직 통합 (대폭 수정)
├── entities/
│   ├── bubble.ts         # createSplitBubbles, Block 충돌 처리 추가
│   ├── wire.ts           # [신규] 와이어 타입·생성·업데이트
│   └── block.ts          # [신규] Block 타입·생성
└── renderer/
    ├── drawWire.ts       # [신규] 와이어 렌더링
    ├── drawBlock.ts      # [신규] Block 렌더링
    └── drawHUD.ts        # [신규] 목숨·타이머 HUD 렌더링
```

---

## 2. 게임 상태 (GameStatus)

루프 안에서 상태에 따라 update/render 흐름을 분기한다.

```ts
type GameStatus =
  | 'playing'    // 정상 플레이 중
  | 'dead'       // 피격 직후 0.8초 대기 후 스테이지 재시작
  | 'stageClear' // 버블 전부 제거 — "CLEAR" 표시 후 1.5초 대기
  | 'gameOver'   // 목숨 0 — "GAME OVER" 표시, 재시작 안내
```

### 상태 전환 다이어그램

```
playing ──→ dead ──(목숨 > 0)──→ playing (스테이지 재시작)
   │          └─(목숨 = 0)──→ gameOver
   └──→ stageClear ──→ playing (스테이지 재시작)

gameOver ──(R키)──→ playing (목숨 3으로 초기화)
```

### useGameLoop 상태 ref 추가

```ts
const status    = useRef<GameStatus>('playing')
const lives     = useRef<number>(3)
const timeLeft  = useRef<number>(STAGE_TIME)   // 60초
const stateTimer = useRef<number>(0)           // dead/clear 대기 시간 측정
```

---

## 3. 와이어 (Wire)

### 타입

```ts
type Wire = {
  x: number       // 발사 시 플레이어의 중심 x (고정)
  yBottom: number // 플레이어 상단 y (고정)
  yTop: number    // 매 프레임 위로 올라감
}
```

### 동작 규칙

```
발사 조건: Space 키 입력 AND 현재 wire가 없을 때

매 프레임:
  wire.yTop -= WIRE_SPEED * dt

소멸 조건:
  1. wire.yTop <= 0 (천장 도달)
  2. 버블과 충돌
```

| 상수 | 값 |
|------|----|
| WIRE_SPEED | 800 px/s |

### 버블 충돌 판정

와이어는 `x = wire.x` 인 수직 선분 `[yTop, yBottom]` 이다.

```
버블 (bx, by, br)과의 충돌:
  조건: |wire.x - bx| <= br
        AND wire.yTop  <= by + br
        AND wire.yBottom >= by - br
→ 충돌 시: 버블 분열 처리, wire 제거
```

### 렌더링

```
선 색상: #ffffff
선 두께: 3px
ctx.beginPath()
ctx.moveTo(wire.x, wire.yBottom)
ctx.lineTo(wire.x, wire.yTop)
ctx.stroke()

선단(tip) 삼각형: 와이어 끝에 작은 삼각형(▲) 표시
```

---

## 4. 버블 분열 (createSplitBubbles)

```ts
// bubble.ts에 추가
function createSplitBubbles(hit: Bubble): Bubble[] {
  if (hit.size === 'large')  return [createBubble('medium', hit.x, -1), createBubble('medium', hit.x, 1)]
  if (hit.size === 'medium') return [createBubble('small',  hit.x, -1), createBubble('small',  hit.x, 1)]
  return [] // small은 소멸
}
```

- 분열된 버블은 충돌 지점의 x에서 시작하고, 좌(-1)·우(1) 방향으로 퍼진다.
- 분열된 버블의 초기 y는 바닥 기준(`FLOOR_Y - radius`)으로 설정하여 화면 밖으로 나가지 않도록 한다.

---

## 5. Block

### 타입

```ts
type Block = {
  x: number      // 좌측 상단 x
  y: number      // 좌측 상단 y
  width: number
  height: number
}
```

### 버블-Block 충돌 처리

bubble.ts의 `updateBubble`에 Block 배열을 인자로 추가한다.

```
updateBubble(bubble, dt, blocks):
  ... (기존 물리 계산)

  for each block:
    버블 아랫부분이 block 위면을 통과하면:
      조건: bubble.y + bubble.r >= block.y
            AND bubble.y - bubble.r <= block.y          // 윗면 근처에서만
            AND bubble.x + bubble.r > block.x
            AND bubble.x - bubble.r < block.x + block.w

      처리: bubble.y = block.y - bubble.r
            bubble.vy = -|BUBBLE_SIZES[bubble.size].initialVy|
```

### Phase 2 테스트용 Block 배치

Stage 1에는 Block 없이 시작하되, 로직 검증을 위해 임시로 Block 1개를 배치한다.

| 항목 | 값 |
|------|----|
| x | 160 |
| y | 420 |
| width | 160 |
| height | 20 |
| 색상 | #4a9eff |

---

## 6. 피격 판정 (플레이어 ↔ 버블)

```
AABB-원 충돌:
  플레이어 rect: (px - w/2, py - h/2, w, h)
  버블 circle:  (bx, by, br)

  nearX = clamp(bx, px - w/2, px + w/2)
  nearY = clamp(by, py - h/2, py + h/2)
  dist² = (bx - nearX)² + (by - nearY)²
  충돌: dist² < br²
```

충돌 시:
- `lives.current -= 1`
- `status.current = lives.current > 0 ? 'dead' : 'gameOver'`
- `stateTimer.current = 0`

### 분열 버블 스폰 위치 (버그 수정)

**문제**: `createBubble`은 항상 `y = FLOOR_Y - radius`(바닥)에서 버블을 생성한다.
플레이어도 바닥에 위치하므로 분열 버블이 플레이어와 동일한 y 위치에 겹쳐 생성되어 즉시 피격된다.
타이머 방식은 분열 직후는 막더라도, 만료 시점에 버블이 다시 바닥으로 내려와 또 즉시 피격되는 문제가 반복된다.

**해결**: 분열 버블을 바닥이 아닌 **피격 버블의 위쪽**에서 생성한다.
자식 버블의 스폰 y를 `hit.y - hit.radius - childRadius`로 설정하면,
자식 버블이 플레이어 머리 위에서 시작해 위로 튀어 오르므로 즉시 충돌이 발생하지 않는다.

```
spawnY = hit.y - hit.radius - childRadius   // 피격 버블 바로 위
spawnY = Math.max(spawnY, childRadius)      // 화면 상단 이탈 방지

예시 (바닥에 있는 Large 버블 → Medium 분열):
  hit.y = 558 (= FLOOR_Y - 32)
  spawnY = 558 - 32 - 20 = 506
  플레이어 y = 570, 플레이어 상단 = 550
  버블 하단 = 506 + 20 = 526  →  526 < 550  →  충돌 없음 ✓
```

---

## 7. 제한 시간

```
playing 상태에서만 감소:
  timeLeft.current -= dt

  if timeLeft.current <= 0:
    lives.current -= 1
    status.current = lives.current > 0 ? 'dead' : 'gameOver'
    stateTimer.current = 0
```

---

## 8. 스테이지 재시작 함수

dead / stageClear 상태에서 대기 시간이 지나면 호출한다.

```ts
function resetStage() {
  playerRef.current  = createPlayer()
  bubblesRef.current = [createBubble('large', CANVAS_WIDTH / 3, 1)]
  wireRef.current    = null
  timeLeft.current   = STAGE_TIME
  status.current     = 'playing'
}
```

---

## 9. HUD 렌더링 (drawHUD)

Canvas 상단에 목숨과 타이머를 텍스트로 표시한다.

```
위치: y = 30 (상단 여백)
목숨: "LIVES: ♥ ♥ ♥"  (좌측)
시간: "TIME: 60"       (우측)
글꼴: bold 18px monospace
색상: #ffffff
```

### 상태별 오버레이

| 상태 | 표시 텍스트 | 위치 |
|------|------------|------|
| dead | "MISS" | 화면 중앙 |
| stageClear | "CLEAR!" | 화면 중앙 |
| gameOver | "GAME OVER\nR키로 재시작" | 화면 중앙 |

---

## 10. 렌더링 순서 (Phase 2)

```
1. 배경 clear
2. Block 그리기
3. 버블 그리기
4. 와이어 그리기
5. 플레이어 그리기
6. HUD 그리기 (목숨, 타이머)
7. 상태 오버레이 그리기 (dead/clear/gameOver)
```

---

## 11. 검토 요청 사항

1. **와이어 속도** — WIRE_SPEED 800px/s가 적절한지 (너무 빠르거나 느리면 조정 가능)
2. **dead 대기 시간** — 피격 후 0.8초 대기가 적절한지
3. **분열 버블 시작 위치** — 분열 시 새 버블을 `FLOOR_Y - radius` 에서 시작하는 방식이 자연스러운지, 아니면 피격 버블의 y 위치에서 시작해야 하는지
4. **Block 배치** — Phase 2에서 Block을 포함해 테스트할지, 아니면 Stage 1(Block 없음)만으로 검증할지
