ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;