-- 경제 보안 구멍 차단: 내부 전용 SECURITY DEFINER 함수의 공개 EXECUTE 회수.
-- ✅ 2026-06-04 라이브(ztcexgnelqtdzinfgoja)에 Supabase MCP로 적용·검증 완료.
--
-- 배경: apply_shell_delta(p_user_id, p_amount, ...)는 auth.uid() 가드 없이 호출자 지정
-- user_id/amount로 셸 잔액을 변경하는데 anon/authenticated가 /rest/v1/rpc로 직접 호출 가능했음
-- → 임의 계정에 셸 무한 발급 가능한 취약점. Supabase security advisor(0028/0029)로 확인.
--
-- 이 함수들은 submit_vote 등 다른 SECURITY DEFINER 함수와 auth 트리거(definer 권한)에서만
-- 호출되므로, 공개 EXECUTE를 회수해도 정상 동작에는 영향이 없다.
-- (기본 PUBLIC 권한까지 회수해야 anon/authenticated가 실제로 차단됨 → has_function_privilege로 검증)

REVOKE EXECUTE ON FUNCTION public.apply_shell_delta(uuid, integer, text, text, uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_gamification_state(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;
