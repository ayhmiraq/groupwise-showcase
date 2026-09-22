CREATE OR REPLACE FUNCTION public.admin_export_database()
RETURNS text
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  out_sql text := '';
  rec record;
  cols_list text;
  cols_expr text;
  ddl text;
  pk text;
  data_sql text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  out_sql := '-- Database backup generated at ' || now()::text || E'\n'
    || E'-- Import with: psql -f backup.sql\n\n'
    || E'CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n';

  -- enum types
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
      E'DO $$ BEGIN CREATE TYPE public.%I AS ENUM (%s); EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n',
      rec.name, rec.labels);
  END LOOP;

  out_sql := out_sql || E'\n';

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

  RETURN out_sql;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_export_database() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_export_database() TO authenticated;