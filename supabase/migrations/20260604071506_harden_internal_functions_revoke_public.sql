-- 기본 PUBLIC EXECUTE까지 회수해야 anon/authenticated 접근이 실제로 차단된다.
-- 이 함수들은 트리거(definer 권한) 또는 다른 definer 함수 내부에서만 호출되므로 영향 없음.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_gamification_state(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_shell_delta(uuid, integer, text, text, uuid, text) FROM PUBLIC;;
