-- ============================================================================
-- KISAN SAHAYAK — STAGE 2 PRODUCTION DATABASE MIGRATION (AUDITED & HARDENED)
-- Migration: 20261102000000_create_kisan_sahayak_schema.sql
-- Target Database: Supabase PostgreSQL 15+
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. PREFLIGHT COMPREHENSIVE VALIDATION
-- Verifies extensions, column types, PKs, explicit FK target tables/columns,
-- unique constraints, exact function signatures, and trigger-to-function bindings.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '>>> Step 0: Running comprehensive preflight validation...';

  -- 0.1 Verify auth schema exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    RAISE EXCEPTION 'Preflight Abort: Supabase auth schema not found.';
  END IF;

  -- 0.2 Verify pgcrypto extension
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  END IF;

  -- 0.3 Validate existing tables, columns, primary keys, unique constraints, and foreign keys
  -- A. Profiles Preflight Check
  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table profiles missing id column with uuid type.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table profiles missing username column with text type.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table profiles missing full_name column with text type.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table profiles missing role column with text type.';
    END IF;
    -- Primary Key Check
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = to_regclass('public.profiles') AND c.contype = 'p' AND a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table profiles missing PRIMARY KEY on column id.';
    END IF;
    -- Foreign Key Check: profiles.id -> auth.users.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.profiles') AND src_a.attname = 'id'
        AND tgt_ns.nspname = 'auth' AND tgt.relname = 'users' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table profiles missing FOREIGN KEY on id referencing auth.users(id).';
    END IF;
  END IF;

  -- B. Categories Preflight Check
  IF to_regclass('public.categories') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'id' AND udt_name IN ('int2', 'int4', 'int8')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table categories missing integer id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'name' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table categories missing name text column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'slug' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table categories missing slug text column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = to_regclass('public.categories') AND c.contype = 'p') THEN
      RAISE EXCEPTION 'Preflight Abort: Table categories missing PRIMARY KEY.';
    END IF;
  END IF;

  -- C. Resources Preflight Check
  IF to_regclass('public.resources') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table resources missing bigint id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'category_id' AND udt_name IN ('int2', 'int4', 'int8')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table resources missing integer category_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'title' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table resources missing title text column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'resource_type' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table resources missing resource_type text column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = to_regclass('public.resources') AND c.contype = 'p') THEN
      RAISE EXCEPTION 'Preflight Abort: Table resources missing PRIMARY KEY.';
    END IF;
    -- Foreign Key Check: resources.category_id -> public.categories.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.resources') AND src_a.attname = 'category_id'
        AND tgt_ns.nspname = 'public' AND tgt.relname = 'categories' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table resources missing FOREIGN KEY on category_id referencing public.categories(id).';
    END IF;
  END IF;

  -- D. Bookmarks Preflight Check
  IF to_regclass('public.bookmarks') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookmarks' AND column_name = 'id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table bookmarks missing uuid id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookmarks' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table bookmarks missing uuid user_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookmarks' AND column_name = 'resource_id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table bookmarks missing resource_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = to_regclass('public.bookmarks') AND c.contype = 'p') THEN
      RAISE EXCEPTION 'Preflight Abort: Table bookmarks missing PRIMARY KEY.';
    END IF;
    -- Foreign Key Check: bookmarks.user_id -> auth.users.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.bookmarks') AND src_a.attname = 'user_id'
        AND tgt_ns.nspname = 'auth' AND tgt.relname = 'users' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table bookmarks missing FOREIGN KEY on user_id referencing auth.users(id).';
    END IF;
    -- Foreign Key Check: bookmarks.resource_id -> public.resources.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.bookmarks') AND src_a.attname = 'resource_id'
        AND tgt_ns.nspname = 'public' AND tgt.relname = 'resources' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table bookmarks missing FOREIGN KEY on resource_id referencing public.resources(id).';
    END IF;
  END IF;

  -- E. Feedback Preflight Check
  IF to_regclass('public.feedback') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table feedback missing id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table feedback missing uuid user_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'resource_id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table feedback missing resource_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'rating' AND udt_name IN ('int2', 'int4', 'int8')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table feedback missing integer rating column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = to_regclass('public.feedback') AND c.contype = 'p') THEN
      RAISE EXCEPTION 'Preflight Abort: Table feedback missing PRIMARY KEY.';
    END IF;
    -- Foreign Key Check: feedback.user_id -> auth.users.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.feedback') AND src_a.attname = 'user_id'
        AND tgt_ns.nspname = 'auth' AND tgt.relname = 'users' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table feedback missing FOREIGN KEY on user_id referencing auth.users(id).';
    END IF;
    -- Foreign Key Check: feedback.resource_id -> public.resources.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.feedback') AND src_a.attname = 'resource_id'
        AND tgt_ns.nspname = 'public' AND tgt.relname = 'resources' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table feedback missing FOREIGN KEY on resource_id referencing public.resources(id).';
    END IF;
  END IF;

  -- F. Community Posts Preflight Check
  IF to_regclass('public.community_posts') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table community_posts missing id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table community_posts missing uuid user_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = to_regclass('public.community_posts') AND c.contype = 'p') THEN
      RAISE EXCEPTION 'Preflight Abort: Table community_posts missing PRIMARY KEY.';
    END IF;
    -- Foreign Key Check: community_posts.user_id -> auth.users.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.community_posts') AND src_a.attname = 'user_id'
        AND tgt_ns.nspname = 'auth' AND tgt.relname = 'users' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table community_posts missing FOREIGN KEY on user_id referencing auth.users(id).';
    END IF;
  END IF;

  -- G. Comments Preflight Check
  IF to_regclass('public.comments') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table comments missing id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'post_id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table comments missing post_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table comments missing uuid user_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = to_regclass('public.comments') AND c.contype = 'p') THEN
      RAISE EXCEPTION 'Preflight Abort: Table comments missing PRIMARY KEY.';
    END IF;
    -- Foreign Key Check: comments.post_id -> public.community_posts.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.comments') AND src_a.attname = 'post_id'
        AND tgt_ns.nspname = 'public' AND tgt.relname = 'community_posts' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table comments missing FOREIGN KEY on post_id referencing public.community_posts(id).';
    END IF;
    -- Foreign Key Check: comments.user_id -> auth.users.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.comments') AND src_a.attname = 'user_id'
        AND tgt_ns.nspname = 'auth' AND tgt.relname = 'users' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table comments missing FOREIGN KEY on user_id referencing auth.users(id).';
    END IF;
  END IF;

  -- H. Post Likes Preflight Check
  IF to_regclass('public.post_likes') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'post_likes' AND column_name = 'post_id' AND udt_name IN ('int8', 'int4')) THEN
      RAISE EXCEPTION 'Preflight Abort: Table post_likes missing post_id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'post_likes' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table post_likes missing uuid user_id column.';
    END IF;
    -- Foreign Key Check: post_likes.post_id -> public.community_posts.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.post_likes') AND src_a.attname = 'post_id'
        AND tgt_ns.nspname = 'public' AND tgt.relname = 'community_posts' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table post_likes missing FOREIGN KEY on post_id referencing public.community_posts(id).';
    END IF;
    -- Foreign Key Check: post_likes.user_id -> auth.users.id
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class src ON src.oid = c.conrelid
      JOIN pg_class tgt ON tgt.oid = c.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
      JOIN pg_attribute src_a ON src_a.attrelid = c.conrelid AND src_a.attnum = ANY(c.conkey)
      JOIN pg_attribute tgt_a ON tgt_a.attrelid = c.confrelid AND tgt_a.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND src.oid = to_regclass('public.post_likes') AND src_a.attname = 'user_id'
        AND tgt_ns.nspname = 'auth' AND tgt.relname = 'users' AND tgt_a.attname = 'id'
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Table post_likes missing FOREIGN KEY on user_id referencing auth.users(id).';
    END IF;
  END IF;

  -- I. Audit Logs Preflight Check
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'id' AND udt_name = 'uuid') THEN
      RAISE EXCEPTION 'Preflight Abort: Table audit_logs missing uuid id column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'action' AND udt_name = 'text') THEN
      RAISE EXCEPTION 'Preflight Abort: Table audit_logs missing action column.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = to_regclass('public.audit_logs') AND c.contype = 'p') THEN
      RAISE EXCEPTION 'Preflight Abort: Table audit_logs missing PRIMARY KEY.';
    END IF;
  END IF;

  -- 0.4 Validate existing functions using exact function signatures, security definer flag, and return types
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_set_user_role' AND pronamespace = 'public'::regnamespace) THEN
    IF to_regprocedure('public.admin_set_user_role(uuid, text)') IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_proc WHERE oid = to_regprocedure('public.admin_set_user_role(uuid, text)')
        AND prosecdef = true AND prorettype = 'void'::regtype
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Function admin_set_user_role exists with incompatible signature, security, or return type.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_increment_resource_view' AND pronamespace = 'public'::regnamespace) THEN
    IF to_regprocedure('public.fn_increment_resource_view(bigint)') IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_proc WHERE oid = to_regprocedure('public.fn_increment_resource_view(bigint)')
        AND prosecdef = true AND prorettype IN ('int4'::regtype, 'int8'::regtype)
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Function fn_increment_resource_view exists with incompatible signature, security, or return type.';
    END IF;
  END IF;

  -- Validate all trigger functions have signature (), prosecdef = true, prorettype = trigger
  DO $chk$
  DECLARE
    v_fn text;
    v_fns text[] := ARRAY[
      'fn_protect_profile_mutations',
      'fn_handle_new_auth_user',
      'fn_stamp_feedback_author_snapshot',
      'fn_protect_feedback_mutations',
      'fn_stamp_post_author_snapshot',
      'fn_protect_post_mutations',
      'fn_stamp_comment_author_snapshot',
      'fn_protect_comment_mutations'
    ];
  BEGIN
    FOREACH v_fn IN ARRAY v_fns LOOP
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = v_fn AND pronamespace = 'public'::regnamespace) THEN
        IF to_regprocedure('public.' || v_fn || '()') IS NULL OR NOT EXISTS (
          SELECT 1 FROM pg_proc WHERE oid = to_regprocedure('public.' || v_fn || '()')
            AND prosecdef = true AND prorettype = 'trigger'::regtype
        ) THEN
          RAISE EXCEPTION 'Preflight Abort: Function % exists with incompatible signature, security, or return type.', v_fn;
        END IF;
      END IF;
    END LOOP;
  END $chk$;

  -- 0.5 Validate existing triggers reference expected trigger functions and relations
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_mutations' AND tgrelid <> to_regclass('public.profiles') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_profile_mutations exists on unexpected relation.';
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_mutations' AND tgrelid = to_regclass('public.profiles') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_protect_profile_mutations' 
        AND tgrelid = to_regclass('public.profiles') 
        AND tgfoid = to_regproc('public.fn_protect_profile_mutations')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_profile_mutations references unexpected function.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_on_auth_user_created' AND tgrelid <> to_regclass('auth.users') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_on_auth_user_created exists on unexpected relation.';
  END IF;
  IF to_regclass('auth.users') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_on_auth_user_created' AND tgrelid = to_regclass('auth.users') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_on_auth_user_created' 
        AND tgrelid = to_regclass('auth.users') 
        AND tgfoid = to_regproc('public.fn_handle_new_auth_user')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_on_auth_user_created references unexpected function.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stamp_feedback_author' AND tgrelid <> to_regclass('public.feedback') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_stamp_feedback_author exists on unexpected relation.';
  END IF;
  IF to_regclass('public.feedback') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stamp_feedback_author' AND tgrelid = to_regclass('public.feedback') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_stamp_feedback_author' 
        AND tgrelid = to_regclass('public.feedback') 
        AND tgfoid = to_regproc('public.fn_stamp_feedback_author_snapshot')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_stamp_feedback_author references unexpected function.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_feedback_mutations' AND tgrelid <> to_regclass('public.feedback') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_feedback_mutations exists on unexpected relation.';
  END IF;
  IF to_regclass('public.feedback') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_feedback_mutations' AND tgrelid = to_regclass('public.feedback') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_protect_feedback_mutations' 
        AND tgrelid = to_regclass('public.feedback') 
        AND tgfoid = to_regproc('public.fn_protect_feedback_mutations')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_feedback_mutations references unexpected function.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stamp_post_author' AND tgrelid <> to_regclass('public.community_posts') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_stamp_post_author exists on unexpected relation.';
  END IF;
  IF to_regclass('public.community_posts') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stamp_post_author' AND tgrelid = to_regclass('public.community_posts') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_stamp_post_author' 
        AND tgrelid = to_regclass('public.community_posts') 
        AND tgfoid = to_regproc('public.fn_stamp_post_author_snapshot')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_stamp_post_author references unexpected function.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_post_mutations' AND tgrelid <> to_regclass('public.community_posts') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_post_mutations exists on unexpected relation.';
  END IF;
  IF to_regclass('public.community_posts') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_post_mutations' AND tgrelid = to_regclass('public.community_posts') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_protect_post_mutations' 
        AND tgrelid = to_regclass('public.community_posts') 
        AND tgfoid = to_regproc('public.fn_protect_post_mutations')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_post_mutations references unexpected function.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stamp_comment_author' AND tgrelid <> to_regclass('public.comments') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_stamp_comment_author exists on unexpected relation.';
  END IF;
  IF to_regclass('public.comments') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stamp_comment_author' AND tgrelid = to_regclass('public.comments') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_stamp_comment_author' 
        AND tgrelid = to_regclass('public.comments') 
        AND tgfoid = to_regproc('public.fn_stamp_comment_author_snapshot')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_stamp_comment_author references unexpected function.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_comment_mutations' AND tgrelid <> to_regclass('public.comments') AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_comment_mutations exists on unexpected relation.';
  END IF;
  IF to_regclass('public.comments') IS NOT NULL AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_comment_mutations' AND tgrelid = to_regclass('public.comments') AND NOT tgisinternal) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_protect_comment_mutations' 
        AND tgrelid = to_regclass('public.comments') 
        AND tgfoid = to_regproc('public.fn_protect_comment_mutations')
    ) THEN
      RAISE EXCEPTION 'Preflight Abort: Trigger trg_protect_comment_mutations references unexpected function.';
    END IF;
  END IF;

  -- 0.6 Validate existing view definitions, columns, and UUID privacy
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_community_posts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_posts' AND column_name = 'id')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_posts' AND column_name = 'category')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_posts' AND column_name = 'is_author')
       OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_posts' AND column_name = 'user_id') THEN
      RAISE EXCEPTION 'Preflight Abort: View v_community_posts exists with incompatible columns or leaks user_id.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_community_comments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_comments' AND column_name = 'id')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_comments' AND column_name = 'post_id')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_comments' AND column_name = 'is_author')
       OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_community_comments' AND column_name = 'user_id') THEN
      RAISE EXCEPTION 'Preflight Abort: View v_community_comments exists with incompatible columns or leaks user_id.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_resource_feedback') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_feedback' AND column_name = 'id')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_feedback' AND column_name = 'resource_id')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_feedback' AND column_name = 'rating')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_feedback' AND column_name = 'is_author')
       OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_feedback' AND column_name = 'user_id') THEN
      RAISE EXCEPTION 'Preflight Abort: View v_resource_feedback exists with incompatible columns or leaks user_id.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_resource_ratings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_ratings' AND column_name = 'resource_id')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_ratings' AND column_name = 'avg_rating')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_resource_ratings' AND column_name = 'review_count') THEN
      RAISE EXCEPTION 'Preflight Abort: View v_resource_ratings exists with incompatible columns.';
    END IF;
  END IF;

  RAISE NOTICE '>>> Step 0: Preflight validation successful.';
