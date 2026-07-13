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

## TypeScript 설정

`tsconfig.json`은 앱 코드(`tsconfig.app.json`)와 Vite 설정(`tsconfig.node.json`)을 분리하는 project references 구조를 사용합니다. `noUnusedLocals`, `noUnusedParameters`가 활성화되어 있어 미사용 변수는 컴파일 오류를 발생시킵니다.
