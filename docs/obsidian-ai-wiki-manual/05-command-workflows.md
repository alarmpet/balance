# 05. Command Workflows

이 문서는 `save`, `ingest`, `query`, `reference`, `lint`를 어떻게 운영할지 설명합니다.

## save

현재 작업 결과를 wiki에 저장합니다.

진행 순서:

1. 저장 5가지 필터를 적용한다.
2. 저장 가치가 있으면 적절한 category를 고른다.
3. 새 wiki 문서를 만들거나 기존 문서를 갱신한다.
4. `index.md`에 링크를 추가한다.
5. `log.md`에 한 줄을 추가한다.
6. `npm.cmd run validate:wiki`를 실행한다.

저장하지 말아야 할 것:

- 방금 떠오른 감상
- 검증되지 않은 추측
- 임시 UI 문구 후보
- secret이 포함된 인증 설정
- 스크린샷 원본 경로만 있는 설명 없는 자료

## ingest

raw 자료를 wiki 지식으로 가공합니다.

진행 순서:

1. raw 자료를 읽는다.
2. 원본은 수정하지 않는다.
3. 반복 재사용 가능한 내용만 뽑는다.
4. `sources`, `concepts`, `decisions`, `errors`, `projects`, `design`, `dev-tasks` 중 위치를 고른다.
5. frontmatter를 추가한다.
6. `index.md`와 `log.md`를 갱신한다.

좋은 ingest 결과:

- 원본 출처가 명확하다.
- 결정과 의견이 구분된다.
- 나중에 검색할 키워드가 제목과 소제목에 들어 있다.
- 과거 문서와 충돌하는 내용은 충돌로 표시한다.

## query

현재 작업을 시작하기 전에 기존 맥락을 찾습니다.

진행 순서:

1. `START_HERE.md`를 확인한다.
2. `AGENTS.md` 또는 `CLAUDE.md`를 확인한다.
3. `index.md`에서 관련 문서를 찾는다.
4. `log.md`에서 최근 흐름을 확인한다.
5. 관련 wiki 문서를 요약한다.

출력 형식:

```markdown
현재 맥락:

이미 결정된 사항:

최근 완료된 작업:

남은 작업:

먼저 확인할 파일:
```

## reference

`query`의 alias입니다. 사용자가 "옵시디언 참조", "위키 참조", "이전 맥락 복원"처럼 말할 때 사용합니다.

`reference`는 새 정보를 저장하지 않습니다. 읽은 근거 파일만 함께 보고합니다.

## lint

wiki의 구조와 규칙 위반을 점검합니다.

자동 검사:

```powershell
npm.cmd run validate:wiki
```

수동 검사:

- raw 원본이 수정되지 않았는가?
- 중요한 wiki 문서가 `index.md`에 연결되어 있는가?
- 중요한 작업이 `log.md`에 남아 있는가?
- 저장 5가지 필터를 통과하지 못한 일회성 정보가 wiki에 있는가?
- 출처 없는 결정이 있는가?
- 오래된 규칙이 최신 결정과 충돌하지 않는가?
