-- ============================================================================
-- KISAN SAHAYAK — STAGE 2 SAFE NON-DESTRUCTIVE ROLLBACK SCRIPT (AUDITED)
-- Migration: rollback_schema.sql
-- Target Database: Supabase PostgreSQL 15+
--
-- Safety Guarantees:
-- 1. Consults public._kisan_migration_manifest to identify which objects were
--    actually CREATED vs REUSED during the migration.
-- 2. Strictly REFUSES to drop any table, function, or view marked as REUSED or UNKNOWN.
-- 3. Prior to removing any created table, ARCHIVES 100% of rows into
--    timestamped, secured archive tables (arch_kisan_<table_name>_<ts>).
-- 4. Asserts archive row count equals original row count before dropping.
-- 5. Drops in strict leaf-to-root order WITHOUT CASCADE.
-- 6. Fully wraps in a transaction with automatic rollback on error.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_manifest record;
  v_created jsonb;
  v_reused jsonb;
  v_ts text := to_char(timezone('utc'::text, now()), 'YYYYMMDD_HH24MISS');
  v_table_name text;
  v_arch_name text;
  v_orig_count bigint;
  v_arch_count bigint;
  v_tbl text;
  v_drop_order text[] := ARRAY[
    'post_likes',
    'comments',
    'community_posts',
    'feedback',
    'bookmarks',
    'resources',
    'categories',
    'profiles',
    'audit_logs'
  ];
