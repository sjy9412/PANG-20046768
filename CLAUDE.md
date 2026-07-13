# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기술 스택

- **프레임워크**: React 19
- **번들러**: Vite 6
- **언어**: TypeScript 5.8 (strict 모드)
- **린터**: ESLint 9 (flat config)

## 주요 명령어

```bash
npm run dev       # 개발 서버 실행 (HMR 포함)
npm run build     # 타입 체크 후 프로덕션 빌드 (tsc -b && vite build)
npm run lint      # ESLint 실행
npm run preview   # 빌드 결과물 로컬 프리뷰
```

## 테스트 방법

현재 테스트 프레임워크가 설정되어 있지 않습니다. 테스트를 추가하려면 Vitest를 권장합니다:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

`vite.config.ts`에 다음을 추가합니다:

```ts
test: {
  environment: 'jsdom',
  globals: true,
}
```

단일 테스트 실행: `npx vitest run src/파일명.test.tsx`

## 아키텍처

- `src/main.tsx` — 앱 진입점. `#root` DOM 요소에 `<App />`을 StrictMode로 마운트합니다.
- `src/App.tsx` — 루트 컴포넌트.

## 문서 구조

프로젝트 문서는 `docs/` 하위에 역할별로 분리하여 관리한다.

```
docs/
├── PRD.md                  # 게임 전체 제품 요구사항 정의서
├── PLAN.md                 # Phase별 개발 목표 및 고객 확인 포인트
├── FEATURES/               # 기능 단위 상세 명세
│   ├── main.md             # 메인 화면 구성
│   ├── game_rule.md        # 게임 공통 룰
│   └── mission1.md         # Mission 1 난이도 및 스테이지 규칙
└── design/                 # Phase별 구현 설계 문서
    └── phase1.md           # Phase 1 설계 (Canvas, 플레이어, 버블 물리)
```

### 설계 문서 작성 규칙 (docs/design/)

- Phase가 시작되기 전 반드시 `docs/design/phaseN.md`를 먼저 작성하고 고객 검토를 받은 뒤 구현한다.
- 각 설계 문서는 아래 섹션을 포함한다:
  1. **목표** — 이 Phase가 끝났을 때 동작하는 것
  2. **파일 구조** — 새로 생성·수정될 파일 목록
  3. **핵심 타입 및 로직** — 주요 데이터 구조와 알고리즘
  4. **검토 요청 사항** — 고객에게 판단을 요청하는 항목 (수치, 범위, 우선순위 등)
- 설계 변경이 발생하면 해당 `phaseN.md`를 직접 수정하여 항상 최신 상태를 유지한다.
- 완료된 Phase의 설계 문서는 삭제하지 않고 보존한다 (이후 Phase 설계 시 참고용).

## TypeScript 설정

`tsconfig.json`은 앱 코드(`tsconfig.app.json`)와 Vite 설정(`tsconfig.node.json`)을 분리하는 project references 구조를 사용합니다. `noUnusedLocals`, `noUnusedParameters`가 활성화되어 있어 미사용 변수는 컴파일 오류를 발생시킵니다.
