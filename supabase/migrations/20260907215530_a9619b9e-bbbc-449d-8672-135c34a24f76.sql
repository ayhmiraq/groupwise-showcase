CREATE OR REPLACE FUNCTION public.admin_usage_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'database_bytes', pg_database_size(current_database()),
    'storage_total_bytes', COALESCE(SUM((o.metadata->>'size')::bigint), 0),
    'image_bytes', COALESCE(SUM(CASE WHEN o.metadata->>'mimetype' LIKE 'image/%' THEN (o.metadata->>'size')::bigint ELSE 0 END), 0),
    'video_bytes', COALESCE(SUM(CASE WHEN o.metadata->>'mimetype' LIKE 'video/%' THEN (o.metadata->>'size')::bigint ELSE 0 END), 0),
    'other_bytes', COALESCE(SUM(CASE WHEN o.metadata->>'mimetype' NOT LIKE 'image/%' AND o.metadata->>'mimetype' NOT LIKE 'video/%' THEN (o.metadata->>'size')::bigint ELSE 0 END), 0),
    'image_count', COUNT(*) FILTER (WHERE o.metadata->>'mimetype' LIKE 'image/%'),
    'video_count', COUNT(*) FILTER (WHERE o.metadata->>'mimetype' LIKE 'video/%'),
    'object_count', COUNT(*),
    'file_size_limit', (SELECT MAX(b.file_size_limit) FROM storage.buckets b)
  )
  INTO result
  FROM storage.objects o;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_usage_stats() TO authenticated;