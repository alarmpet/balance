# 06. Validation And Security

Obsidian AI Wiki는 사람이 읽기 좋은 문서 시스템이지만, 장기 운영에는 자동 검증이 필요합니다.

## validate:wiki가 확인해야 하는 것

필수 검사:

- required root files 존재
- required directories 존재
- `AGENTS.md`와 `CLAUDE.md`에 명령어 5개 존재
- `index.md`에 prompt library 링크 존재
- `AI-Sessions/wiki/**/*.md`가 YAML frontmatter로 시작
- frontmatter 닫는 `---` 존재
- `source:`가 파일 경로라면 실제 파일 존재
- secret-like text 존재 여부

권장 검사:

- `.obsidian/workspace.json`이 staged되지 않았는지
- `AI-Sessions/raw/`를 validator가 수정하지 않는지
- `AI-Sessions/conversations/`는 secret scan 오탐을 피하도록 별도 처리
- `docs/*.md`와 wiki 자료의 중복/충돌 여부는 수동 lint로 확인

## secret lint 설계

나쁜 secret lint:

```js
/client[_-]?secret/i
```

이 방식은 "Client Secret을 노출하지 마라" 같은 보안 정책 문구까지 유출로 오탐합니다.

좋은 secret lint:

```js
/(?:api[_-]?key|client[_-]?secret|password|token)\s*[:=]\s*["'][^"']{16,}["']/i
```

실제 값이 붙은 할당 형태만 실패로 봅니다.

추가로 직접적인 token prefix를 검사합니다.

```js
/sk-[A-Za-z0-9_-]{20,}/
/sbp_[A-Za-z0-9_-]{20,}/
/sb_secret_[A-Za-z0-9_-]{20,}/
/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/
```

## scan 제외 권장 범위

secret scan 제외:

```text
node_modules/
.git/
dist/
AI-Sessions/raw/
AI-Sessions/conversations/
docs/
prompts/
AGENTS.md
CLAUDE.md
README.md
START_HERE.md
TEMPLATE_MANIFEST.md
LICENSE.md
```

이 제외는 "검사를 하지 않는다"는 뜻이 아니라, 자동 정규식 오탐을 줄이기 위한 것입니다. 커밋 전에는 필요하면 raw와 conversations를 별도로 사람이 확인합니다.

## BOM과 인코딩

wiki 문서는 가능하면 UTF-8 without BOM으로 저장합니다.

특히 frontmatter 검사는 파일의 첫 3 bytes가 아래인지 확인하면 좋습니다.

```text
2D 2D 2D
```

이는 `---`입니다. 첫 bytes가 `EF BB BF`라면 UTF-8 BOM이 붙은 상태입니다.

## 커밋 전 금지 파일 필터

커밋 전 staged 파일을 확인합니다.

```powershell
git diff --cached --name-only
```

아래가 포함되면 중단합니다.

```text
.supabase-access-token.txt
.obsidian/workspace.json
.obsidian/workspace-mobile.json
*.png
docs/*.md 중 아직 검토하지 않은 로컬 자료
```

## 권장 검증 순서

```powershell
npm.cmd run validate:wiki
npm.cmd run typecheck
git diff --cached --check
git diff --cached --name-only
```

앱별 검증 명령이 있으면 `validate:wiki`와 함께 돌립니다.