BEGIN
  RAISE NOTICE '>>> Initiating safe non-destructive rollback for Kisan Sahayak...';

  -- 1. Verify manifest existence and fetch migration record
  IF to_regclass('public._kisan_migration_manifest') IS NULL THEN
    RAISE EXCEPTION 'Rollback Abort: _kisan_migration_manifest does not exist. Cannot safely verify object ownership.';
  END IF;

  SELECT * INTO v_manifest 
  FROM public._kisan_migration_manifest 
  WHERE migration_id = '20261102000000_create_kisan_sahayak_schema';

  IF v_manifest.migration_id IS NULL THEN
    RAISE EXCEPTION 'Rollback Abort: Migration 20261102000000_create_kisan_sahayak_schema not recorded in manifest.';
  END IF;

  v_created := v_manifest.created_objects;
  v_reused := v_manifest.reused_objects;

  RAISE NOTICE '>>> Manifest verified. Created objects: %, Reused objects: %', v_created, v_reused;

  -- 2. Drop triggers that were created by this migration
  IF v_created ? 'trg_on_auth_user_created' THEN
    IF to_regclass('auth.users') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
      RAISE NOTICE 'Dropped trigger trg_on_auth_user_created';
    END IF;
  END IF;

  IF v_created ? 'trg_protect_profile_mutations' THEN
    IF to_regclass('public.profiles') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_profile_mutations ON public.profiles;
      RAISE NOTICE 'Dropped trigger trg_protect_profile_mutations';
    END IF;
  END IF;

  IF v_created ? 'trg_stamp_feedback_author' THEN
    IF to_regclass('public.feedback') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_stamp_feedback_author ON public.feedback;
      RAISE NOTICE 'Dropped trigger trg_stamp_feedback_author';
    END IF;
  END IF;

  IF v_created ? 'trg_protect_feedback_mutations' THEN
    IF to_regclass('public.feedback') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_feedback_mutations ON public.feedback;
      RAISE NOTICE 'Dropped trigger trg_protect_feedback_mutations';
    END IF;
  END IF;

  IF v_created ? 'trg_stamp_post_author' THEN
    IF to_regclass('public.community_posts') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_stamp_post_author ON public.community_posts;
      RAISE NOTICE 'Dropped trigger trg_stamp_post_author';
    END IF;
  END IF;

  IF v_created ? 'trg_protect_post_mutations' THEN
    IF to_regclass('public.community_posts') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_post_mutations ON public.community_posts;
      RAISE NOTICE 'Dropped trigger trg_protect_post_mutations';
    END IF;
  END IF;

  IF v_created ? 'trg_stamp_comment_author' THEN
    IF to_regclass('public.comments') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_stamp_comment_author ON public.comments;
      RAISE NOTICE 'Dropped trigger trg_stamp_comment_author';
    END IF;
  END IF;

  IF v_created ? 'trg_protect_comment_mutations' THEN
    IF to_regclass('public.comments') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_comment_mutations ON public.comments;
      RAISE NOTICE 'Dropped trigger trg_protect_comment_mutations';
    END IF;
  END IF;

  -- 3. Drop Views (only if created by this migration)
  IF v_created ? 'v_community_comments' THEN
    DROP VIEW IF EXISTS public.v_community_comments;
    RAISE NOTICE 'Dropped view v_community_comments';
  END IF;

  IF v_created ? 'v_community_posts' THEN
    DROP VIEW IF EXISTS public.v_community_posts;
    RAISE NOTICE 'Dropped view v_community_posts';
  END IF;

  IF v_created ? 'v_resource_feedback' THEN
    DROP VIEW IF EXISTS public.v_resource_feedback;
    RAISE NOTICE 'Dropped view v_resource_feedback';
  END IF;

  IF v_created ? 'v_resource_ratings' THEN
    DROP VIEW IF EXISTS public.v_resource_ratings;
    RAISE NOTICE 'Dropped view v_resource_ratings';
  END IF;

  -- 4. Drop Functions (only if created by this migration, using exact signatures)
  IF v_created ? 'fn_protect_profile_mutations' THEN
    DROP FUNCTION IF EXISTS public.fn_protect_profile_mutations();
    RAISE NOTICE 'Dropped function fn_protect_profile_mutations';
  END IF;

  IF v_created ? 'admin_set_user_role' THEN
    DROP FUNCTION IF EXISTS public.admin_set_user_role(uuid, text);
    RAISE NOTICE 'Dropped function admin_set_user_role';
  END IF;

  IF v_created ? 'fn_handle_new_auth_user' THEN
    DROP FUNCTION IF EXISTS public.fn_handle_new_auth_user();
    RAISE NOTICE 'Dropped function fn_handle_new_auth_user';
  END IF;

  IF v_created ? 'fn_stamp_feedback_author_snapshot' THEN
    DROP FUNCTION IF EXISTS public.fn_stamp_feedback_author_snapshot();
    RAISE NOTICE 'Dropped function fn_stamp_feedback_author_snapshot';
  END IF;

  IF v_created ? 'fn_protect_feedback_mutations' THEN
    DROP FUNCTION IF EXISTS public.fn_protect_feedback_mutations();
    RAISE NOTICE 'Dropped function fn_protect_feedback_mutations';
  END IF;

  IF v_created ? 'fn_stamp_post_author_snapshot' THEN
    DROP FUNCTION IF EXISTS public.fn_stamp_post_author_snapshot();
    RAISE NOTICE 'Dropped function fn_stamp_post_author_snapshot';
  END IF;

  IF v_created ? 'fn_protect_post_mutations' THEN
    DROP FUNCTION IF EXISTS public.fn_protect_post_mutations();
    RAISE NOTICE 'Dropped function fn_protect_post_mutations';
  END IF;

  IF v_created ? 'fn_stamp_comment_author_snapshot' THEN
    DROP FUNCTION IF EXISTS public.fn_stamp_comment_author_snapshot();
    RAISE NOTICE 'Dropped function fn_stamp_comment_author_snapshot';
  END IF;

  IF v_created ? 'fn_protect_comment_mutations' THEN
    DROP FUNCTION IF EXISTS public.fn_protect_comment_mutations();
    RAISE NOTICE 'Dropped function fn_protect_comment_mutations';
  END IF;

  IF v_created ? 'fn_increment_resource_view' THEN
    DROP FUNCTION IF EXISTS public.fn_increment_resource_view(bigint);
    RAISE NOTICE 'Dropped function fn_increment_resource_view';
  END IF;

  -- 5. Safe Archive & Removal of Tables (Leaf to Root, No CASCADE)
  FOREACH v_tbl IN ARRAY v_drop_order LOOP
    -- Only act if this table was actually created by our migration
    IF v_created ? v_tbl THEN
      -- Check table exists in public schema
      IF to_regclass('public.' || v_tbl) IS NOT NULL THEN
        v_arch_name := 'arch_kisan_' || v_tbl || '_' || v_ts;
        
        -- A. Create verified archive table with complete copy
        EXECUTE format('CREATE TABLE public.%I AS SELECT * FROM public.%I', v_arch_name, v_tbl);
        
        -- B. Secure the archive table immediately
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_arch_name);
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', v_arch_name);
        EXECUTE format('GRANT ALL ON TABLE public.%I TO postgres, service_role', v_arch_name);

        -- C. Verify row count parity between live and archive
        EXECUTE format('SELECT count(*) FROM public.%I', v_tbl) INTO v_orig_count;
        EXECUTE format('SELECT count(*) FROM public.%I', v_arch_name) INTO v_arch_count;

        IF v_orig_count <> v_arch_count THEN
          RAISE EXCEPTION 'Archive Verification Failed on %: original count (%) != archive count (%)', 
            v_tbl, v_orig_count, v_arch_count;
        END IF;

        RAISE NOTICE 'Safely archived % rows from % to %', v_orig_count, v_tbl, v_arch_name;

        -- D. Drop table strictly without CASCADE
        EXECUTE format('DROP TABLE public.%I', v_tbl);
        RAISE NOTICE 'Safely dropped table %', v_tbl;
      END IF;
    ELSE
      IF v_reused ? v_tbl THEN
        RAISE NOTICE 'Table % was marked as REUSED. Leaving completely intact.', v_tbl;
      ELSE
        RAISE NOTICE 'Table % was not marked as created. Leaving untouched.', v_tbl;
      END IF;
    END IF;
  END LOOP;

  -- 6. Update manifest to record rollback completion
  UPDATE public._kisan_migration_manifest
  SET applied_at = timezone('utc'::text, now()),
      applied_by = current_user || ' (ROLLBACK)',
      unknown_objects = unknown_objects || jsonb_build_object(
        'rolled_back_at', timezone('utc'::text, now()),
        'archive_timestamp_suffix', v_ts
      )
  WHERE migration_id = '20261102000000_create_kisan_sahayak_schema';

  RAISE NOTICE '>>> Non-destructive rollback completed successfully with all table data preserved in arch_kisan_* tables.';
END $$;

COMMIT;