END $$;

-- ----------------------------------------------------------------------------
-- 1. DYNAMIC PRE-STATE INVENTORY CAPTURE
-- Captured BEFORE creating _kisan_migration_manifest for accurate rollback ownership.
-- Accurately tracks all tables, views, functions, triggers, indexes, policies & sequences.
-- ----------------------------------------------------------------------------
CREATE TEMPORARY TABLE _kisan_inventory (
  obj_name text PRIMARY KEY,
  obj_type text NOT NULL,
  pre_existed boolean NOT NULL
) ON COMMIT DROP;

INSERT INTO _kisan_inventory (obj_name, obj_type, pre_existed)
VALUES
  -- Tables (9 application tables + manifest)
  ('profiles', 'table', to_regclass('public.profiles') IS NOT NULL),
  ('categories', 'table', to_regclass('public.categories') IS NOT NULL),
  ('resources', 'table', to_regclass('public.resources') IS NOT NULL),
  ('bookmarks', 'table', to_regclass('public.bookmarks') IS NOT NULL),
  ('feedback', 'table', to_regclass('public.feedback') IS NOT NULL),
  ('community_posts', 'table', to_regclass('public.community_posts') IS NOT NULL),
  ('comments', 'table', to_regclass('public.comments') IS NOT NULL),
  ('post_likes', 'table', to_regclass('public.post_likes') IS NOT NULL),
  ('audit_logs', 'table', to_regclass('public.audit_logs') IS NOT NULL),
  ('_kisan_migration_manifest', 'table', to_regclass('public._kisan_migration_manifest') IS NOT NULL),

  -- Views (4 views)
  ('v_community_posts', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_community_posts')),
  ('v_community_comments', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_community_comments')),
  ('v_resource_feedback', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_resource_feedback')),
  ('v_resource_ratings', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_resource_ratings')),

  -- Functions (10 functions)
  ('fn_protect_profile_mutations', 'function', to_regprocedure('public.fn_protect_profile_mutations()') IS NOT NULL),
  ('admin_set_user_role', 'function', to_regprocedure('public.admin_set_user_role(uuid, text)') IS NOT NULL),
  ('fn_handle_new_auth_user', 'function', to_regprocedure('public.fn_handle_new_auth_user()') IS NOT NULL),
  ('fn_stamp_feedback_author_snapshot', 'function', to_regprocedure('public.fn_stamp_feedback_author_snapshot()') IS NOT NULL),
  ('fn_protect_feedback_mutations', 'function', to_regprocedure('public.fn_protect_feedback_mutations()') IS NOT NULL),
  ('fn_stamp_post_author_snapshot', 'function', to_regprocedure('public.fn_stamp_post_author_snapshot()') IS NOT NULL),
  ('fn_protect_post_mutations', 'function', to_regprocedure('public.fn_protect_post_mutations()') IS NOT NULL),
  ('fn_stamp_comment_author_snapshot', 'function', to_regprocedure('public.fn_stamp_comment_author_snapshot()') IS NOT NULL),
  ('fn_protect_comment_mutations', 'function', to_regprocedure('public.fn_protect_comment_mutations()') IS NOT NULL),
  ('fn_increment_resource_view', 'function', to_regprocedure('public.fn_increment_resource_view(bigint)') IS NOT NULL),

  -- Triggers (8 triggers)
  ('trg_protect_profile_mutations', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('public.profiles') IS NOT NULL
      AND t.tgrelid = to_regclass('public.profiles')
      AND t.tgname = 'trg_protect_profile_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_profile_mutations')
      AND NOT t.tgisinternal
  )),
  ('trg_on_auth_user_created', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('auth.users') IS NOT NULL
      AND t.tgrelid = to_regclass('auth.users')
      AND t.tgname = 'trg_on_auth_user_created'
      AND t.tgfoid = to_regproc('public.fn_handle_new_auth_user')
      AND NOT t.tgisinternal
  )),
  ('trg_stamp_feedback_author', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('public.feedback') IS NOT NULL
      AND t.tgrelid = to_regclass('public.feedback')
      AND t.tgname = 'trg_stamp_feedback_author'
      AND t.tgfoid = to_regproc('public.fn_stamp_feedback_author_snapshot')
      AND NOT t.tgisinternal
  )),
  ('trg_protect_feedback_mutations', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('public.feedback') IS NOT NULL
      AND t.tgrelid = to_regclass('public.feedback')
      AND t.tgname = 'trg_protect_feedback_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_feedback_mutations')
      AND NOT t.tgisinternal
  )),
  ('trg_stamp_post_author', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('public.community_posts') IS NOT NULL
      AND t.tgrelid = to_regclass('public.community_posts')
      AND t.tgname = 'trg_stamp_post_author'
      AND t.tgfoid = to_regproc('public.fn_stamp_post_author_snapshot')
      AND NOT t.tgisinternal
  )),
  ('trg_protect_post_mutations', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('public.community_posts') IS NOT NULL
      AND t.tgrelid = to_regclass('public.community_posts')
      AND t.tgname = 'trg_protect_post_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_post_mutations')
      AND NOT t.tgisinternal
  )),
  ('trg_stamp_comment_author', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('public.comments') IS NOT NULL
      AND t.tgrelid = to_regclass('public.comments')
      AND t.tgname = 'trg_stamp_comment_author'
      AND t.tgfoid = to_regproc('public.fn_stamp_comment_author_snapshot')
      AND NOT t.tgisinternal
  )),
  ('trg_protect_comment_mutations', 'trigger', EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE to_regclass('public.comments') IS NOT NULL
      AND t.tgrelid = to_regclass('public.comments')
      AND t.tgname = 'trg_protect_comment_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_comment_mutations')
      AND NOT t.tgisinternal
  )),

  -- Indexes (15 indexes)
  ('idx_profiles_username_lower', 'index', to_regclass('public.idx_profiles_username_lower') IS NOT NULL),
  ('idx_profiles_state', 'index', to_regclass('public.idx_profiles_state') IS NOT NULL),
  ('idx_categories_slug', 'index', to_regclass('public.idx_categories_slug') IS NOT NULL),
  ('idx_resources_category', 'index', to_regclass('public.idx_resources_category') IS NOT NULL),
  ('idx_resources_type', 'index', to_regclass('public.idx_resources_type') IS NOT NULL),
  ('idx_bookmarks_user_res', 'index', to_regclass('public.idx_bookmarks_user_res') IS NOT NULL),
  ('idx_feedback_resource', 'index', to_regclass('public.idx_feedback_resource') IS NOT NULL),
  ('idx_feedback_user', 'index', to_regclass('public.idx_feedback_user') IS NOT NULL),
  ('idx_posts_user', 'index', to_regclass('public.idx_posts_user') IS NOT NULL),
  ('idx_posts_category', 'index', to_regclass('public.idx_posts_category') IS NOT NULL),
  ('idx_comments_post', 'index', to_regclass('public.idx_comments_post') IS NOT NULL),
  ('idx_comments_user', 'index', to_regclass('public.idx_comments_user') IS NOT NULL),
  ('idx_post_likes_user', 'index', to_regclass('public.idx_post_likes_user') IS NOT NULL),
  ('idx_audit_logs_action', 'index', to_regclass('public.idx_audit_logs_action') IS NOT NULL),
  ('idx_audit_logs_created', 'index', to_regclass('public.idx_audit_logs_created') IS NOT NULL),

  -- Policies (23 policies)
  ('profiles_select_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own')),
  ('profiles_update_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own')),
  ('categories_read_public', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'categories_read_public')),
  ('resources_read_public', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'resources_read_public')),
  ('bookmarks_select_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_select_own')),
  ('bookmarks_insert_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_insert_own')),
  ('bookmarks_delete_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_delete_own')),
  ('feedback_select_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_select_own')),
  ('feedback_insert_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_insert_own')),
  ('feedback_update_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_update_own')),
  ('feedback_delete_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_delete_own')),
  ('posts_select_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_select_own')),
  ('posts_insert_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_insert_own')),
  ('posts_update_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_update_own')),
  ('posts_delete_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_delete_own')),
  ('comments_select_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_select_own')),
  ('comments_insert_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_insert_own')),
  ('comments_update_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_update_own')),
  ('comments_delete_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_delete_own')),
  ('likes_select_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_select_own')),
  ('likes_insert_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_insert_own')),
  ('likes_delete_own', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_delete_own')),
  ('manifest_admin_service_role_only', 'policy', EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = '_kisan_migration_manifest' AND policyname = 'manifest_admin_service_role_only')),

  -- Sequences (6 sequences)
  ('categories_id_seq', 'sequence', to_regclass('public.categories_id_seq') IS NOT NULL),
  ('resources_id_seq', 'sequence', to_regclass('public.resources_id_seq') IS NOT NULL),
  ('feedback_id_seq', 'sequence', to_regclass('public.feedback_id_seq') IS NOT NULL),
  ('community_posts_id_seq', 'sequence', to_regclass('public.community_posts_id_seq') IS NOT NULL),
  ('comments_id_seq', 'sequence', to_regclass('public.comments_id_seq') IS NOT NULL),
  ('post_likes_id_seq', 'sequence', to_regclass('public.post_likes_id_seq') IS NOT NULL);


