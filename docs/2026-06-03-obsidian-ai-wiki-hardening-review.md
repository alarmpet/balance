# Obsidian AI Wiki Hardening 계획서 검토 및 개선 의견서

> **작성일:** 2026-06-03  
> **작성자:** Antigravity (AI Coding Assistant)  
> **문서 상태:** 검토 완료 및 제안  
> **인코딩 형식:** UTF-8  
> **문서 전체 경로:** `c:\Users\petbl\balance\balance-island\docs\2026-06-03-obsidian-ai-wiki-hardening-review.md`

---

## 1. 개요 및 전체 평가

본 검토 의견서는 `2026-06-03-obsidian-ai-wiki-hardening.md` 계획서를 분석하여, 현재 Balance Island 프로젝트의 코드베이스, 개발 워크플로우, 그리고 기존 문서(`research.md`, `timeline.md`)와의 유기적인 결합을 확인하고 하드닝 과정에서 발생할 수 있는 잠재적 리스크 및 개선점을 도출하기 위해 작성되었습니다.

전반적으로 하드닝 계획서는 김효율 템플릿의 누락된 핵심 구성 요소를 보완하고, 에이전트 명령 키워드(`reference` 추가) 및 자동화 검증 스크립트(`validate-wiki.mjs`)를 도입하여 위키의 정합성을 강건하게 만들고자 하는 훌륭한 방향성을 갖고 있습니다. 

그러나 **Git 협업 충돌, 자동화 검증 스크립트의 오탐(False Positive) 리스크, 한국어 인코딩 검사 오류** 등 실제 협업 및 빌드 파이프라인에서 치명적일 수 있는 몇 가지 문제점이 발견되어, 이에 대한 보완 의견을 제시합니다.

---

## 2. 핵심 문제점 및 해결 방안 (Critical Issues & Recommendations)

### [Critical] C1. `.obsidian/workspace.json` 및 로컬 캐시 파일의 Git 추적 리스크

- **현재 계획 (Task 5):** 
  - `.obsidian/workspace.json`, `workspace-mobile.json` 파일을 Git에 추가(`git add`)하여 커밋하도록 설계되어 있습니다.
- **문제점:**
  - `workspace.json`과 `workspace-mobile.json`은 사용자가 옵시디언 앱을 사용할 때 **현재 열려 있는 탭, 커서 위치, 최근 열어본 파일 목록** 등을 실시간으로 기록하는 **로컬 작업 영역 캐시 파일**입니다.
  - 이 파일은 사용자가 파일을 클릭할 때마다 수시로 변경되므로, 이를 Git으로 공유하게 되면 **개발자 간에 끊임없이 Git 충돌(Conflict)이 발생**하며 불필요한 변경 내역이 Git History를 오염시킵니다.
- **개선안:**
  - `.obsidian/app.json`, `appearance.json`, `core-plugins.json`, `graph.json` 등 **글로벌 볼트 설정 파일만 Git에 커밋**해야 합니다.
  - `workspace.json`과 `workspace-mobile.json`은 `.gitignore`에 등록하여 Git 추적에서 철저히 배제해야 합니다.

```diff
# .gitignore 추가 제안
+ # Obsidian local workspace cache
+ .obsidian/workspace
+ .obsidian/workspace-mobile
+ .obsidian/workspace.json
+ .obsidian/workspace-mobile.json
```

---

### [Critical] C2. `validate-wiki.mjs` 내 Secret 검출 패턴의 오탐 (False Positive) 오류

- **현재 계획 (Task 3):**
  - 프로젝트 내의 모든 `.md` 파일(`node_modules`, `.git`, `AI-Sessions/raw` 제외)을 대상으로 `/client[_-]?secret/i`, `/api[_-]?key\s*[:=]/i` 등의 패턴을 검사하여 비밀번호나 API 키 누출을 방지합니다.
- **문제점:**
  - `CLAUDE.md`, `AGENTS.md`, `prompts/save.md` 및 `docs/` 내의 다양한 기획서/가이드 문서에는 **"Client Secret을 노출하지 마라", "API Key를 하드코딩하지 마라"와 같은 보안 규칙 설명**이 한글과 영어로 다수 작성되어 있습니다.
  - 이 때문에 검증 스크립트를 실행하면 **실제 API 키가 노출되지 않았음에도 규칙 본문 내의 "Client Secret" 또는 "API Key"라는 단어 자체에 매칭되어 린트 검증이 실패(False Positive)**하게 됩니다.
- **개선안:**
  - 검증 스크립트에서 **규칙 파일(`CLAUDE.md`, `AGENTS.md`), 프롬프트 폴더(`prompts/`), 그리고 기존 기획 폴더(`docs/`)**는 텍스트 내 Secret 패턴 매칭 대상에서 제외(Ignore)하도록 경로 가드를 추가해야 합니다.

