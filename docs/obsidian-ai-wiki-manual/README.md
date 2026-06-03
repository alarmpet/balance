# Obsidian AI Wiki Reuse Manual

이 문서 세트는 Balance Island에서 구축한 Obsidian + LLM 업무 위키를 다른 프로젝트에 재사용하기 위한 운영 매뉴얼입니다.

목표는 단순한 메모장이 아니라, 사람과 여러 AI 에이전트가 같은 업무 맥락을 반복해서 이어받을 수 있는 지식 운영 시스템을 만드는 것입니다.

## 핵심 원칙

- 사람용 설명은 한국어로 쓴다.
- 에이전트가 실행 명령으로 인식해야 하는 키워드는 영어로 고정한다: `save`, `ingest`, `query`, `reference`, `lint`.
- `raw`와 `wiki`를 분리한다. 원본 자료는 보존하고, 재사용 지식만 정리한다.
- 저장 전에는 5가지 필터를 통과한 정보만 남긴다.
- 모든 중요한 저장 후에는 `index.md`와 `log.md`를 갱신한다.
- secret, token, API key, 고객 정보, 비공개 인증 자료는 절대 wiki에 저장하지 않는다.
- validator를 둬서 구조, frontmatter, 필수 파일, 링크, 민감정보 오탐 위험을 자동으로 잡는다.

## 문서 구성

1. [01-system-concept.md](./01-system-concept.md): 이 시스템의 목적과 설계 철학
2. [02-installation-guide.md](./02-installation-guide.md): 새 프로젝트에 설치하는 절차
3. [03-file-structure.md](./03-file-structure.md): 폴더와 파일 구조
4. [04-agent-rules.md](./04-agent-rules.md): `AGENTS.md`, `CLAUDE.md` 작성 규칙
5. [05-command-workflows.md](./05-command-workflows.md): `save`, `ingest`, `query`, `reference`, `lint` 운영법
6. [06-validation-security.md](./06-validation-security.md): 검증 스크립트와 보안 규칙
7. [07-porting-checklist.md](./07-porting-checklist.md): 다른 프로젝트로 옮길 때 체크리스트
8. [08-templates.md](./08-templates.md): 바로 복사 가능한 템플릿

## 추천 도입 순서

1. 새 프로젝트 루트에 Obsidian vault 구조를 만든다.
2. `AGENTS.md`, `CLAUDE.md`, `index.md`, `log.md`, `prompts/`를 추가한다.
3. `AI-Sessions/raw/`, `AI-Sessions/wiki/`, `AI-Sessions/conversations/`를 분리한다.
4. `scripts/validate-wiki.mjs`와 `package.json`의 `validate:wiki`를 추가한다.
5. 첫 ingest로 기존 프로젝트 문서, 결정사항, 작업 기록을 wiki로 정리한다.
6. 새 AI 세션을 열 때마다 `query` 또는 `reference`로 맥락을 복원한다.

## 복사할 것과 복사하지 말 것

복사할 것:

- 구조와 규칙 파일
- prompt 템플릿
- validator 스크립트
- `.obsidian`의 공유 설정 파일 일부

복사하지 말 것:

- 특정 프로젝트의 실제 `AI-Sessions/raw/**`
- 특정 프로젝트의 실제 `AI-Sessions/wiki/**`
- screenshot, token, OAuth secret, Supabase token
- `.obsidian/workspace.json`