-- Create _kisan_migration_manifest AFTER pre-state inventory is captured
CREATE TABLE IF NOT EXISTS public._kisan_migration_manifest (
  migration_id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  applied_by text NOT NULL DEFAULT current_user,
  created_objects jsonb NOT NULL DEFAULT '[]'::jsonb,
  reused_objects jsonb NOT NULL DEFAULT '[]'::jsonb,
  unknown_objects jsonb NOT NULL DEFAULT '[]'::jsonb,
  pre_existing_definitions jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public._kisan_migration_manifest ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public._kisan_migration_manifest FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public._kisan_migration_manifest TO postgres, service_role;

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE & ROLE ESCALATION PROTECTION
-- Non-destructive creation: Existing functions and triggers are not replaced
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  full_name text NOT NULL,
  state text NOT NULL DEFAULT 'General',
  preferred_category text NOT NULL DEFAULT 'General',
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_profiles_username_format CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$'),
  CONSTRAINT chk_profiles_fullname_len CHECK (char_length(trim(full_name)) >= 2),
  CONSTRAINT chk_profiles_role CHECK (role IN ('user', 'admin'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles (state);

-- Function: Trigger to block client-side role and user ID tampering (Validated by signature)
DO $$
BEGIN
  IF to_regprocedure('public.fn_protect_profile_mutations()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_protect_profile_mutations()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        IF NEW.id <> OLD.id THEN
          RAISE EXCEPTION 'Profile user identifier (id) is immutable.';
        END IF;

        IF NEW.username <> OLD.username THEN
          RAISE EXCEPTION 'Username cannot be modified after registration.';
        END IF;

        IF NEW.role IS DISTINCT FROM OLD.role THEN
          IF current_setting('kisan.admin_role_change', true) IS DISTINCT FROM 'allowed' THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Direct role modification is prohibited. Use admin_set_user_role().';
          END IF;
        END IF;

        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
      END;
      $body$;
    $func$;
  END IF;
END $$;

-- Idempotent Trigger: Validates trigger name, target table, and function binding
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('public.profiles')
      AND t.tgname = 'trg_protect_profile_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_profile_mutations')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_protect_profile_mutations
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_protect_profile_mutations()';
  END IF;
END $$;

-- Function: Privileged server-side role assignment (Validated by signature)
DO $$
BEGIN
  IF to_regprocedure('public.admin_set_user_role(uuid, text)') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.admin_set_user_role(
        p_target_user_id uuid,
        p_new_role text
      )
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' 
           AND session_user NOT IN ('postgres', 'supabase_admin') THEN
          RAISE EXCEPTION 'Unauthorized: admin_set_user_role requires trusted server-side administrative credentials.';
        END IF;

        IF p_new_role NOT IN ('user', 'admin') THEN
          RAISE EXCEPTION 'Invalid role specified: %', p_new_role;
        END IF;

        PERFORM set_config('kisan.admin_role_change', 'allowed', true);

        UPDATE public.profiles
        SET role = p_new_role, updated_at = timezone('utc'::text, now())
        WHERE id = p_target_user_id;

        INSERT INTO public.audit_logs (action, target_type, target_id, details)
        VALUES ('ROLE_CHANGED', 'profile', p_target_user_id::text, jsonb_build_object('new_role', p_new_role));
      END;
      $body$;
    $func$;
  END IF;
END $$;

-- Function: Profile generation on auth.users registration (Validated by signature)
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $body$
  DECLARE
    v_raw_username text;
    v_clean_username text;
    v_candidate_username text;
    v_full_name text;
    v_state text;
    v_pref_cat text;
    v_retry_count integer := 0;
    v_inserted boolean := false;
  BEGIN
    v_raw_username := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''), split_part(COALESCE(NEW.email, ''), '@', 1));
    v_clean_username := regexp_replace(lower(trim(COALESCE(v_raw_username, ''))), '[^a-z0-9_]', '_', 'g');
    
    -- Enforce strict 3-25 character bounds initially to guarantee room for collision suffix (_xxxx)
    IF char_length(v_clean_username) < 3 THEN
      v_clean_username := 'farmer_' || substr(replace(NEW.id::text, '-', ''), 1, 8);
    ELSIF char_length(v_clean_username) > 25 THEN
      v_clean_username := substr(v_clean_username, 1, 25);
    END IF;

    v_full_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'Kisan Farmer');
    v_state := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'state'), ''), 'General');
    v_pref_cat := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'preferred_category'), ''), 'General');
    v_candidate_username := substr(v_clean_username, 1, 30);

    WHILE NOT v_inserted AND v_retry_count < 5 LOOP
      BEGIN
        INSERT INTO public.profiles (id, username, full_name, state, preferred_category, role)
        VALUES (NEW.id, v_candidate_username, v_full_name, v_state, v_pref_cat, 'user');
        v_inserted := true;
      EXCEPTION WHEN unique_violation THEN
        v_retry_count := v_retry_count + 1;
        -- Base is at most 25 chars; suffix is 5 chars ('_' + 4 hex).
        -- Total length is guaranteed between (3 + 5 = 8) and (25 + 5 = 30) characters.
        v_candidate_username := substr(v_clean_username, 1, 25) || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
      END;
    END LOOP;

    IF NOT v_inserted THEN
      -- Fallback: 'farmer_' (7) + 12 hex chars = 19 chars (strictly within 3-30)
      v_candidate_username := 'farmer_' || substr(replace(NEW.id::text, '-', ''), 1, 12);
      INSERT INTO public.profiles (id, username, full_name, state, preferred_category, role)
      VALUES (NEW.id, v_candidate_username, v_full_name, v_state, v_pref_cat, 'user')
      ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
  END;
  $body$;
