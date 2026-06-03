# 02. Installation Guide

이 가이드는 새 프로젝트 루트에 Obsidian AI Wiki를 설치하는 절차입니다.

## 1단계: 기본 폴더 만들기

프로젝트 루트에 다음 구조를 만듭니다.

```text
AI-Sessions/
  raw/
    external-docs/
    plans/
  conversations/
  wiki/
    sources/
    concepts/
    decisions/
    errors/
    projects/
    design/
    dev-tasks/
prompts/
scripts/
.obsidian/
```

권장 루트 파일:

```text
README.md
START_HERE.md
TEMPLATE_MANIFEST.md
VERSION
LICENSE.md
AGENTS.md
CLAUDE.md
index.md
log.md
```

## 2단계: Obsidian 설정 파일 처리

공유해도 되는 파일:

```text
.obsidian/app.json
.obsidian/appearance.json
.obsidian/core-plugins.json
.obsidian/graph.json
```

공유하지 말아야 할 파일:

```text
.obsidian/workspace
.obsidian/workspace-mobile
.obsidian/workspace.json
.obsidian/workspace-mobile.json
```

`.gitignore`에 추가합니다.

```gitignore
# Obsidian local workspace cache
.obsidian/workspace
.obsidian/workspace-mobile
.obsidian/workspace.json
.obsidian/workspace-mobile.json
```

## 3단계: 명령 프롬프트 만들기

`prompts/` 아래에 최소 5개 파일을 둡니다.

```text
prompts/save.md
prompts/ingest.md
prompts/query.md
prompts/reference.md
prompts/lint.md
```

명령어는 반드시 영어로 고정합니다. 한국어 자연어 요청은 이 명령어로 해석하게 만듭니다.

```text
"옵시디언에 저장해줘" -> save
"이 문서 정리해줘" -> ingest
"이전 맥락 찾아줘" -> query
"옵시디언 참조해줘" -> reference
"위키 점검해줘" -> lint
```

## 4단계: validator 추가

Node.js 프로젝트라면 `package.json`에 추가합니다.

```json
{
  "scripts": {
    "validate:wiki": "node scripts/validate-wiki.mjs"
  }
}
```

다른 언어 프로젝트라도 validator는 Node.js 단일 스크립트로 유지하는 것을 추천합니다. 대부분의 AI 에이전트가 Node.js 스크립트를 쉽게 실행하고 수정할 수 있기 때문입니다.

## 5단계: 첫 ingest

처음에는 기존 프로젝트 자료를 모두 wiki에 넣으려 하지 말고, 아래 순서로만 정리합니다.

1. 프로젝트 개요: `AI-Sessions/wiki/projects/<project-name>-overview.md`
2. 핵심 개념: `AI-Sessions/wiki/concepts/*.md`
3. 중요한 결정: `AI-Sessions/wiki/decisions/*.md`
4. 이미 겪은 실패: `AI-Sessions/wiki/errors/*.md`
5. 진행 중 작업: `AI-Sessions/wiki/dev-tasks/*.md`

raw 원본은 그대로 `AI-Sessions/raw/`에 둡니다.

## 6단계: 첫 검증

```powershell
npm.cmd run validate:wiki
```

성공 기준:

- 필수 파일이 모두 존재한다.
- 필수 폴더가 모두 존재한다.
- `index.md`가 prompt와 주요 wiki 문서를 링크한다.
- wiki 문서가 YAML frontmatter로 시작한다.
- secret-like 문자열이 저장되지 않았다.
