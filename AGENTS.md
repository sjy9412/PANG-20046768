# AGENTS.md

이 파일은 프로젝트 내 문서(docs) 구조와 각 파일의 역할을 기록한다.
AI 에이전트 및 기여자가 관련 문서를 빠르게 찾을 수 있도록 유지한다.

---

## 문서 구조

```
docs/
├── PRD.md                   # 게임 전체 제품 요구사항 정의서
├── PLAN.md                  # Phase별 개발 목표 및 체크리스트
└── FEATURES/
    ├── main.md              # 메인 화면 구성 및 UI 흐름
    ├── game_rule.md         # 게임 공통 룰 (버블, 플레이어, Block, 아이템, 점수)
    └── mission1.md          # Mission 1 난이도 및 스테이지별 규칙
```

---

## 파일별 설명

| 파일 | 내용 요약 |
|------|-----------|
| [docs/PRD.md](docs/PRD.md) | 게임 개요, 핵심 메커닉, 아이템, 점수, UI 구성 등 전체 제품 요구사항 |
| [docs/PLAN.md](docs/PLAN.md) | Phase 1~5로 나눈 개발 목표 및 작업 체크리스트 |
| [docs/FEATURES/main.md](docs/FEATURES/main.md) | 타이틀 로고, 메뉴(1P/HIGH SCORE), 화면 전환 조건 등 메인 화면 전반 |
| [docs/FEATURES/game_rule.md](docs/FEATURES/game_rule.md) | 버블 분열 규칙, 와이어 조작, Block 규칙, 제한 시간, 점수 체계 등 |
| [docs/FEATURES/mission1.md](docs/FEATURES/mission1.md) | Mission 1의 5개 스테이지 구성, 난이도 수치, Block 배치 원칙, 클리어 보상 |

---

## 작성 규칙

- 새로운 기능 문서는 `docs/FEATURES/` 하위에 추가한다.
- 새 파일을 추가하면 이 AGENTS.md의 문서 구조 및 파일별 설명 테이블을 함께 업데이트한다.
- PRD.md는 전체 개요 수준으로 유지하고, 세부 내용은 FEATURES 하위 파일에 작성한다.
