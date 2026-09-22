CREATE OR REPLACE FUNCTION public.admin_export_database()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  out_sql text := '';
  rec record;
  cols_list text;
  cols_expr text;
  ddl text;
  pk text;
  data_sql text;
  roles_txt text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  out_sql := '-- Full Supabase migration dump generated at ' || now()::text || E'\n'
    || E'-- Target: Supabase Self-Hosted\n'
    || E'-- Import order: run this file once with: psql -f backup.sql\n'
    || E'-- Sections: extensions, enums, tables, data, constraints, indexes, grants, RLS, policies, functions, triggers, auth users, storage\n\n'
    || E'SET session_replication_role = replica;\n\n';

  -- 1. extensions
  out_sql := out_sql || E'---------- EXTENSIONS ----------\n';
  FOR rec IN
    SELECT e.extname, n.nspname
    FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname <> 'plpgsql'
  LOOP
    out_sql := out_sql || format(E'CREATE EXTENSION IF NOT EXISTS %I WITH SCHEMA %I;\n', rec.extname, rec.nspname);
  END LOOP;
  out_sql := out_sql || E'\n---------- ENUM TYPES ----------\n';

  -- 2. enum types
  FOR rec IN
    SELECT t.typname AS name,
           string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
  LOOP
    out_sql := out_sql || format(
      E'DO $do$ BEGIN CREATE TYPE public.%I AS ENUM (%s); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;\n',
      rec.name, rec.labels);
  END LOOP;

  out_sql := out_sql || E'\n---------- TABLES + DATA ----------\n';

  FOR rec IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  LOOP
    SELECT string_agg(
             format('  %I %s%s%s', a.attname,
                    format_type(a.atttypid, a.atttypmod),
                    CASE WHEN d.adbin IS NOT NULL
                         THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) ELSE '' END,
                    CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END),
             E',\n' ORDER BY a.attnum)
      INTO ddl
    FROM pg_attribute a
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = format('public.%I', rec.tbl)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped;

    SELECT ',' || E'\n  PRIMARY KEY (' || string_agg(quote_ident(a.attname), ', ') || ')'
      INTO pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
    WHERE i.indrelid = format('public.%I', rec.tbl)::regclass AND i.indisprimary;

    out_sql := out_sql || format(E'CREATE TABLE IF NOT EXISTS public.%I (\n%s%s\n);\n',
                                 rec.tbl, ddl, COALESCE(pk, ''));

    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum),
           string_agg(format('quote_nullable(%I::text)', a.attname), ' || '', '' || ' ORDER BY a.attnum)
      INTO cols_list, cols_expr
    FROM pg_attribute a
    WHERE a.attrelid = format('public.%I', rec.tbl)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped;

    EXECUTE format(
      'SELECT string_agg(%L || (%s) || %L, E''\n'') FROM public.%I',
      format('INSERT INTO public.%I (%s) VALUES (', rec.tbl, cols_list),
      cols_expr,
      ') ON CONFLICT DO NOTHING;',
      rec.tbl
    ) INTO data_sql;

    IF data_sql IS NOT NULL THEN
      out_sql := out_sql || data_sql || E'\n';
    END IF;

    out_sql := out_sql || E'\n';
  END LOOP;

  -- 3. constraints (unique / check / foreign keys) after data
  out_sql := out_sql || E'---------- CONSTRAINTS ----------\n';
  FOR rec IN
    SELECT c.conname, cl.relname AS tbl, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE n.nspname = 'public' AND c.contype IN ('f','u','c')
    ORDER BY c.contype DESC, cl.relname
  LOOP
    out_sql := out_sql || format(
      E'DO $do$ BEGIN ALTER TABLE public.%I ADD CONSTRAINT %I %s; EXCEPTION WHEN duplicate_object THEN NULL WHEN duplicate_table THEN NULL END $do$;\n',
      rec.tbl, rec.conname, rec.def);
  END LOOP;

  -- 4. indexes
  out_sql := out_sql || E'\n---------- INDEXES ----------\n';
  FOR rec IN
    SELECT indexdef FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT IN (
        SELECT c.conname FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = cl.relnamespace
        WHERE n.nspname = 'public')
  LOOP
    out_sql := out_sql || replace(rec.indexdef, 'CREATE INDEX', 'CREATE INDEX IF NOT EXISTS')
      || E';\n';
  END LOOP;

  -- 5. functions
  out_sql := out_sql || E'\n---------- FUNCTIONS ----------\n';
  FOR rec IN
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public' AND d.objid IS NULL AND p.prokind = 'f'
  LOOP
    out_sql := out_sql || rec.def || E';\n\n';
  END LOOP;

  -- 6. triggers
  out_sql := out_sql || E'---------- TRIGGERS ----------\n';
  FOR rec IN
    SELECT t.tgname, cl.relname AS tbl, pg_get_triggerdef(t.oid) AS def
    FROM pg_trigger t
    JOIN pg_class cl ON cl.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal
  LOOP
    out_sql := out_sql || format(E'DROP TRIGGER IF EXISTS %I ON public.%I;\n%s;\n', rec.tgname, rec.tbl, rec.def);
  END LOOP;

  -- 7. grants
  out_sql := out_sql || E'\n---------- GRANTS ----------\n';
  FOR rec IN
    SELECT table_name, grantee, string_agg(DISTINCT privilege_type, ', ') AS privs
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','service_role')
    GROUP BY table_name, grantee
    ORDER BY table_name, grantee
  LOOP
    out_sql := out_sql || format(E'GRANT %s ON public.%I TO %I;\n', rec.privs, rec.table_name, rec.grantee);
  END LOOP;
  FOR rec IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public' AND d.objid IS NULL AND p.prokind = 'f'
  LOOP
    out_sql := out_sql || format(E'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role;\n', rec.proname, rec.args);
  END LOOP;

  -- 8. RLS + policies
  out_sql := out_sql || E'\n---------- ROW LEVEL SECURITY ----------\n';
  FOR rec IN
    SELECT c.relname AS tbl FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
  LOOP
    out_sql := out_sql || format(E'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;\n', rec.tbl);
  END LOOP;

  out_sql := out_sql || E'\n---------- POLICIES ----------\n';
  FOR rec IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies WHERE schemaname IN ('public','storage')
    ORDER BY schemaname, tablename, policyname
  LOOP
    roles_txt := array_to_string(rec.roles, ', ');
    out_sql := out_sql
      || format(E'DROP POLICY IF EXISTS %I ON %I.%I;\n', rec.policyname, rec.schemaname, rec.tablename)
      || format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
                rec.policyname, rec.schemaname, rec.tablename,
                rec.permissive, rec.cmd, roles_txt)
      || COALESCE(' USING (' || rec.qual || ')', '')
      || COALESCE(' WITH CHECK (' || rec.with_check || ')', '')
      || E';\n';
  END LOOP;

  -- 9. auth users (password hashes included so logins keep working)
  out_sql := out_sql || E'\n---------- AUTH USERS ----------\n'
    || E'-- Requires the auth schema to exist (self-hosted Supabase creates it via GoTrue migrations).\n';
  FOR rec IN
    SELECT * FROM (VALUES ('auth','users'), ('auth','identities'), ('storage','buckets')) AS v(sch, tbl)
  LOOP
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum),
           string_agg(format('quote_nullable(%I::text)', a.attname), ' || '', '' || ' ORDER BY a.attnum)
      INTO cols_list, cols_expr
    FROM pg_attribute a
    WHERE a.attrelid = format('%I.%I', rec.sch, rec.tbl)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped
      AND a.attgenerated = '';

    EXECUTE format(
      'SELECT string_agg(%L || (%s) || %L, E''\n'') FROM %I.%I',
      format('INSERT INTO %I.%I (%s) VALUES (', rec.sch, rec.tbl, cols_list),
      cols_expr,
      ') ON CONFLICT DO NOTHING;',
      rec.sch, rec.tbl
    ) INTO data_sql;

    out_sql := out_sql || format(E'\n-- %s.%s\n', rec.sch, rec.tbl) || COALESCE(data_sql, '-- (empty)') || E'\n';
  END LOOP;

  -- 10. storage object metadata
  out_sql := out_sql || E'\n---------- STORAGE OBJECT METADATA ----------\n'
    || E'-- Copy the physical files first, then run these rows so paths resolve.\n';
  SELECT string_agg(
    format('INSERT INTO storage.objects (id, bucket_id, name, owner, metadata, created_at, updated_at, last_accessed_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;',
      quote_nullable(id::text), quote_nullable(bucket_id), quote_nullable(name), quote_nullable(owner::text),
      quote_nullable(metadata::text), quote_nullable(created_at::text), quote_nullable(updated_at::text),
      quote_nullable(last_accessed_at::text)), E'\n')
    INTO data_sql
  FROM storage.objects;
  out_sql := out_sql || COALESCE(data_sql, '-- (no files)') || E'\n';

  out_sql := out_sql || E'\nSET session_replication_role = DEFAULT;\n';

  RETURN out_sql;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_storage_manifest()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'buckets', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', b.id, 'name', b.name, 'public', b.public,
        'file_size_limit', b.file_size_limit,
        'allowed_mime_types', b.allowed_mime_types)), '[]'::jsonb) FROM storage.buckets b),
    'objects', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'bucket', o.bucket_id, 'name', o.name,
        'size', (o.metadata->>'size')::bigint,
        'mimetype', o.metadata->>'mimetype') ORDER BY o.bucket_id, o.name), '[]'::jsonb) FROM storage.objects o)
  ) INTO result;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_export_database() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_storage_manifest() TO authenticated;