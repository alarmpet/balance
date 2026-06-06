-- 내부 전용 SECURITY DEFINER 함수의 공개 EXECUTE 권한 회수.
-- apply_shell_delta는 호출자 지정 user_id/amount로 셸을 변경하는데 auth.uid() 가드가 없어
-- anon/authenticated가 직접 호출하면 임의 계정에 셸을 무한 발급할 수 있는 구멍이었음.
-- 이 함수들은 submit_vote 등 다른 SECURITY DEFINER 함수와 트리거(definer 권한)에서만 호출되므로
-- 공개 EXECUTE를 회수해도 정상 동작에는 영향이 없다.

REVOKE EXECUTE ON FUNCTION public.apply_shell_delta(uuid, integer, text, text, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_gamification_state(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;;
