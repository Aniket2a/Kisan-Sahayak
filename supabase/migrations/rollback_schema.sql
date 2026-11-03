-- ============================================================================
-- KISAN SAHAYAK — STAGE 2 SAFE NON-DESTRUCTIVE ROLLBACK SCRIPT (AUDITED)
-- Migration: rollback_schema.sql
-- Target Database: Supabase PostgreSQL 15+
--
-- Safety Guarantees:
-- 1. Consults public._kisan_migration_manifest to retrieve the original,
--    immutable ownership snapshot (created_objects vs reused_objects).
-- 2. Strictly REFUSES to drop any table, function, view, policy, or index marked
--    as REUSED or not explicitly present in created_objects.
-- 3. Prior to removing any created table, ARCHIVES 100% of rows into
--    timestamped, secured archive tables (arch_kisan_<table_name>_<ts>).
-- 4. Asserts archive table physical existence and row count parity before dropping.
-- 5. Drops in strict leaf-to-root order WITHOUT CASCADE.
-- 6. Fully wrapped in a single transaction with automatic rollback on error.
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
  v_pol_item text[];
  v_idx text;
  v_policies text[][] := ARRAY[
    ARRAY['profiles', 'profiles_select_own'],
    ARRAY['profiles', 'profiles_update_own'],
    ARRAY['categories', 'categories_read_public'],
    ARRAY['resources', 'resources_read_public'],
    ARRAY['resources', 'resources_admin_insert'],
    ARRAY['resources', 'resources_admin_update'],
    ARRAY['resources', 'resources_admin_delete'],
    ARRAY['bookmarks', 'bookmarks_select_own'],
    ARRAY['bookmarks', 'bookmarks_insert_own'],
    ARRAY['bookmarks', 'bookmarks_delete_own'],
    ARRAY['feedback', 'feedback_select_own'],
    ARRAY['feedback', 'feedback_insert_own'],
    ARRAY['feedback', 'feedback_update_own'],
    ARRAY['feedback', 'feedback_delete_own'],
    ARRAY['community_posts', 'posts_select_own'],
    ARRAY['community_posts', 'posts_insert_own'],
    ARRAY['community_posts', 'posts_update_own'],
    ARRAY['community_posts', 'posts_delete_own'],
    ARRAY['comments', 'comments_select_own'],
    ARRAY['comments', 'comments_insert_own'],
    ARRAY['comments', 'comments_update_own'],
    ARRAY['comments', 'comments_delete_own'],
    ARRAY['post_likes', 'likes_select_own'],
    ARRAY['post_likes', 'likes_insert_own'],
    ARRAY['post_likes', 'likes_delete_own'],
    ARRAY['_kisan_migration_manifest', 'manifest_admin_service_role_only']
  ];
  v_indexes text[] := ARRAY[
    'idx_profiles_username_lower', 'idx_profiles_state',
    'idx_categories_slug',
    'idx_resources_category', 'idx_resources_type',
    'idx_bookmarks_user_res',
    'idx_feedback_resource', 'idx_feedback_user',
    'idx_posts_user', 'idx_posts_category',
    'idx_comments_post', 'idx_comments_user',
    'idx_post_likes_user',
    'idx_audit_logs_action', 'idx_audit_logs_created'
  ];
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

  -- 1. Verify manifest existence and fetch original migration snapshot
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

  IF v_created IS NULL OR jsonb_typeof(v_created) <> 'array' THEN
    RAISE EXCEPTION 'Rollback Abort: created_objects in manifest is invalid or corrupt.';
  END IF;

  IF v_reused IS NULL OR jsonb_typeof(v_reused) <> 'array' THEN
    RAISE EXCEPTION 'Rollback Abort: reused_objects in manifest is invalid or corrupt.';
  END IF;

  RAISE NOTICE '>>> Original manifest snapshot verified. Created: %, Reused: %', v_created, v_reused;

  -- 2. Drop triggers created by this migration (never drop if marked as reused)
  IF (v_created ? 'trg_on_auth_user_created') AND NOT (v_reused ? 'trg_on_auth_user_created') THEN
    IF to_regclass('auth.users') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
      RAISE NOTICE 'Dropped trigger trg_on_auth_user_created';
    END IF;
  END IF;

  IF (v_created ? 'trg_protect_profile_mutations') AND NOT (v_reused ? 'trg_protect_profile_mutations') THEN
    IF to_regclass('public.profiles') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_profile_mutations ON public.profiles;
      RAISE NOTICE 'Dropped trigger trg_protect_profile_mutations';
    END IF;
  END IF;

  IF (v_created ? 'trg_stamp_feedback_author') AND NOT (v_reused ? 'trg_stamp_feedback_author') THEN
    IF to_regclass('public.feedback') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_stamp_feedback_author ON public.feedback;
      RAISE NOTICE 'Dropped trigger trg_stamp_feedback_author';
    END IF;
  END IF;

  IF (v_created ? 'trg_protect_feedback_mutations') AND NOT (v_reused ? 'trg_protect_feedback_mutations') THEN
    IF to_regclass('public.feedback') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_feedback_mutations ON public.feedback;
      RAISE NOTICE 'Dropped trigger trg_protect_feedback_mutations';
    END IF;
  END IF;

  IF (v_created ? 'trg_stamp_post_author') AND NOT (v_reused ? 'trg_stamp_post_author') THEN
    IF to_regclass('public.community_posts') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_stamp_post_author ON public.community_posts;
      RAISE NOTICE 'Dropped trigger trg_stamp_post_author';
    END IF;
  END IF;

  IF (v_created ? 'trg_protect_post_mutations') AND NOT (v_reused ? 'trg_protect_post_mutations') THEN
    IF to_regclass('public.community_posts') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_post_mutations ON public.community_posts;
      RAISE NOTICE 'Dropped trigger trg_protect_post_mutations';
    END IF;
  END IF;

  IF (v_created ? 'trg_stamp_comment_author') AND NOT (v_reused ? 'trg_stamp_comment_author') THEN
    IF to_regclass('public.comments') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_stamp_comment_author ON public.comments;
      RAISE NOTICE 'Dropped trigger trg_stamp_comment_author';
    END IF;
  END IF;

  IF (v_created ? 'trg_protect_comment_mutations') AND NOT (v_reused ? 'trg_protect_comment_mutations') THEN
    IF to_regclass('public.comments') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS trg_protect_comment_mutations ON public.comments;
      RAISE NOTICE 'Dropped trigger trg_protect_comment_mutations';
    END IF;
  END IF;

  -- 3. Drop Views (only if created by this migration and not pre-existing)
  IF (v_created ? 'v_community_comments') AND NOT (v_reused ? 'v_community_comments') THEN
    DROP VIEW IF EXISTS public.v_community_comments;
    RAISE NOTICE 'Dropped view v_community_comments';
  END IF;

  IF (v_created ? 'v_community_posts') AND NOT (v_reused ? 'v_community_posts') THEN
    DROP VIEW IF EXISTS public.v_community_posts;
    RAISE NOTICE 'Dropped view v_community_posts';
  END IF;

  IF (v_created ? 'v_resource_feedback') AND NOT (v_reused ? 'v_resource_feedback') THEN
    DROP VIEW IF EXISTS public.v_resource_feedback;
    RAISE NOTICE 'Dropped view v_resource_feedback';
  END IF;

  IF (v_created ? 'v_resource_ratings') AND NOT (v_reused ? 'v_resource_ratings') THEN
    DROP VIEW IF EXISTS public.v_resource_ratings;
    RAISE NOTICE 'Dropped view v_resource_ratings';
  END IF;

  -- 4. Drop Functions (only if created by this migration and not pre-existing, using exact signatures)
  IF (v_created ? 'fn_protect_profile_mutations') AND NOT (v_reused ? 'fn_protect_profile_mutations') THEN
    DROP FUNCTION IF EXISTS public.fn_protect_profile_mutations();
    RAISE NOTICE 'Dropped function fn_protect_profile_mutations';
  END IF;

  IF (v_created ? 'admin_set_user_role') AND NOT (v_reused ? 'admin_set_user_role') THEN
    DROP FUNCTION IF EXISTS public.admin_set_user_role(uuid, text);
    RAISE NOTICE 'Dropped function admin_set_user_role';
  END IF;

  IF (v_created ? 'fn_handle_new_auth_user') AND NOT (v_reused ? 'fn_handle_new_auth_user') THEN
    DROP FUNCTION IF EXISTS public.fn_handle_new_auth_user();
    RAISE NOTICE 'Dropped function fn_handle_new_auth_user';
  END IF;

  IF (v_created ? 'fn_stamp_feedback_author_snapshot') AND NOT (v_reused ? 'fn_stamp_feedback_author_snapshot') THEN
    DROP FUNCTION IF EXISTS public.fn_stamp_feedback_author_snapshot();
    RAISE NOTICE 'Dropped function fn_stamp_feedback_author_snapshot';
  END IF;

  IF (v_created ? 'fn_protect_feedback_mutations') AND NOT (v_reused ? 'fn_protect_feedback_mutations') THEN
    DROP FUNCTION IF EXISTS public.fn_protect_feedback_mutations();
    RAISE NOTICE 'Dropped function fn_protect_feedback_mutations';
  END IF;

  IF (v_created ? 'fn_stamp_post_author_snapshot') AND NOT (v_reused ? 'fn_stamp_post_author_snapshot') THEN
    DROP FUNCTION IF EXISTS public.fn_stamp_post_author_snapshot();
    RAISE NOTICE 'Dropped function fn_stamp_post_author_snapshot';
  END IF;

  IF (v_created ? 'fn_protect_post_mutations') AND NOT (v_reused ? 'fn_protect_post_mutations') THEN
    DROP FUNCTION IF EXISTS public.fn_protect_post_mutations();
    RAISE NOTICE 'Dropped function fn_protect_post_mutations';
  END IF;

  IF (v_created ? 'fn_stamp_comment_author_snapshot') AND NOT (v_reused ? 'fn_stamp_comment_author_snapshot') THEN
    DROP FUNCTION IF EXISTS public.fn_stamp_comment_author_snapshot();
    RAISE NOTICE 'Dropped function fn_stamp_comment_author_snapshot';
  END IF;

  IF (v_created ? 'fn_protect_comment_mutations') AND NOT (v_reused ? 'fn_protect_comment_mutations') THEN
    DROP FUNCTION IF EXISTS public.fn_protect_comment_mutations();
    RAISE NOTICE 'Dropped function fn_protect_comment_mutations';
  END IF;

  IF (v_created ? 'fn_increment_resource_view') AND NOT (v_reused ? 'fn_increment_resource_view') THEN
    DROP FUNCTION IF EXISTS public.fn_increment_resource_view(bigint);
    RAISE NOTICE 'Dropped function fn_increment_resource_view';
  END IF;

  -- 5. Drop Policies created by this migration (if relation still exists and not pre-existing)
  FOREACH v_pol_item SLICE 1 IN ARRAY v_policies LOOP
    IF (v_created ? v_pol_item[2]) AND NOT (v_reused ? v_pol_item[2]) AND to_regclass('public.' || v_pol_item[1]) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_pol_item[2], v_pol_item[1]);
      RAISE NOTICE 'Dropped policy % on %', v_pol_item[2], v_pol_item[1];
    END IF;
  END LOOP;

  -- 6. Drop Indexes created by this migration (if relation still exists and not pre-existing)
  FOREACH v_idx IN ARRAY v_indexes LOOP
    IF (v_created ? v_idx) AND NOT (v_reused ? v_idx) AND to_regclass('public.' || v_idx) IS NOT NULL THEN
      EXECUTE format('DROP INDEX IF EXISTS public.%I', v_idx);
      RAISE NOTICE 'Dropped index %', v_idx;
    END IF;
  END LOOP;

  -- 7. Safe Archive & Removal of Tables (Leaf to Root, No CASCADE)
  FOREACH v_tbl IN ARRAY v_drop_order LOOP
    -- Only act if this table was actually created by our migration and was not pre-existing
    IF (v_created ? v_tbl) AND NOT (v_reused ? v_tbl) THEN
      IF to_regclass('public.' || v_tbl) IS NOT NULL THEN
        v_arch_name := 'arch_kisan_' || v_tbl || '_' || v_ts;
        
        -- A. Create verified archive table with complete copy
        EXECUTE format('CREATE TABLE public.%I AS SELECT * FROM public.%I', v_arch_name, v_tbl);
        
        -- B. Explicit verification that archive table exists before proceeding
        IF to_regclass('public.' || v_arch_name) IS NULL THEN
          RAISE EXCEPTION 'Archive Verification Failed: Archive table % could not be created.', v_arch_name;
        END IF;

        -- C. Secure the archive table immediately
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_arch_name);
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', v_arch_name);
        EXECUTE format('GRANT ALL ON TABLE public.%I TO postgres, service_role', v_arch_name);

        -- D. Verify row count parity between live and archive
        EXECUTE format('SELECT count(*) FROM public.%I', v_tbl) INTO v_orig_count;
        EXECUTE format('SELECT count(*) FROM public.%I', v_arch_name) INTO v_arch_count;

        IF v_orig_count <> v_arch_count THEN
          RAISE EXCEPTION 'Archive Verification Failed on %: original count (%) != archive count (%)', 
            v_tbl, v_orig_count, v_arch_count;
        END IF;

        RAISE NOTICE 'Safely archived % rows from % to %', v_orig_count, v_tbl, v_arch_name;

        -- E. Drop table strictly without CASCADE
        EXECUTE format('DROP TABLE public.%I', v_tbl);
        RAISE NOTICE 'Safely dropped table %', v_tbl;
      END IF;
    ELSE
      IF v_reused ? v_tbl THEN
        RAISE NOTICE 'Table % was marked as REUSED. Leaving completely intact without modifications.', v_tbl;
      ELSE
        RAISE NOTICE 'Table % was not marked as created. Leaving untouched.', v_tbl;
      END IF;
    END IF;
  END LOOP;

  -- 8. Update manifest to record rollback completion
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
