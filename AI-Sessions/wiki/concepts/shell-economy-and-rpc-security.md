---
type: concept
date: 2026-06-03
status: active
author: Antigravity
---

# Shell Economy and RPC Security

## Summary

`Shell Economy and RPC Security`는 Balance Island의 가상 재화인 **조개(Shell)** 경제 시스템의 보상/소비 설계 규칙과, 이를 둘러싼 Supabase 보안 및 RPC(Remote Procedure Call) 구현 규칙을 규정합니다.

## Context

모바일 클라이언트에서 재화 조작이 불가능하도록 비즈니스 로직과 데이터 검증을 모두 데이터베이스(Supabase RPC) 레벨로 격리하고, 중복 지급을 원천 방지하는 멱등성(Idempotency) 구조를 제공합니다.

## Details

### 1. 조개 획득 및 사용 규칙 (Reward & Sink)

- **보상 (Reward Sources):**
  - 일일 출석 (`claim_daily_checkin`): 10 조개
  - 오늘 첫 투표: 5 조개
  - 일반 투표 1회: 1 조개
  - 일일 투표 목표 달성 (오늘 7회 또는 10회 참여): 20 조개
  - 리액션/댓글 및 질문 작성 승인 보상 등
- **소비처 (Sinks):**
  - 펫 케어 (간식/놀기/칭찬): 10 조개 소모
  - 아바타 꾸미기 및 섬 데코 아이템 구매: 50 ~ 500 조개 소모
  - 섬 구역 확장: 레벨 조건 + 1,000 조개 소모

### 2. 조개 원장 및 멱등성 보장 (`shell_ledger`)

- `profiles.shell_balance`는 빠른 조회를 위한 잔액 캐시 필드이며, 실제 재화 증감의 진실의 원천은 `shell_ledger` 테이블입니다.
- **테이블 구성:** `id`, `user_id`, `amount`, `reason`, `source_type`, `source_id`, `idempotency_key`, `created_at`
- **멱등성 검증:** 출석 보상이나 목표 달성 보상 등 중복 실행 우려가 있는 트랜잭션은 `idempotency_key` (예: `checkin:user_id:YYYY-MM-DD` 등)에 유니크 제약을 걸어 중복 삽입 시 SQL 에러를 발생시킴으로써 중복 지급을 원천 방지합니다.

### 3. RPC 보안 원칙 (Security Rules)

- **`auth.uid()` 강제:** 클라이언트가 `user_id`를 파라미터로 넘겨 타인의 데이터를 조작하는 것을 절대 금지하며, 모든 보안 정책은 RPC 내부에서 `auth.uid()`를 추출하여 소유권을 검증해야 합니다.
- **직접 쓰기 차단 (No Direct Write):** `profiles.shell_balance`, `user_inventory_items`, `user_avatar_state` 등 핵심 경제/성장 데이터 테이블은 RLS(Row-Level Security)를 통해 클라이언트의 직접적인 INSERT/UPDATE/DELETE를 차단하고, `SECURITY DEFINER`가 적용된 신뢰할 수 있는 RPC 함수를 통해서만 수정이 가능하도록 제한합니다.
- **잔액 검증 및 원자성:** 조개 소모 RPC(예: `purchase_decor_item`)에서는 단일 SQL UPDATE 트랜잭션 조건절(`WHERE id = auth.uid() AND shell_balance >= price`)을 사용하여 Race Condition을 방지하고, 잔액이 부족하면 예외(`RAISE EXCEPTION`)를 발생시킵니다.

## Links

- [[AI-Sessions/wiki/projects/balance-island-overview|Balance Island Overview]]
- [[AI-Sessions/wiki/concepts/bipi-personality-system|BIPI Personality System]]
- [[AI-Sessions/wiki/sources/2026-06-03-comprehensive-review|2026-06-03 Comprehensive Review]]