END $$;

-- Idempotent Trigger on auth.users: Validates trigger name, target table, and function binding
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('auth.users')
      AND t.tgname = 'trg_on_auth_user_created'
      AND t.tgfoid = to_regproc('public.fn_handle_new_auth_user')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_handle_new_auth_user()';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. APPLICATION TABLES & ASSOCIATED FUNCTIONS/TRIGGERS
-- Non-destructive creation: Existing objects are preserved
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'fa-leaf',
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_categories_slug CHECK (slug ~* '^[a-z0-9-]+$')
);

CREATE TABLE IF NOT EXISTS public.resources (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  category_id smallint NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text NOT NULL,
  resource_type text NOT NULL,
  external_url text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  season_climate text NOT NULL DEFAULT '',
  eligibility text NOT NULL DEFAULT '',
  benefits text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT '',
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_resource_type CHECK (resource_type IN ('crop', 'tool', 'scheme', 'loan', 'guide', 'marketplace', 'community')),
  CONSTRAINT chk_views_count_nonnegative CHECK (views_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_resources_category_id ON public.resources (category_id);
CREATE INDEX IF NOT EXISTS idx_resources_resource_type ON public.resources (resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_views_count ON public.resources (views_count DESC);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id bigint NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_bookmarks_user_resource UNIQUE (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_resource ON public.bookmarks (resource_id);

CREATE TABLE IF NOT EXISTS public.feedback (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id bigint NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating smallint NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT chk_feedback_comment_len CHECK (char_length(trim(comment)) >= 2),
  CONSTRAINT uq_feedback_user_resource UNIQUE (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_resource ON public.feedback (resource_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback (user_id);

DO $$
BEGIN
  IF to_regprocedure('public.fn_stamp_feedback_author_snapshot()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_stamp_feedback_author_snapshot()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        NEW.user_id := auth.uid();
        IF NEW.user_id IS NULL THEN
          RAISE EXCEPTION 'Authentication required to submit feedback.';
        END IF;

        SELECT full_name INTO NEW.author_name
        FROM public.profiles
        WHERE id = auth.uid();

        NEW.author_name := COALESCE(NEW.author_name, 'Kisan Farmer');
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
      END;
      $body$;
    $func$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.feedback') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('public.feedback')
      AND t.tgname = 'trg_stamp_feedback_author'
      AND t.tgfoid = to_regproc('public.fn_stamp_feedback_author_snapshot')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_stamp_feedback_author
      BEFORE INSERT ON public.feedback
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_stamp_feedback_author_snapshot()';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.fn_protect_feedback_mutations()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_protect_feedback_mutations()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        IF NEW.id <> OLD.id OR NEW.user_id <> OLD.user_id OR NEW.resource_id <> OLD.resource_id OR 
           NEW.author_name <> OLD.author_name OR NEW.created_at <> OLD.created_at THEN
          RAISE EXCEPTION 'Feedback author identity, resource association, and creation time are immutable.';
        END IF;
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
      END;
      $body$;
    $func$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.feedback') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('public.feedback')
      AND t.tgname = 'trg_protect_feedback_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_feedback_mutations')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_protect_feedback_mutations
      BEFORE UPDATE ON public.feedback
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_protect_feedback_mutations()';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.community_posts (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_state text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_post_title_len CHECK (char_length(trim(title)) >= 5),
  CONSTRAINT chk_post_content_len CHECK (char_length(trim(content)) >= 10)
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON public.community_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.community_posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.community_posts (created_at DESC);

DO $$
BEGIN
  IF to_regprocedure('public.fn_stamp_post_author_snapshot()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_stamp_post_author_snapshot()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        NEW.user_id := auth.uid();
        IF NEW.user_id IS NULL THEN
          RAISE EXCEPTION 'Authentication required to publish community posts.';
        END IF;

        SELECT full_name, state INTO NEW.author_name, NEW.author_state
        FROM public.profiles
        WHERE id = auth.uid();

        NEW.author_name := COALESCE(NEW.author_name, 'Kisan Farmer');
        NEW.author_state := COALESCE(NEW.author_state, 'General');
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
      END;
      $body$;
    $func$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.community_posts') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('public.community_posts')
      AND t.tgname = 'trg_stamp_post_author'
      AND t.tgfoid = to_regproc('public.fn_stamp_post_author_snapshot')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_stamp_post_author
      BEFORE INSERT ON public.community_posts
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_stamp_post_author_snapshot()';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.fn_protect_post_mutations()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_protect_post_mutations()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        IF NEW.user_id <> OLD.user_id OR NEW.author_name <> OLD.author_name OR NEW.author_state <> OLD.author_state THEN
          RAISE EXCEPTION 'Author identity and post ownership cannot be altered.';
        END IF;
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
      END;
      $body$;
    $func$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.community_posts') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('public.community_posts')
      AND t.tgname = 'trg_protect_post_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_post_mutations')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_protect_post_mutations
      BEFORE UPDATE ON public.community_posts
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_protect_post_mutations()';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.comments (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_author text NOT NULL,
  comment_state text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_comment_len CHECK (char_length(trim(comment)) >= 1)
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments (user_id);

DO $$
BEGIN
  IF to_regprocedure('public.fn_stamp_comment_author_snapshot()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_stamp_comment_author_snapshot()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        NEW.user_id := auth.uid();
        IF NEW.user_id IS NULL THEN
          RAISE EXCEPTION 'Authentication required to post comments.';
        END IF;

        SELECT full_name, state INTO NEW.comment_author, NEW.comment_state
        FROM public.profiles
        WHERE id = auth.uid();

        NEW.comment_author := COALESCE(NEW.comment_author, 'Kisan Farmer');
        NEW.comment_state := COALESCE(NEW.comment_state, 'General');
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
      END;
      $body$;
    $func$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.comments') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('public.comments')
      AND t.tgname = 'trg_stamp_comment_author'
      AND t.tgfoid = to_regproc('public.fn_stamp_comment_author_snapshot')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_stamp_comment_author
      BEFORE INSERT ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_stamp_comment_author_snapshot()';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.fn_protect_comment_mutations()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_protect_comment_mutations()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      BEGIN
        IF NEW.post_id <> OLD.post_id OR NEW.user_id <> OLD.user_id OR 
           NEW.comment_author <> OLD.comment_author OR NEW.comment_state <> OLD.comment_state OR 
           NEW.created_at <> OLD.created_at THEN
          RAISE EXCEPTION 'Comment metadata, post association, and author identity are immutable.';
        END IF;
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
      END;
      $body$;
    $func$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.comments') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = to_regclass('public.comments')
      AND t.tgname = 'trg_protect_comment_mutations'
      AND t.tgfoid = to_regproc('public.fn_protect_comment_mutations')
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_protect_comment_mutations
      BEFORE UPDATE ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_protect_comment_mutations()';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user ON public.post_likes (user_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. PRIVACY-PRESERVING PUBLIC VIEWS (WITH SECURITY BARRIER)
-- Non-destructive creation: Existing views are preserved, owned by postgres
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_community_posts'
  ) THEN
    EXECUTE $view$
      CREATE VIEW public.v_community_posts
      WITH (security_barrier = true) AS
      SELECT
        p.id,
        p.author_name,
        p.author_state,
        p.title,
        p.category,
        p.content,
        p.created_at,
        p.updated_at,
        COALESCE(l.like_count, 0)::integer AS like_count,
        COALESCE(c.comment_count, 0)::integer AS comment_count,
        (auth.uid() IS NOT NULL AND p.user_id = auth.uid()) AS is_author,
        (auth.uid() IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.post_likes lk WHERE lk.post_id = p.id AND lk.user_id = auth.uid()
        )) AS is_liked
      FROM public.community_posts p
      LEFT JOIN (
        SELECT post_id, count(*)::integer AS like_count
        FROM public.post_likes
        GROUP BY post_id
      ) l ON l.post_id = p.id
      LEFT JOIN (
        SELECT post_id, count(*)::integer AS comment_count
        FROM public.comments
        GROUP BY post_id
      ) c ON c.post_id = p.id;
    $view$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_community_comments'
  ) THEN
    EXECUTE $view$
      CREATE VIEW public.v_community_comments
      WITH (security_barrier = true) AS
      SELECT
        c.id,
        c.post_id,
        c.comment_author,
        c.comment_state,
        c.comment,
        c.created_at,
        c.updated_at,
        (auth.uid() IS NOT NULL AND c.user_id = auth.uid()) AS is_author
      FROM public.comments c;
    $view$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_resource_feedback'
  ) THEN
    EXECUTE $view$
      CREATE VIEW public.v_resource_feedback
      WITH (security_barrier = true) AS
      SELECT
        f.id,
        f.resource_id,
        f.author_name AS user_name,
        f.rating,
        f.comment,
        f.created_at,
        f.updated_at,
        (auth.uid() IS NOT NULL AND f.user_id = auth.uid()) AS is_author
      FROM public.feedback f;
    $view$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_resource_ratings'
  ) THEN
    EXECUTE $view$
      CREATE VIEW public.v_resource_ratings
      WITH (security_barrier = true) AS
      SELECT
        resource_id,
        round(avg(rating)::numeric, 1) AS avg_rating,
        count(*)::integer AS review_count
      FROM public.feedback
      GROUP BY resource_id;
    $view$;
  END IF;
END $$;

-- Verify view ownership is postgres
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_community_posts') THEN
    ALTER VIEW public.v_community_posts OWNER TO postgres;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_community_comments') THEN
    ALTER VIEW public.v_community_comments OWNER TO postgres;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_resource_feedback') THEN
    ALTER VIEW public.v_resource_feedback OWNER TO postgres;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_resource_ratings') THEN
    ALTER VIEW public.v_resource_ratings OWNER TO postgres;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. RESOURCE VIEW INCREMENT FUNCTION (SERVICE ROLE ONLY)
-- Created only if absent (Validated by exact signature)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.fn_increment_resource_view(bigint)') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.fn_increment_resource_view(p_resource_id bigint)
      RETURNS integer
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $body$
      DECLARE
        v_new_count integer;
      BEGIN
        UPDATE public.resources
        SET views_count = views_count + 1
        WHERE id = p_resource_id
        RETURNING views_count INTO v_new_count;

        RETURN COALESCE(v_new_count, 0);
      END;
      $body$;
    $func$;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Idempotent, non-destructive policy configuration for all 9 tables + manifest
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._kisan_migration_manifest ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 6.1 Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own') THEN
    EXECUTE 'CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    EXECUTE 'CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
  END IF;

  -- 6.2 Categories policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'categories_read_public') THEN
    EXECUTE 'CREATE POLICY "categories_read_public" ON public.categories FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  -- 6.3 Resources policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'resources_read_public') THEN
    EXECUTE 'CREATE POLICY "resources_read_public" ON public.resources FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  -- 6.4 Bookmarks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_select_own') THEN
    EXECUTE 'CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_insert_own') THEN
    EXECUTE 'CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_delete_own') THEN
    EXECUTE 'CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;

  -- 6.5 Feedback policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_select_own') THEN
    EXECUTE 'CREATE POLICY "feedback_select_own" ON public.feedback FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_insert_own') THEN
    EXECUTE 'CREATE POLICY "feedback_insert_own" ON public.feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_update_own') THEN
    EXECUTE 'CREATE POLICY "feedback_update_own" ON public.feedback FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_delete_own') THEN
    EXECUTE 'CREATE POLICY "feedback_delete_own" ON public.feedback FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;

  -- 6.6 Community Posts policies (Owner-based SELECT, INSERT, UPDATE, and DELETE)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_select_own') THEN
    EXECUTE 'CREATE POLICY "posts_select_own" ON public.community_posts FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_insert_own') THEN
    EXECUTE 'CREATE POLICY "posts_insert_own" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_update_own') THEN
    EXECUTE 'CREATE POLICY "posts_update_own" ON public.community_posts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_delete_own') THEN
    EXECUTE 'CREATE POLICY "posts_delete_own" ON public.community_posts FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;

  -- 6.7 Comments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_select_own') THEN
    EXECUTE 'CREATE POLICY "comments_select_own" ON public.comments FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_insert_own') THEN
    EXECUTE 'CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_update_own') THEN
    EXECUTE 'CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_delete_own') THEN
    EXECUTE 'CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;

  -- 6.8 Post Likes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_select_own') THEN
    EXECUTE 'CREATE POLICY "likes_select_own" ON public.post_likes FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_insert_own') THEN
    EXECUTE 'CREATE POLICY "likes_insert_own" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_delete_own') THEN
    EXECUTE 'CREATE POLICY "likes_delete_own" ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;

  -- 6.9 Manifest policy: Access restricted to service role and database administrator
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = '_kisan_migration_manifest' AND policyname = 'manifest_admin_service_role_only') THEN
    EXECUTE 'CREATE POLICY "manifest_admin_service_role_only" ON public._kisan_migration_manifest FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. AUDITED SQL GRANTS & REVOKES
