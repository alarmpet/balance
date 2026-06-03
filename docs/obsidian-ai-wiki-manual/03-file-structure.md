# 03. File Structure

파일 구조의 목적은 에이전트가 "어디를 읽고, 어디에 쓰고, 어디는 건드리지 말아야 하는지" 즉시 알게 하는 것입니다.

## Root Files

```text
START_HERE.md
```

새 세션의 첫 진입점입니다. 사람이든 AI든 먼저 읽어야 할 순서를 적습니다.

```text
AGENTS.md
CLAUDE.md
```

에이전트 운영 규칙입니다. Codex, Claude Code, 다른 AI 도구가 같은 원칙으로 움직이게 합니다.

```text
index.md
```

wiki의 지도입니다. 중요한 문서가 생기면 반드시 링크합니다.

```text
log.md
```

명령 단위의 append-only 작업 로그입니다. 상세한 개발 연표는 `timeline.md`가 맡고, `log.md`는 wiki 운영 로그에 집중합니다.

```text
TEMPLATE_MANIFEST.md
VERSION
LICENSE.md
README.md
```

템플릿 출처, 필수 구조, 설치 버전, 라이선스/소유권 안내입니다.

## AI-Sessions

```text
AI-Sessions/raw/
```

원본 보존 영역입니다. 외부 문서, 회의록, 계획서, 대화 요약, 스크린샷 설명처럼 다시 검증해야 하는 자료를 둡니다. 에이전트는 raw를 수정하지 않습니다.

```text
AI-Sessions/wiki/
```

가공된 지식 영역입니다. 반복 재사용 가능한 문서만 둡니다.

```text
AI-Sessions/conversations/
```

세션 인수인계나 대화 요약을 둡니다. 긴 대화 전체를 저장하기보다, 다음 작업자가 바로 이어갈 수 있는 handoff를 권장합니다.

## Wiki Categories

```text
AI-Sessions/wiki/sources/
```

raw 자료를 요약하고 출처 맥락을 정리한 문서입니다.

```text
AI-Sessions/wiki/concepts/
```

반복해서 쓰는 개념, 용어, 모델, 프레임워크입니다.

```text
AI-Sessions/wiki/decisions/
```

의사결정 기록입니다. 결정일, 근거, 대안, 현재 상태를 포함합니다.

```text
AI-Sessions/wiki/errors/
```

실패, 위험, 재발 방지 규칙입니다.

```text
AI-Sessions/wiki/projects/
```

프로젝트 전체 맥락과 현재 상태입니다.

```text
AI-Sessions/wiki/design/
```

UX, IA, 디자인 원칙, 화면 구조입니다.

```text
AI-Sessions/wiki/dev-tasks/
```

개발 작업 단위, 구현 기준, 검증 기준입니다.

## Frontmatter

모든 `AI-Sessions/wiki/**/*.md` 문서는 frontmatter로 시작합니다.

```yaml
---
type: decision | source | concept | error | project | design | dev-task | handoff
date: YYYY-MM-DD
status: draft | active | superseded
source: optional
---
```

`source`가 실제 파일 경로라면 존재해야 합니다. 설명 문구라면 경로처럼 쓰지 않는 것이 좋습니다.
