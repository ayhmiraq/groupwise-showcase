REVOKE EXECUTE ON FUNCTION public.admin_usage_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_usage_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_usage_stats() TO authenticated;