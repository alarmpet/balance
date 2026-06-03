# 04. Agent Rules

`AGENTS.md`와 `CLAUDE.md`는 AI 에이전트가 프로젝트에 들어왔을 때 따르는 운영 규칙입니다.

## 작성 원칙

- 사람이 읽는 설명은 한국어로 쓴다.
- 명령어는 영어 키워드로 고정한다.
- raw는 수정 금지, wiki는 가공 지식, conversations는 인수인계라는 경계를 명확히 적는다.
- 저장 5가지 필터를 반드시 포함한다.
- 작업 완료 보고 형식을 적는다.
- `index.md`와 `log.md` 갱신 규칙을 넣는다.
- secret 저장 금지 규칙을 넣는다.

## 필수 명령어

```text
save
ingest
query
reference
lint
```

권장 설명:

```markdown
- `save`: 현재 작업 맥락을 저장한다.
- `ingest`: raw 자료를 wiki 자료로 가공한다.
- `query`: 기존 wiki와 log를 참조한다.
- `reference`: `query`와 동일하게 기존 wiki, index, log를 참조해 맥락을 복원한다.
- `lint`: vault 구조와 규칙 위반을 점검한다.
```

## 자연어 해석 규칙

AI는 사용자의 자연어를 아래처럼 해석해야 합니다.

```text
"옵시디언에 저장해줘" -> save
"이 내용 위키에 남겨줘" -> save
"이 자료 정리해줘" -> ingest
"이전 맥락 찾아줘" -> query
"옵시디언 참조해줘" -> reference
"위키 점검해줘" -> lint
```

## log.md와 timeline.md 역할 분리

둘을 섞으면 wiki가 금방 지저분해집니다.

```markdown
- `log.md`: append-only one-line record for wiki commands such as `save`, `ingest`, `query`, `reference`, and `lint`.
- `timeline.md`: human-readable development timeline for code changes, deployments, verification results, product decisions, and release notes.
```

## 좋은 완료 보고 형식

에이전트는 작업 완료 시 아래를 보고합니다.

```markdown
완료한 작업:
- 생성/수정한 파일
- 참조한 파일
- 실행한 검증 명령
- 저장하지 않은 정보와 그 이유
- 다음 세션에서 먼저 확인할 문서
```

## 금지 규칙

- raw 원본 수정 금지
- secret, token, OAuth secret, API key 저장 금지
- 불확실한 추측을 결정사항처럼 저장 금지
- `index.md`에 없는 중요한 wiki 문서 방치 금지
- `log.md` 없이 중요한 save/ingest 완료 처리 금지