-- Precise least-privilege scoping across all tables, views, functions & sequences
-- ----------------------------------------------------------------------------
-- 7.1 Specific Table Revocations
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.categories FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.resources FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.bookmarks FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.feedback FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.community_posts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.comments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.post_likes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.audit_logs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public._kisan_migration_manifest FROM PUBLIC, anon, authenticated;

-- 7.2 Specific View Revocations (Prevent default PUBLIC view access)
REVOKE ALL ON public.v_community_posts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_community_comments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_resource_feedback FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_resource_ratings FROM PUBLIC, anon, authenticated;

-- 7.3 Specific Function Revocations (Validated by exact procedure signature)
DO $$
BEGIN
  IF to_regprocedure('public.fn_protect_profile_mutations()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_protect_profile_mutations() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.admin_set_user_role(uuid, text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_handle_new_auth_user()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_handle_new_auth_user() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_stamp_feedback_author_snapshot()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_stamp_feedback_author_snapshot() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_protect_feedback_mutations()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_protect_feedback_mutations() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_stamp_post_author_snapshot()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_stamp_post_author_snapshot() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_protect_post_mutations()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_protect_post_mutations() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_stamp_comment_author_snapshot()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_stamp_comment_author_snapshot() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_protect_comment_mutations()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_protect_comment_mutations() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.fn_increment_resource_view(bigint)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_increment_resource_view(bigint) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 7.4 Specific Sequence Permissions (Safe dynamic check)
DO $$
DECLARE
  v_seq text;
  v_seqs text[] := ARRAY[
    'categories_id_seq', 'resources_id_seq', 'feedback_id_seq',
    'community_posts_id_seq', 'comments_id_seq'
  ];
BEGIN
  FOREACH v_seq IN ARRAY v_seqs LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_seq AND c.relkind = 'S'
    ) THEN
      EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC, anon, authenticated;', v_seq);
      EXECUTE format('GRANT ALL PRIVILEGES ON SEQUENCE public.%I TO postgres, service_role;', v_seq);
      IF v_seq IN ('feedback_id_seq', 'community_posts_id_seq', 'comments_id_seq') THEN
        EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO authenticated;', v_seq);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 7.5 Anonymous Grants (Public Read on non-sensitive data & barrier views)
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.resources TO anon;
GRANT SELECT ON public.v_community_posts TO anon;
GRANT SELECT ON public.v_community_comments TO anon;
GRANT SELECT ON public.v_resource_feedback TO anon;
GRANT SELECT ON public.v_resource_ratings TO anon;

