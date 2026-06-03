# 07. Porting Checklist

다른 프로젝트에 Obsidian AI Wiki를 옮길 때 사용하는 체크리스트입니다.

## A. 복사 전 결정

- [ ] 이 프로젝트의 루트를 Obsidian vault로 사용할지 결정했다.
- [ ] 기존 문서 폴더와 wiki 폴더의 역할을 분리했다.
- [ ] `raw`, `wiki`, `conversations`의 차이를 팀/에이전트 규칙에 반영했다.
- [ ] secret을 절대 저장하지 않는 규칙을 합의했다.

## B. 복사할 파일

- [ ] `START_HERE.md`
- [ ] `AGENTS.md`
- [ ] `CLAUDE.md`
- [ ] `index.md`
- [ ] `log.md`
- [ ] `README.md`
- [ ] `TEMPLATE_MANIFEST.md`
- [ ] `VERSION`
- [ ] `LICENSE.md`
- [ ] `prompts/save.md`
- [ ] `prompts/ingest.md`
- [ ] `prompts/query.md`
- [ ] `prompts/reference.md`
- [ ] `prompts/lint.md`
- [ ] `scripts/validate-wiki.mjs`

## C. 복사할 폴더

- [ ] `AI-Sessions/raw/`
- [ ] `AI-Sessions/conversations/`
- [ ] `AI-Sessions/wiki/sources/`
- [ ] `AI-Sessions/wiki/concepts/`
- [ ] `AI-Sessions/wiki/decisions/`
- [ ] `AI-Sessions/wiki/errors/`
- [ ] `AI-Sessions/wiki/projects/`
- [ ] `AI-Sessions/wiki/design/`
- [ ] `AI-Sessions/wiki/dev-tasks/`
- [ ] `prompts/`
- [ ] `scripts/`

## D. 복사하지 않을 것

- [ ] 이전 프로젝트의 실제 raw 자료
- [ ] 이전 프로젝트의 실제 wiki 결정사항
- [ ] OAuth secret, API key, token
- [ ] `.supabase-access-token.txt`
- [ ] `.env`, `.env.local`
- [ ] `.obsidian/workspace.json`
- [ ] `.obsidian/workspace-mobile.json`
- [ ] local smoke screenshot

## E. 프로젝트별 치환

- [ ] 프로젝트 이름
- [ ] 주요 앱/서비스 경로
- [ ] 검증 명령
- [ ] 배포 환경
- [ ] 주요 문서 출처
- [ ] 팀/에이전트 이름
- [ ] 현재 진행 중인 작업

## F. 첫 wiki 작성

- [ ] `AI-Sessions/wiki/projects/<project>-overview.md`
- [ ] 핵심 개념 3개 이하
- [ ] 중요한 결정 3개 이하
- [ ] 반복되면 안 되는 오류/리스크 1개 이상
- [ ] `index.md` 링크 갱신
- [ ] `log.md` 첫 기록 추가

## G. 첫 검증

- [ ] `npm.cmd run validate:wiki`
- [ ] `git diff --check`
- [ ] `git diff --cached --name-only`
- [ ] 금지 파일 stage 여부 확인
- [ ] 새 AI 세션에서 `reference`로 맥락 복원 테스트

## H. 성공 기준

- [ ] 새 에이전트가 `START_HERE.md`만 보고 읽을 순서를 알 수 있다.
- [ ] `index.md`에서 핵심 문서를 찾을 수 있다.
- [ ] `log.md`에서 최근 wiki 작업 흐름을 볼 수 있다.
- [ ] validator가 통과한다.
- [ ] secret이나 local cache가 git에 포함되지 않는다.