```js
// scripts/validate-wiki.mjs 수정 제안 (가드 라인 보강)
for (const file of listMarkdownFiles('.')) {
  if (file.includes('node_modules') || file.includes('.git') || file.includes('dist')) continue;
  if (file.includes('AI-Sessions/raw')) continue;
  
  // 규칙, 프롬프트, 계획서 본문 문서 등 설명 영역은 Secret 단어 검사에서 스킵
  if (
    file === 'CLAUDE.md' || 
    file === 'AGENTS.md' || 
    file.startsWith('prompts/') || 
    file.startsWith('docs/')
  ) continue;

  const content = readFileSync(file, 'utf8');
  // ... 생략
}
```

---

### [Important] I1. 한국어 키워드 `'5가지'` 하드코딩 검증의 인코딩 및 유연성 리스크

- **현재 계획 (Task 3):**
  - `CLAUDE.md`와 `AGENTS.md` 내에 `'5가지'`라는 한국어 텍스트가 정확히 포함되어 있는지 검증합니다.
- **문제점:**
  - **인코딩 문제:** 윈도우 환경 등에서 인코딩 미스매치가 발생하여 파일 읽기 시 한글이 깨지면 `'5가지'` 문자열이 매칭되지 않아 오류가 발생할 수 있습니다.
  - **유연성 부족:** 룰 파일의 본문을 영어로 보강하거나 표현을 변경할 때(예: "5가지 필터", "5-Filter", "5 Filters") 무조건 린트가 깨져 관리 비용이 올라갑니다.
- **개선안:**
  - `'5가지'`와 같은 하드코딩된 한글 키워드 매칭 대신, 영문 키워드 병행(`'5가지'` 또는 `'5 Filter'` 또는 `'5-Filter'`) 또는 정규식을 통해 유연하게 검증해야 합니다.

```js
// scripts/validate-wiki.mjs 내 매칭 유연화
const claudeContent = readFileSync('CLAUDE.md', 'utf8');
if (!/5가지|5[ -]?Filter/i.test(claudeContent)) {
  failures.push('CLAUDE.md missing 5-filter configuration description.');
}
```

---

## 3. 워크플로우 및 기존 문서 정합성 개선 제안

### [Important] I2. `research.md` 비대화 해결을 위한 아카이빙 작업 연동

- **현황:**
  - `research.md`는 현재 580줄을 돌파하여, 해결된 리스크와 현재 활성 리스크가 뒤섞여 에이전트가 매 세션마다 불필요한 컨텍스트 토큰을 소모하게 만듭니다.
- **개선 제안:**
  - 하드닝 작업(Task 5)을 진행할 때, `research.md`를 **현재 상태/활성 리스크**만 담은 슬림한 문서로 압축(200줄 이하)하고, 기존의 상세한 기술 수리 내역은 `docs/research-history.md` 또는 `AI-Sessions/wiki/sources/research-history-archive.md`로 이관하여 아카이빙하는 단계를 하드닝 계획의 일부로 통합할 것을 권장합니다.

### [Suggestion] S1. `timeline.md`와 `log.md` 역할 분담 명문화

- **현황:**
  - 기존 프로젝트의 `timeline.md`와 템플릿의 `log.md`가 공존하고 있습니다.
- **개선 제안:**
  - 두 파일의 역할을 규칙 문서(`CLAUDE.md`, `AGENTS.md`)에 명확히 정의해 주어야 후속 에이전트가 혼란을 겪지 않습니다.
  - **`log.md`:** `save`, `ingest` 등 위키 관리 명령 실행 시 남기는 **한 줄 기계적 로그** (Append-only).
  - **`timeline.md`:** 실제 소스 코드 수정, Supabase 배포 내역, 타입체크 및 검증 완료 상세 내역을 담는 **인간 친화적 개발 타임라인** (기존 방식 유지).

---

## 4. 결론 및 승인 대기

하드닝 계획서(`2026-06-03-obsidian-ai-wiki-hardening.md`)는 매우 체계적이지만, 위에 언급한 **C1(workspace.json 충돌 리스크)**과 **C2(Secret 오탐 오류)**는 실제 구현 완료 전에 반드시 계획 단계에서 수정되어야 합니다.

본 의견서가 저장된 전체 경로는 다음과 같습니다:
`c:\Users\petbl\balance\balance-island\docs\2026-06-03-obsidian-ai-wiki-hardening-review.md`

이 의견을 하드닝 계획에 반영하여 **보완된 하드닝 실행 계획(Task 1 ~ Task 6)을 진행**할지 여부를 알려주시기 바랍니다. 승인 시 보완 사항을 반영하여 마저 개발을 완료하겠습니다.
