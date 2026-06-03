# Balance Island × Obsidian AI 업무 위키 계획서
> **문서 상태:** 기획 단계 (실행 대기)  
> **최종 수정일:** 2026-06-03  
> **인코딩 형식:** UTF-8  
> **문서 전체 경로:** `c:\Users\petbl\balance\balance-island\docs\2026-06-03-obsidian-integration-plan.md`

---

## 목차

1. [서론 및 목표](#1-서론-및-목표)
2. [Karpathy LLM Wiki 원본 gist 분석](#2-karpathy-llm-wiki-원본-gist-분석)
3. [AI-Agent-Wiki-Template v1.0.0 분석](#3-ai-agent-wiki-template-v100-분석)
4. [Balance Island 프로젝트 매핑 — 폴더 구조 설계](#4-balance-island-프로젝트-매핑--폴더-구조-설계)
5. [CLAUDE.md — Claude Code / Antigravity용 규칙](#5-claudemd--claude-code--antigravity용-규칙)
6. [AGENTS.md — Codex / 기타 에이전트용 규칙](#6-agentsmd--codex--기타-에이전트용-규칙)
7. [index.md — 볼트 지도](#7-indexmd--볼트-지도)
8. [log.md — 시간순 작업 기록](#8-logmd--시간순-작업-기록)
9. [자연어 명령 체계 — save, ingest, query, lint, reference](#9-자연어-명령-체계--save-ingest-query-lint-reference)
10. [한글/영문 하이브리드 세팅 규칙](#10-한글영문-하이브리드-세팅-규칙)
11. [Raw ↔ Wiki 분리 원칙과 Save Filter](#11-raw--wiki-분리-원칙과-save-filter)
12. [lint 명령의 5가지 점검 항목](#12-lint-명령의-5가지-점검-항목)
13. [기존 프로젝트 파일 마이그레이션 계획](#13-기존-프로젝트-파일-마이그레이션-계획)
14. [옵시디언 시각 도구 활용 — Graph View, Canvas, Dataview](#14-옵시디언-시각-도구-활용--graph-view-canvas-dataview)
15. [단계별 실행 절차](#15-단계별-실행-절차)
16. [기대 효과](#16-기대-효과)

---

## 1. 서론 및 목표

### 배경

본 계획서는 아래 3개 소스를 통합 분석하여 작성합니다.

| # | 소스 | 설명 |
|---|------|------|
| 1 | [Karpathy LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Andrej Karpathy가 2026-04-04에 공개한 LLM Wiki 패턴 원본 |
| 2 | `AI-Agent-Wiki-Template-v1.0.0.zip` | 김효율의 AI 개발단이 제공하는 옵시디언 업무 위키 템플릿 |
| 3 | 유저 첨부 이미지 4장 | 사용자의 구체적인 세팅 요구사항 (Save Filter, Hybrid, lint, Raw/Wiki 분리) |

### 핵심 목표

> **개인 메모장이 아니라, 회사 실무에서 여러 AI 에이전트가 같은 업무 맥락을 공유하는 비즈니스 프로세스를 만드는 것.**

구체적으로:
1. 에이전트가 세션마다 일관되게 실행할 수 있는 **업무 시스템**을 구축한다.
2. `save`, `ingest`, `query`, `lint`, `reference` 등의 **자연어 명령**을 등록하여 사용자가 매 세션마다 명령을 입력하면 저장과 참조가 자동화된다.
3. **Raw 영역과 Wiki 영역을 명확히 분리**하고, 저장 시 반드시 **5가지 필터를 통과**하도록 규칙을 설계한다.
4. 사용자가 직접 폴더와 규칙 파일을 만들지 않도록 **각 파일의 용도를 설명**하고, 필요한 수정과 보강 사항을 명확히 제시한다.

---

## 2. Karpathy LLM Wiki 원본 gist 분석

> *출처: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f*

### 2.1. 핵심 아이디어: RAG vs LLM Wiki

| 구분 | RAG (기존) | LLM Wiki (카파시 제안) |
|------|-----------|----------------------|
| 동작 | 질문마다 원본에서 청크를 검색·생성 | 원본을 읽고 위키에 **미리 합성·교차참조** |
| 지식 축적 | 없음 (매번 재발견) | **복리로 누적** (compounding artifact) |
| 유지보수 | 사람 의존 → 방치 | LLM이 전담 → 유지비용 ≈ 0 |
| 인간 역할 | 질문자 | **소스 큐레이터 + 탐험가** |
| LLM 역할 | 답변기 | **요약·교차참조·파일링·기록 유지 운영자** |

### 2.2. 3-Layer 아키텍처 (원본 그대로)

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Raw Sources (원천 자료)                  │
│  ─ 불변(immutable), LLM은 읽기만 수행              │
│  ─ 기사, 논문, 회의록, 피드백, 화면캡처 설명          │
├─────────────────────────────────────────────────┤
│  Layer 2: Wiki (LLM 생성/관리 마크다운)             │
│  ─ 요약 페이지, 엔티티 페이지, 개념 페이지, 비교표    │
│  ─ LLM이 전적으로 소유하고 생성·갱신·교차참조 유지    │
│  ─ 사용자는 읽기, LLM은 쓰기                       │
├─────────────────────────────────────────────────┤
│  Layer 3: Schema (CLAUDE.md / AGENTS.md)         │
│  ─ 위키 구조, 컨벤션, 워크플로우 정의               │
│  ─ LLM을 "규율 있는 위키 관리자"로 만드는 설정 파일  │
│  ─ 사용자와 LLM이 함께 진화시킴                    │
└─────────────────────────────────────────────────┘
```

### 2.3. 4가지 핵심 오퍼레이션

1. **Ingest** — raw에 새 소스를 넣으면 LLM이 읽고, 요약 페이지 작성, 인덱스 갱신, 관련 엔티티/개념 페이지 10~15개 교차 업데이트.
2. **Query** — 위키를 검색해 답변 합성. 좋은 답변은 다시 위키에 신규 페이지로 저장하여 탐험도 복리 축적.
3. **Lint** — 페이지 간 모순, 최신 소스에 의해 대체된 오래된 주장, 고아 페이지, 빠진 교차참조, 데이터 갭 점검.
4. **Index + Log** — `index.md`(콘텐츠 카탈로그)와 `log.md`(시간순 기록)로 네비게이션.

### 2.4. 카파시 원칙에서 가져온 핵심 인사이트

- **"Obsidian은 IDE, LLM은 프로그래머, Wiki는 코드베이스"** — 에이전트가 위키를 유지보수하는 구조.
- 위키는 **git repo of markdown** — 버전 관리, 브랜치, 협업이 무료.
- 검증되지 않은 추측은 wiki에 **승격시키지 않는다** → 필요하면 Raw나 conversations에만 남긴다.
- **qmd** 같은 CLI 도구로 위키 성장 시 검색 확장 가능.

---

## 3. AI-Agent-Wiki-Template v1.0.0 분석

> *출처: `AI-Agent-Wiki-Template-v1.0.0.zip` (김효율의 AI 개발단)*

### 3.1. 폴더 구조

```
AI-Agent-Wiki-Template/
├── .obsidian/          ← 옵시디언 설정 (app.json, appearance.json)
├── AI-Sessions/
│   ├── raw/            ← [Layer 1] 불변 원천 자료
│   ├── conversations/  ← 세션 인수인계 대화 기록
│   └── wiki/           ← [Layer 2] LLM이 관리하는 가공 지식
│       ├── sources/    ← raw 요약 문서
│       ├── concepts/   ← 반복 사용 개념, 용어, 프레임워크
│       ├── decisions/  ← 의사결정, 근거, 결정권자, 날짜
│       ├── errors/     ← 실패한 접근, 다시 반복 금지 실수
│       ├── projects/   ← 프로젝트별 진행 맥락과 산출물
│       ├── design/     ← 디자인 원칙, IA, 화면 설계 가이드
│       └── dev-tasks/  ← 개발 작업 단위, 의존성, 구현 메모
├── prompts/            ← [Layer 3 보조] 자연어 프롬프트 라이브러리
│   ├── first-setup.md
│   ├── save.md
│   ├── ingest.md
│   ├── query.md
│   └── lint.md
├── scripts/            ← 검증 스크립트
│   └── validate-template.sh
├── CLAUDE.md           ← [Layer 3] Claude Code용 규칙
├── AGENTS.md           ← [Layer 3] Codex용 규칙
├── index.md            ← 볼트 지도 (콘텐츠 카탈로그)
├── log.md              ← 시간순 작업 기록
├── START_HERE.md       ← 시작 가이드
├── README.md
├── TEMPLATE_MANIFEST.md
├── VERSION             ← 1.0.0
└── LICENSE.md
```

### 3.2. 템플릿 핵심 규칙 요약

| 규칙 | 내용 |
|------|------|
| **Raw 불변 원칙** | `AI-Sessions/raw/` 안의 원본은 절대 수정·삭제하지 않는다 |
| **Save 5 Filter** | 저장 전 5가지 필터 통과 필수 (§11 참조) |
| **한영 하이브리드** | 가이드라인은 한국어, 명령 키워드는 영어 고정 |
| **자연어 명령** | `save`, `ingest`, `query`, `lint` — 사용자 입력을 해석 |
| **작업 완료 보고** | 읽은 파일, 수정/생성 파일, 필터 적용 결과, 다음 세션 참조 문서 |
| **문서 포맷** | YAML frontmatter + Summary/Context/Details/Links 구조 |

---

## 4. Balance Island 프로젝트 매핑 — 폴더 구조 설계

기존 `balance-island` 프로젝트의 파일 구조를 카파시 원칙 + 김효율 템플릿에 맞게 매핑합니다.

### 4.1. 옵시디언 볼트 설정

- **볼트 경로:** `c:\Users\petbl\balance\balance-island`
- **제외 폴더 (Settings → Files & Links → Excluded files):**
  - `node_modules`, `.git`, `.expo`, `dist`, `.supabase`

### 4.2. 최종 폴더 구조

```
c:\Users\petbl\balance\balance-island\
│
├── CLAUDE.md               ← [Layer 3] Claude Code / Antigravity 규칙
├── AGENTS.md               ← [Layer 3] Codex / 기타 에이전트 규칙  
├── agent.md                ← [Layer 3] 기존 에이전트 규칙 (유지, CLAUDE.md가 참조)
├── index.md                ← 볼트 지도
├── log.md                  ← 시간순 작업 기록
├── research.md             ← [Layer 2] 기존 프로젝트 리서치 (wiki로 통합 관리)
├── timeline.md             ← [Layer 2] 기존 타임라인 (log.md와 병행 운영)
│
├── AI-Sessions/
│   ├── raw/                ← [Layer 1] 불변 원천 자료
│   │   ├── plans/          ← 기존 superpowers/plans/ 원본 이동
│   │   ├── feedback/       ← 사용자 피드백, 회의 메모
│   │   └── external-docs/  ← 외부 API 문서, 레퍼런스
│   │
│   ├── conversations/      ← 세션 인수인계
│   │
│   └── wiki/               ← [Layer 2] 가공된 지식
│       ├── sources/        ← raw 요약 (기존 review 문서들)
│       ├── concepts/       ← 반복 사용 개념 (밸런스 게임, 펫 진화 등)
│       ├── decisions/      ← 의사결정 기록
│       ├── errors/         ← 실패 기록 (인코딩 손상, 빌드 실패 등)
│       ├── projects/       ← 프로젝트 맥락 (Balance Island 전체)
│       ├── design/         ← 디자인 원칙, IA, 화면 설계
│       └── dev-tasks/      ← 개발 태스크 단위
│
├── prompts/                ← [Layer 3 보조] 프롬프트 라이브러리
│   ├── first-setup.md
│   ├── save.md
│   ├── ingest.md
│   ├── query.md
│   └── lint.md
│
├── docs/                   ← 기존 문서 디렉토리 (점진적 마이그레이션)
│   ├── auth-provider-setup.md
│   └── codex-reinstall-handoff.md
│
├── src/                    ← 소스 코드
├── supabase/               ← Supabase 설정
└── ...                     ← 기타 프로젝트 파일
```

---

## 5. CLAUDE.md — Claude Code / Antigravity용 규칙

이 파일은 Claude Code 또는 Antigravity가 이 Obsidian vault에서 작업할 때 따라야 하는 업무 규약입니다.

### 5.1. 파일 용도

- **누가 읽는가:** Claude Code, Antigravity, 기타 Claude 계열 에이전트
- **왜 필요한가:** 에이전트가 세션마다 이 파일을 읽고 일관된 행동을 보장
- **수정 권한:** 사용자가 규칙 보강을 요청한 경우에만 에이전트가 수정

### 5.2. 포함해야 할 내용

```markdown
# CLAUDE.md

## Core Operating Rules
1. 작업 시작 전에 `index.md`, `log.md`, 관련 wiki 문서를 먼저 확인
2. `AI-Sessions/raw/` 안의 원본 자료는 수정·삭제하지 않는다
3. 가공된 지식은 `AI-Sessions/wiki/` 아래에 저장
4. 세션 인수인계는 `AI-Sessions/conversations/`에 저장
5. 저장 작업 후에는 `index.md`와 `log.md` 갱신
6. 민감정보, 토큰, 비밀번호, 고객 개인정보 저장 금지

## Korean / English Hybrid
- 사람이 읽는 가이드라인, 톤앤매너, 금지 표현, 나레이션 지침, 기획 기준, 리뷰 기준 → 한국어
- 에이전트 실행 명령 키워드 → 영어 고정: save, ingest, query, lint, reference

## Command Keywords
- `save`: 현재 작업 맥락을 옵시디언 위키에 저장
- `ingest`: raw 자료를 wiki 자료로 가공
- `query` / `reference`: 기존 wiki와 log를 참조하여 맥락 복원
- `lint`: vault 구조와 규칙 위반을 점검

## Save Filter (5가지 필터)
save 실행 전 반드시 아래 5가지를 확인:
1. 향후 실무에 반복해서 재사용될 데이터인가?
2. 다른 에이전트/동료가 이어받기 위해 반드시 읽어야 하는가?
3. 의사결정의 근거와 결정권자를 추적할 필요가 있는가?
4. 실패한 방식이라 다시 시도하면 안 되는 리스크 정보인가?
5. 팀 전체가 맞추어야 하는 공통 규칙이나 디자인 가이드인가?

→ 하나도 만족하지 않으면 저장하지 않는다. 필요하면 Raw나 conversations에만 남긴다.

## Balance Island 프로젝트 전용
- 기존 `agent.md`의 우선순위와 검증 원칙을 함께 준수
- `research.md`와 `timeline.md`는 wiki 영역과 병행 운영
```

---

## 6. AGENTS.md — Codex / 기타 에이전트용 규칙

### 6.1. 파일 용도

- **누가 읽는가:** OpenAI Codex, OpenCode, 기타 AI 에이전트
- **왜 필요한가:** Claude 이외의 에이전트도 동일한 규칙으로 동작하게 하여 맥락 공유
- **CLAUDE.md와의 차이:** 동일한 핵심 규칙을 공유하되, 에이전트별 특화 지시가 다를 수 있음

### 6.2. 포함해야 할 내용

CLAUDE.md와 동일한 Core Rules, Save Filter, Hybrid 규칙을 포함하되, 에이전트의 역할을 명시:

> "당신은 답변만 하는 챗봇이 아니라, 업무 맥락을 읽고, 필요한 내용을 저장하고, 다음 세션이 이어받을 수 있게 정리하는 **운영자**입니다."

---

## 7. index.md — 볼트 지도

### 7.1. 파일 용도

- **역할:** 볼트 전체의 지도. 에이전트가 query 시 가장 먼저 읽어서 관련 페이지를 찾는 네비게이션.
- **갱신 시점:** 중요한 wiki 문서를 만들거나 갱신한 뒤 반드시 링크 추가
- **카파시 원칙:** ~100 소스, ~수백 페이지 규모에서 임베딩 기반 RAG 없이도 충분히 작동

### 7.2. 초기 구조 (Balance Island용)

```markdown
# Balance Island Wiki Index

## 규칙 및 가이드
- [[CLAUDE]] — Claude Code / Antigravity 에이전트 규칙
- [[AGENTS]] — Codex / 기타 에이전트 규칙
- [[agent]] — 기존 Balance Island 에이전트 운영 지침
- [[log]] — 작업 로그

## 프로젝트
- [[AI-Sessions/wiki/projects/balance-island-overview]] — 프로젝트 전체 개요

## 의사결정
(등록된 의사결정 문서를 여기에 추가)

## 소스 요약
(ingest된 raw 자료의 요약 문서 링크)

## 개념
(반복 사용 개념 문서 링크)

## 에러 / 교훈
(실패 기록 문서 링크)

## 프롬프트 라이브러리
- [[prompts/first-setup]]
- [[prompts/save]]
- [[prompts/query]]
- [[prompts/ingest]]
- [[prompts/lint]]
```

---

## 8. log.md — 시간순 작업 기록

### 8.1. 파일 용도

- **역할:** 시간순 작업 기록 (append-only). 에이전트와 인간 모두가 "언제, 무엇이, 왜 변경되었는지" 추적.
- **기존 `timeline.md`와의 관계:** timeline.md는 기존처럼 유지하되, log.md는 에이전트가 자동 갱신하는 간결한 한 줄 로그.

### 8.2. 형식

```text
YYYY-MM-DD HH:mm | command | summary | linked files
```

**예시:**
```text
2026-06-03 18:30 | ingest | OAuth 콘솔 설정 가이드 원본 ingest → wiki/sources에 요약 생성 | [[oauth-console-summary]]
2026-06-03 19:00 | save | 펫 진화 상태머신 설계 결정 저장 | [[pet-evolution-decision]]
2026-06-04 10:00 | lint | index.md 누락 링크 3건 발견, 수정 완료 | [[index]]
```

**카파시 팁:** `grep "^## \[" log.md | tail -5`로 최근 5개 항목을 빠르게 확인 가능.

---

## 9. 자연어 명령 체계 — save, ingest, query, lint, reference

사용자가 매 세션마다 자연어로 입력하면, 에이전트가 해당 명령을 실행하여 저장과 참조를 수행합니다.

### 9.1. 명령 정의 테이블

| 명령어 | 자연어 예시 | 에이전트 동작 | 읽는 파일 | 쓰는 파일 |
|--------|-----------|------------|----------|----------|
| **save** | "이번 작업 내용을 옵시디언에 저장해줘" | Save Filter 5항목 적용 → 통과 시 wiki 카테고리 판단 → 문서 생성 → index.md, log.md 갱신 | CLAUDE.md, index.md | wiki/*, index.md, log.md |
| **ingest** | "AI-Sessions/raw/에 추가된 자료를 ingest 해줘" | raw 원본 읽기 (수정 안 함) → wiki/sources/ 요약 생성 → 관련 concepts, decisions 연결 → index.md, log.md 갱신 | raw/*, wiki/* | wiki/sources/*, index.md, log.md |
| **query** | "옵시디언 참조해서 이전 작업 맥락 복원해줘" | index.md, log.md 먼저 확인 → 관련 wiki 문서 탐색 → 핵심 맥락, 결정사항, 남은 액션 요약 | index.md, log.md, wiki/* | (없음) |
| **reference** | "옵시디언 참조" | query와 동일. 별칭. | (query와 동일) | (없음) |
| **lint** | "이 위키를 lint 해줘" | §12의 5가지 점검 항목 수행 → 파일별 수정 제안 | CLAUDE.md, index.md, log.md, wiki/*, raw/* | (수정 제안만, 직접 수정은 확인 후) |

### 9.2. 자연어 해석 규칙

사용자는 정확한 영어 명령어를 입력하지 않아도 됩니다.

| 사용자 입력 (자연어) | 해석되는 명령 |
|---------------------|-------------|
| "이번 작업 내용을 옵시디언에 저장해줘" | `save` |
| "옵시디언을 참조해줘" / "옵시디언 참조" | `query` / `reference` |
| "raw 폴더에 새 자료 넣었어, 정리해줘" | `ingest` |
| "위키 상태 점검해줘" | `lint` |

---

## 10. 한글/영문 하이브리드 세팅 규칙

### 10.1. 목표

> 사람이 읽기 쉬운 위키이면서도, 에이전트가 세션마다 일관되게 실행할 수 있는 업무 시스템.

### 10.2. 구분 기준

| 구분 | 언어 | 예시 |
|------|------|------|
| **에이전트 명령 키워드** | 🇺🇸 영어 | `save`, `ingest`, `query`, `lint`, `reference` |
| **파일 시스템 작업, 자동화 트리거** | 🇺🇸 영어 | 파일명, frontmatter key, status 값 |
| **채널의 톤앤매너** | 🇰🇷 한국어 | "존댓말 사용", "금지 표현 목록" |
| **나레이션 지침** | 🇰🇷 한국어 | "~습니다 체 사용" |
| **기획 기준, 리뷰 기준** | 🇰🇷 한국어 | "밸런스 게임은 2지 선다 형태" |
| **디자인 가이드** | 🇰🇷 한국어 | "카드 UI는 둥근 모서리 8px" |
| **결정 근거, 맥락 설명** | 🇰🇷 한국어 | "Kakao OAuth 대신 Google을 우선 적용한 이유" |

### 10.3. frontmatter 예시 (영문 고정)

```yaml
---
type: decision
date: 2026-06-03
status: active
author: Antigravity
source: "[[oauth-provider-console-setup]]"
---
```

---

## 11. Raw ↔ Wiki 분리 원칙과 Save Filter

### 11.1. Raw 영역 (`AI-Sessions/raw/`)

| 속성 | 설명 |
|------|------|
| **정의** | 원본 자료, 회의록, 대화 로그, 외부 문서처럼 **변경하면 안 되는 불변 자료** |
| **에이전트 권한** | **읽기 전용**. 절대 수정하지 않는다. |
| **사용자 권한** | 자유롭게 추가/삭제 가능 |
| **예시** | 기획서 원본, 사용자 피드백 메일, Supabase 공식 문서 발췌, 회의 녹취 요약 |

### 11.2. Wiki 영역 (`AI-Sessions/wiki/`)

| 속성 | 설명 |
|------|------|
| **정의** | Raw를 바탕으로 정리된 **실행 규칙, 의사결정, 프로젝트 맥락, 반복 재사용 가능한 지식만** 저장 |
| **에이전트 권한** | 생성 및 수정 가능 |
| **핵심 원칙** | 검증되지 않은 추측은 Wiki에 승격시키지 않는다 |

### 11.3. Save Filter — 저장 전 5가지 필터

에이전트가 `save` 명령으로 옵시디언 위키에 내용을 저장하기 전에 **반드시** 아래 5가지 필터를 통과해야 합니다.

| # | 필터 질문 | 통과 기준 |
|---|----------|----------|
| 1 | 이 정보가 향후 실무에 **반복해서 재사용될 데이터**인가? | 일회성이 아닌 반복 참조 가치 |
| 2 | 다른 에이전트나 동료가 프로젝트를 **이어받기 위해 반드시 읽어야** 하는가? | 인수인계 필수 정보 |
| 3 | **의사결정의 근거와 결정권자**를 나중에 추적할 필요가 있는가? | 추적 가능성 필요 |
| 4 | 실패한 방식이라 **다시 시도하면 안 되는 리스크 정보**인가? | 재발 방지 가치 |
| 5 | 팀 전체가 맞추어야 하는 **공통 규칙이나 디자인 가이드**인가? | 팀 표준화 가치 |

> ⚠️ **5가지 조건 중 하나라도 만족하지 않는 일회성 답변, 사소한 중간 생각, 검증되지 않은 추측은 Wiki에 저장하지 않는다.**  
> 필요하다면 `AI-Sessions/raw/` 또는 `AI-Sessions/conversations/`에만 남기고, Wiki에는 승격하지 않는 구조로 설계한다.

---

## 12. lint 명령의 5가지 점검 항목

`lint` 명령 실행 시 에이전트가 수행하는 점검 체크리스트:

| # | 점검 항목 | 설명 |
|---|----------|------|
| 1 | **Raw 오염 검사** | raw 원본이 수정되었거나, wiki 영역에 섞여 있지 않은가? |
| 2 | **index.md 누락** | 중요한 wiki 문서가 `index.md`에 누락되어 있지 않은가? |
| 3 | **log.md 누락** | 중요한 작업이 `log.md`에 기록되지 않았는가? |
| 4 | **Save Filter 위반** | 5가지 필터를 통과하지 못한 일회성 정보가 wiki에 저장되어 있지 않은가? |
| 5 | **민감정보 점검** | API 키, 토큰, 고객 개인정보가 저장되어 있지 않은가? |

추가 lint (카파시 원칙):
- 페이지 간 모순 (새 소스가 기존 주장을 대체한 경우)
- 고아 페이지 (인바운드 링크 없음)
- 중요 개념이 언급만 되고 전용 페이지가 없는 경우
- 빠진 교차참조

---

## 13. 기존 프로젝트 파일 마이그레이션 계획

사용자가 직접 폴더와 파일을 만들지 않도록, 에이전트가 실행할 마이그레이션을 정의합니다.

### 13.1. 기존 파일 → 신규 위치 매핑

| 기존 파일 | 신규 위치 | 설명 |
|----------|----------|------|
| `agent.md` | **루트 유지** | CLAUDE.md에서 `[[agent]]`로 참조. 기존 규칙 보존. |
| `research.md` | **루트 유지** | wiki 영역과 병행 운영. CLAUDE.md에서 참조 명시. |
| `timeline.md` | **루트 유지** | log.md와 병행 운영. 기존 패턴 유지. |
| `docs/auth-provider-setup.md` | `AI-Sessions/raw/external-docs/` | 외부 문서 원본으로 분류 |
| `docs/codex-reinstall-handoff.md` | `AI-Sessions/conversations/` | 인수인계 문서 |
| `docs/2026-06-03-comprehensive-review.md` | `AI-Sessions/wiki/sources/` | raw 분석 결과물 |
| `docs/2026-06-03-pet-island-liveops-upgrade-review.md` | `AI-Sessions/wiki/sources/` | raw 분석 결과물 |
| `docs/superpowers/plans/*.md` (7개) | `AI-Sessions/raw/plans/` | 기획서 원본 (불변) |

### 13.2. 신규 생성 파일

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | Claude Code / Antigravity 에이전트 규칙 |
| `AGENTS.md` | Codex / 기타 에이전트 규칙 |
| `index.md` | 볼트 지도 |
| `log.md` | 시간순 작업 기록 |
| `prompts/first-setup.md` | 초기 세팅 프롬프트 |
| `prompts/save.md` | save 명령 프롬프트 |
| `prompts/ingest.md` | ingest 명령 프롬프트 |
| `prompts/query.md` | query 명령 프롬프트 |
| `prompts/lint.md` | lint 명령 프롬프트 |

---

## 14. 옵시디언 시각 도구 활용 — Graph View, Canvas, Dataview

### 14.1. Graph View

- wiki 문서 간의 `[[내부 링크]]`가 자동으로 그래프 뷰에 반영
- projects → decisions → concepts 간의 관계가 시각화
- 고아 페이지(orphan) 식별 → lint 시 활용

### 14.2. Canvas

- `.canvas` 파일은 JSON 포맷 → 에이전트가 직접 읽고 수정 가능
- 펫 행동 상태머신, 데이터 파이프라인 흐름도 시각화에 활용

### 14.3. Dataview 플러그인

- frontmatter의 `type`, `status`, `date` 필드를 쿼리하여 동적 대시보드 생성
- 예: `TABLE status, date FROM "AI-Sessions/wiki/dev-tasks" SORT date DESC`

### 14.4. 추천 플러그인

| 플러그인 | 용도 |
|---------|------|
| **Dataview** | frontmatter 기반 동적 테이블/대시보드 |
| **Advanced Tables** | 밸런스 테이블 편집 |
| **Obsidian Web Clipper** | 웹 기사를 마크다운으로 클리핑 → raw에 저장 |

---

## 15. 단계별 실행 절차

> ⚠️ **사용자가 직접 폴더와 규칙 파일을 만들지 않아도 됩니다.** 아래 절차는 에이전트가 실행하거나, 사용자가 승인 후 에이전트가 자동 수행합니다.

### Step 1: 디렉토리 구조 생성

에이전트가 `AI-Sessions/raw/`, `AI-Sessions/wiki/`, `AI-Sessions/conversations/`, `prompts/` 디렉토리를 생성합니다.

### Step 2: 핵심 규칙 파일 생성

`CLAUDE.md`, `AGENTS.md`, `index.md`, `log.md`를 프로젝트 루트에 생성합니다. (§5~8 내용 기반)

### Step 3: 프롬프트 라이브러리 생성

`prompts/` 폴더에 `first-setup.md`, `save.md`, `ingest.md`, `query.md`, `lint.md`를 생성합니다.

### Step 4: 기존 파일 마이그레이션

§13.1의 매핑에 따라 기존 문서를 적절한 위치로 복사(원본 유지)합니다.

### Step 5: 옵시디언에서 볼트 열기

사용자가 옵시디언을 열고 `c:\Users\petbl\balance\balance-island`를 볼트로 지정합니다.

### Step 6: 제외 폴더 설정

Settings → Files & Links → Excluded files에 `node_modules`, `.git`, `.expo`, `dist` 추가.

### Step 7: 초기 Ingest 실행

기존 `docs/superpowers/plans/`의 7개 기획서를 raw에 배치 후, 에이전트에게 `ingest` 명령을 실행하여 wiki/sources에 요약을 생성합니다.

### Step 8: Lint 실행

전체 vault 구조가 규칙에 맞는지 `lint`를 실행하여 점검합니다.

---

## 16. 기대 효과

| 효과 | 설명 |
|------|------|
| **컨텍스트 유실 방지** | 어떤 에이전트가 투입되어도 index.md + log.md + wiki를 읽으면 100% 맥락 복원 |
| **맥락 오염 방지** | Save Filter 5항목이 검증되지 않은 추측과 일회성 답변의 wiki 승격을 차단 |
| **복리 지식 축적** | 프로젝트가 진행될수록 교차참조된 지식이 기하급수적으로 성장 |
| **에이전트 간 인수인계** | Claude → Codex → Antigravity 등 에이전트 교체 시 동일 규칙으로 즉시 투입 가능 |
| **자연어 명령 체계** | "옵시디언에 저장해줘", "옵시디언 참조" 등 간단한 입력으로 저장·참조 자동화 |
| **한글/영문 하이브리드** | 사람에게 읽기 쉽고, 에이전트에게 실행 가능한 최적 균형 |

---

## 부록: 참조 소스

| 소스 | URL |
|------|-----|
| Karpathy LLM Wiki gist | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f |
| 김효율의 AI 개발단 YouTube | https://youtube.com/watch?v=WcmQPMrCYV8 |
| AI-Agent-Wiki-Template v1.0.0 | `C:\Users\petbl\Downloads\AI-Agent-Wiki-Template-v1.0.0.zip` |
| Karpathy gist ZIP | `C:\Users\petbl\Downloads\442a6bf555914893e9891c11519de94f-*.zip` |
| hootbu/llm-wiki-mind (GitHub) | https://github.com/hootbu/llm-wiki-mind |
