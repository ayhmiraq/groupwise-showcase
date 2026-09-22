REVOKE EXECUTE ON FUNCTION public.admin_export_database() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_storage_manifest() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_usage_stats() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_export_database() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_storage_manifest() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_usage_stats() TO authenticated;