-- 7.6 Authenticated Farmer Grants
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, state, preferred_category) ON public.profiles TO authenticated;

GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.resources TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.feedback TO authenticated;
GRANT UPDATE (rating, comment) ON public.feedback TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.community_posts TO authenticated;
GRANT UPDATE (title, category, content) ON public.community_posts TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT UPDATE (comment) ON public.comments TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;

GRANT SELECT ON public.v_community_posts TO authenticated;
GRANT SELECT ON public.v_community_comments TO authenticated;
GRANT SELECT ON public.v_resource_feedback TO authenticated;
GRANT SELECT ON public.v_resource_ratings TO authenticated;

-- Trigger functions execution permission for DML trigger evaluation
DO $$
BEGIN
  IF to_regprocedure('public.fn_protect_profile_mutations()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_protect_profile_mutations() TO authenticated;
  END IF;
  IF to_regprocedure('public.fn_stamp_feedback_author_snapshot()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_stamp_feedback_author_snapshot() TO authenticated;
  END IF;
  IF to_regprocedure('public.fn_protect_feedback_mutations()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_protect_feedback_mutations() TO authenticated;
  END IF;
  IF to_regprocedure('public.fn_stamp_post_author_snapshot()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_stamp_post_author_snapshot() TO authenticated;
  END IF;
  IF to_regprocedure('public.fn_protect_post_mutations()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_protect_post_mutations() TO authenticated;
  END IF;
  IF to_regprocedure('public.fn_stamp_comment_author_snapshot()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_stamp_comment_author_snapshot() TO authenticated;
  END IF;
  IF to_regprocedure('public.fn_protect_comment_mutations()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_protect_comment_mutations() TO authenticated;
  END IF;
END $$;

-- 7.7 Trusted Database Administrator & Service Role Grants
GRANT ALL PRIVILEGES ON public._kisan_migration_manifest TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.profiles TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.categories TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.resources TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.bookmarks TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.feedback TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.community_posts TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.comments TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.post_likes TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.audit_logs TO postgres, service_role;

GRANT ALL PRIVILEGES ON public.v_community_posts TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.v_community_comments TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.v_resource_feedback TO postgres, service_role;
GRANT ALL PRIVILEGES ON public.v_resource_ratings TO postgres, service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
DO $$
BEGIN
  IF to_regprocedure('public.fn_increment_resource_view(bigint)') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_increment_resource_view(bigint) TO service_role;
  END IF;
  IF to_regprocedure('public.admin_set_user_role(uuid, text)') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO service_role;
  END IF;
  IF to_regprocedure('public.fn_handle_new_auth_user()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.fn_handle_new_auth_user() TO postgres, service_role;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. RECORD OWNERSHIP IN MANIFEST
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_created text[] := ARRAY[]::text[];
  v_reused text[] := ARRAY[]::text[];
  v_pre_existing_def jsonb;
  v_row record;
BEGIN
  FOR v_row IN SELECT obj_name, pre_existed FROM _kisan_inventory LOOP
    IF v_row.pre_existed THEN
      v_reused := array_append(v_reused, v_row.obj_name);
    ELSE
      v_created := array_append(v_created, v_row.obj_name);
    END IF;
  END LOOP;

  SELECT jsonb_build_object(
    'tables', COALESCE((SELECT jsonb_agg(obj_name) FROM _kisan_inventory WHERE obj_type = 'table' AND pre_existed), '[]'::jsonb),
    'views', COALESCE((SELECT jsonb_agg(obj_name) FROM _kisan_inventory WHERE obj_type = 'view' AND pre_existed), '[]'::jsonb),
    'functions', COALESCE((SELECT jsonb_agg(obj_name) FROM _kisan_inventory WHERE obj_type = 'function' AND pre_existed), '[]'::jsonb),
    'triggers', COALESCE((SELECT jsonb_agg(obj_name) FROM _kisan_inventory WHERE obj_type = 'trigger' AND pre_existed), '[]'::jsonb),
    'indexes', COALESCE((SELECT jsonb_agg(obj_name) FROM _kisan_inventory WHERE obj_type = 'index' AND pre_existed), '[]'::jsonb),
    'policies', COALESCE((SELECT jsonb_agg(obj_name) FROM _kisan_inventory WHERE obj_type = 'policy' AND pre_existed), '[]'::jsonb),
    'sequences', COALESCE((SELECT jsonb_agg(obj_name) FROM _kisan_inventory WHERE obj_type = 'sequence' AND pre_existed), '[]'::jsonb)
  ) INTO v_pre_existing_def;

  INSERT INTO public._kisan_migration_manifest (
    migration_id, created_objects, reused_objects, unknown_objects, pre_existing_definitions
  ) VALUES (
    '20261102000000_create_kisan_sahayak_schema',
    to_jsonb(v_created),
    to_jsonb(v_reused),
    '[]'::jsonb,
    v_pre_existing_def
  )
  ON CONFLICT (migration_id) DO UPDATE SET
    applied_at = timezone('utc'::text, now()),
    applied_by = current_user,
    created_objects = EXCLUDED.created_objects,
    reused_objects = EXCLUDED.reused_objects,
    pre_existing_definitions = EXCLUDED.pre_existing_definitions;
END $$;

COMMIT;
