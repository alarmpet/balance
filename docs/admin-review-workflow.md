# Admin Review Workflow

이 문서는 사용자 제출 질문을 비용 없이 검수하는 로컬 관리자 흐름이다. 외부 AI API를 호출하지 않고, Supabase pending 질문을 로컬로 내려받아 규칙 기반 판정을 붙인다.

## 전제

라이브 DB에는 다음 migration이 적용되어 있어야 한다.

- `supabase/migrations/202606041900_question_submission_queue.sql`
- `supabase/migrations/202606041930_security_advisory_rls_search_path.sql`

적용 후 SQL Editor에서 보조 기록을 확인한다.

```sql
select version, name, applied_at
from public.schema_migrations
where version in ('202606041900', '202606041930')
order by version;
```

두 row가 모두 보여야 한다. 이 테이블은 운영 확인용 보조 기록이며, 실제 적용 기준은 `supabase/migrations/*` 파일이다.

로컬 PC에는 아래 환경 변수를 세션에만 설정한다. service role key는 `.env`, 소스 코드, 채팅, git 기록에 남기지 않는다.

```powershell
$env:SUPABASE_URL = "https://ztcexgnelqtdzinfgoja.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<local-only-service-role-key>"
```

## Pending 질문 내려받기

JSONL로 저장:

```powershell
npm run admin:export-pending -- --out data/question-review/pending.latest.jsonl
```

Telegram 메시지용 요약 출력:

```powershell
npm run admin:export-pending -- --telegram
```

상위 20개만 가져오기:

```powershell
npm run admin:export-pending -- --limit 20 --out data/question-review/pending.latest.jsonl
```

## 로컬 규칙 검증

rubric 예시 24개가 기대 판정과 맞는지 확인한다.

```powershell
npm run validate:question-review
```

## 판정 후 처리

- `approve_candidate`: 이미지 제작 후 관리자 페이지에서 A/B 이미지와 trait를 채우고 승인한다.
- `needs_edit`: 질문 문장 또는 선택지 균형을 수정한 뒤 재검토한다.
- `needs_human_review`: 민감 주제 가능성이 있으므로 사람이 먼저 본다.
- `reject_candidate`: 공개하지 않는다. 원문은 반복 악용 패턴 확인을 위해 보존할 수 있다.

## 운영 원칙

- pending 질문은 피드에 노출하지 않는다.
- 이미지가 없는 질문은 승인하지 않는다.
- trait는 A/B 양쪽에 최소 1개씩 있어야 한다.
- 자동 판정이 애매하면 `needs_human_review`로 올린다.
