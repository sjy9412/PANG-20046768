# Phase 1 설계 문서

## 목표

브라우저에서 게임 화면이 열리고, 플레이어가 좌우로 이동할 수 있으며, 버블이 물리 법칙에 따라 튀어다니는 상태를 구현한다.
아직 공격·분열·승패 판정은 없다. **"움직임이 자연스러운가"** 를 검증하는 단계다.

---

## 1. 파일 구조

```
src/
├── main.tsx                  # 기존 진입점 (변경 없음)
├── App.tsx                   # Game 컴포넌트를 렌더링하도록 수정
└── game/
    ├── Game.tsx              # Canvas + 게임 루프를 담당하는 최상위 컴포넌트
    ├── constants.ts          # 화면 크기, 물리 상수 등 전역 상수
    ├── useGameLoop.ts        # requestAnimationFrame 기반 게임 루프 훅
    ├── entities/
    │   ├── player.ts         # 플레이어 상태 타입 및 업데이트 로직
    │   └── bubble.ts         # 버블 상태 타입 및 물리 업데이트 로직
    └── renderer/
        ├── drawPlayer.ts     # 플레이어 렌더링 함수
        └── drawBubble.ts     # 버블 렌더링 함수
```

---

## 2. 화면(Canvas) 구성

### 크기 및 좌표계

| 항목 | 값 |
|------|----|
| Canvas 너비 | 480px |
| Canvas 높이 | 640px |
| 좌표 원점 | 좌상단 (0, 0) |
| 바닥 y 기준 | `CANVAS_HEIGHT - FLOOR_HEIGHT` |

```
(0,0)─────────────────(480,0)
  │                        │
  │      게임 영역          │
  │                        │
(0,590)────────────(480,590)  ← 바닥
(0,640)────────────(480,640)
```

- `constants.ts`에 `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `FLOOR_HEIGHT` 상수로 정의한다.
- Canvas를 화면 중앙에 배치하고, 배경색은 어두운 단색(#1a1a2e)으로 한다.

---

## 3. 게임 루프 (useGameLoop)

```
브라우저 프레임
    │
    ▼
requestAnimationFrame
    │
    ├─ update(deltaTime)   ← 물리·입력 계산
    └─ render(ctx)         ← Canvas 그리기
```

- `deltaTime`(이전 프레임과의 시간 차, 단위 ms)을 기반으로 이동량을 계산하여 프레임레이트와 무관하게 속도가 일정하도록 한다.
- `useRef`로 게임 상태를 보관하여 렌더링 루프가 React re-render를 유발하지 않도록 한다.

---

## 4. 플레이어 (Player)

### 상태 타입

```ts
type Player = {
  x: number        // 중심 x 좌표
  y: number        // 중심 y 좌표
  width: number    // 충돌 박스 너비
  height: number   // 충돌 박스 높이
  vx: number       // x 방향 속도
}
```

### 이동 규칙

| 항목 | 값 |
|------|----|
| 이동 속도 | 200px/s |
| 초기 위치 | Canvas 하단 중앙 `(CANVAS_WIDTH / 2, FLOOR_Y - height / 2)` |
| 이동 방향 | ← → 방향키 |
| 경계 처리 | 화면 밖으로 나가지 못하도록 x 좌표를 `[0, CANVAS_WIDTH]` 범위로 clamp |

### 입력 처리

- `keydown` / `keyup` 이벤트를 `useEffect`로 등록하고, `pressedKeys` Set으로 현재 눌린 키를 관리한다.
- `update()` 호출 시 `pressedKeys`를 확인하여 `vx`를 결정한다.

---

## 5. 버블 (Bubble)

### 크기 정의

| 크기 | 반지름 | 초기 수직 속도(vy) |
|------|--------|--------------------|
| Large | 32px | -500px/s |
| Medium | 20px | -420px/s |
| Small | 12px | -320px/s |

> Phase 1에서는 Large 버블 1개만 등장한다.

### 상태 타입

```ts
type BubbleSize = 'large' | 'medium' | 'small'

type Bubble = {
  x: number
  y: number
  radius: number
  vx: number       // 수평 속도 (고정값, 방향만 바뀜)
  vy: number       // 수직 속도 (중력에 의해 매 프레임 변화)
  size: BubbleSize
}
```

### 물리 규칙

```
매 프레임:
  vy += GRAVITY * deltaTime     // 중력 적용
  x  += vx * deltaTime
  y  += vy * deltaTime

벽 충돌 (x):
  x < radius      → vx = +|vx|  (오른쪽으로 반사)
  x > WIDTH-radius → vx = -|vx| (왼쪽으로 반사)

바닥 충돌 (y):
  y > FLOOR_Y - radius → vy = -|초기 vy|  (위로 튕김, 속도 고정)
                          y  = FLOOR_Y - radius
```

| 물리 상수 | 값 |
|-----------|-----|
| GRAVITY | 1200px/s² |
| Large vx | ±150px/s |

- 수직 속도는 매번 동일한 초기값으로 리셋(에너지 감쇠 없음)하여 버블이 항상 일정한 높이로 튀도록 한다.
- 수평 속도는 반사 시 방향만 반전, 크기는 유지한다.

---

## 6. 렌더링

매 프레임 순서:

```
1. ctx.clearRect(전체 화면)
2. 바닥 선 그리기
3. 버블 그리기  (원 + 크기별 색상)
4. 플레이어 그리기 (사각형 또는 단순 도형)
```

### 색상 (Phase 1 임시 비주얼)

| 오브젝트 | 색상 |
|----------|------|
| 배경 | #1a1a2e |
| 바닥 | #e0e0e0 |
| 플레이어 | #00d4ff |
| Large 버블 | #ff6b6b |
| Medium 버블 | #ffa94d |
| Small 버블 | #ffd43b |

> Phase 1은 스프라이트 없이 도형으로만 표현한다. 스프라이트 교체는 Phase 4에서 진행한다.

---

## 7. 컴포넌트 연결 흐름

```
App.tsx
  └─ <Game />
       ├─ <canvas ref={canvasRef} />
       └─ useGameLoop(canvasRef)
            ├─ 상태: player, bubbles (useRef)
            ├─ 입력: pressedKeys (useRef)
            ├─ update(dt) → updatePlayer / updateBubbles
            └─ render(ctx) → drawPlayer / drawBubbles
```

---

## 8. 검토 요청 사항

설계를 검토하실 때 아래 항목을 중심으로 봐주시면 좋겠습니다.

1. **파일 구조** — `entities/`, `renderer/` 로 나눈 구조가 Phase 2 이후 확장에 무리가 없는지
2. **물리 상수** — GRAVITY(1200), Large vx(150), Large 초기 vy(-500) 수치가 원하시는 팡 게임 느낌과 맞는지
3. **Canvas 크기** — 480×640이 적절한지 (모바일 세로 비율 기준으로 잡았습니다)
4. **Phase 1 범위** — 버블 1개·도형 비주얼만으로 충분한지, 혹은 추가할 사항이 있는지
