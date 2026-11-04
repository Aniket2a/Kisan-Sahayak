-- ============================================================================
-- KISAN SAHAYAK — STAGE 3 MIGRATION: SHARED COMMUNITY FORUM & ACCESS POLICIES
-- Migration: 20261104000000_enable_shared_community_forum.sql
-- Target Database: Supabase PostgreSQL 15+
-- Safe, repeatable, non-destructive migration to enable shared community forum,
-- public post/comment/like reading, and owner+admin deletion privileges.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '>>> Applying Stage 3 Migration: Enabling shared community forum and verified RLS policies...';

  -- 1. Ensure table public.community_posts has RLS enabled
  IF to_regclass('public.community_posts') IS NOT NULL THEN
    ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

    -- Replace restricted posts_select_own with posts_read_all for shared forum discussions
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_select_own') THEN
      DROP POLICY "posts_select_own" ON public.community_posts;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_read_all') THEN
      CREATE POLICY "posts_read_all" ON public.community_posts
        FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- Ensure owner or administrator can delete discussions
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_delete_own') THEN
      DROP POLICY "posts_delete_own" ON public.community_posts;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_delete_owner_or_admin') THEN
      CREATE POLICY "posts_delete_owner_or_admin" ON public.community_posts
        FOR DELETE TO authenticated
        USING (
          user_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;

    -- Ensure posts_insert_own exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_insert_own') THEN
      CREATE POLICY "posts_insert_own" ON public.community_posts
        FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    END IF;

    -- Ensure posts_update_own exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'posts_update_own') THEN
      CREATE POLICY "posts_update_own" ON public.community_posts
        FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;

  -- 2. Ensure table public.comments has RLS enabled and shared read
  IF to_regclass('public.comments') IS NOT NULL THEN
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_select_own') THEN
      DROP POLICY "comments_select_own" ON public.comments;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_read_all') THEN
      CREATE POLICY "comments_read_all" ON public.comments
        FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_delete_own') THEN
      DROP POLICY "comments_delete_own" ON public.comments;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_delete_owner_or_admin') THEN
      CREATE POLICY "comments_delete_owner_or_admin" ON public.comments
        FOR DELETE TO authenticated
        USING (
          user_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_insert_own') THEN
      CREATE POLICY "comments_insert_own" ON public.comments
        FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'comments_update_own') THEN
      CREATE POLICY "comments_update_own" ON public.comments
        FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;

  -- 3. Ensure table public.post_likes has shared read
  IF to_regclass('public.post_likes') IS NOT NULL THEN
    ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_select_own') THEN
      DROP POLICY "likes_select_own" ON public.post_likes;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_read_all') THEN
      CREATE POLICY "likes_read_all" ON public.post_likes
        FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_insert_own') THEN
      CREATE POLICY "likes_insert_own" ON public.post_likes
        FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_delete_own') THEN
      CREATE POLICY "likes_delete_own" ON public.post_likes
        FOR DELETE TO authenticated USING (user_id = auth.uid());
    END IF;
  END IF;

  -- 4. Ensure public feedback table can be read by visitors (in addition to view v_resource_feedback)
  IF to_regclass('public.feedback') IS NOT NULL THEN
    ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_select_own') THEN
      DROP POLICY "feedback_select_own" ON public.feedback;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_read_all') THEN
      CREATE POLICY "feedback_read_all" ON public.feedback
        FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_delete_own') THEN
      DROP POLICY "feedback_delete_own" ON public.feedback;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'feedback_delete_owner_or_admin') THEN
      CREATE POLICY "feedback_delete_owner_or_admin" ON public.feedback
        FOR DELETE TO authenticated
        USING (
          user_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
  END IF;

  -- 5. Explicit table and view grants for shared access
  GRANT SELECT ON public.community_posts TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;

  GRANT SELECT ON public.comments TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;

  GRANT SELECT ON public.post_likes TO anon, authenticated;
  GRANT INSERT, DELETE ON public.post_likes TO authenticated;

  GRANT SELECT ON public.feedback TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.feedback TO authenticated;

  -- 6. Sequence USAGE permissions for authenticated users
  DO $seq$
  DECLARE
    v_seq text;
  BEGIN
    FOR v_seq IN
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'S'
        AND c.relname IN ('community_posts_id_seq', 'comments_id_seq', 'post_likes_id_seq', 'feedback_id_seq')
    LOOP
      EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO authenticated;', v_seq);
    END LOOP;
  END $seq$;

  -- 7. Update manifest if table exists
  IF to_regclass('public._kisan_migration_manifest') IS NOT NULL THEN
    INSERT INTO public._kisan_migration_manifest (
      migration_id,
      applied_at,
      applied_by,
      created_objects,
      reused_objects,
      unknown_objects
    )
    VALUES (
      '20261104000000_enable_shared_community_forum',
      timezone('utc'::text, now()),
      current_user,
      '["policy:posts_read_all", "policy:posts_delete_owner_or_admin", "policy:comments_read_all", "policy:comments_delete_owner_or_admin", "policy:likes_read_all", "policy:feedback_read_all", "policy:feedback_delete_owner_or_admin"]'::jsonb,
      '["table:community_posts", "table:comments", "table:post_likes", "table:feedback"]'::jsonb,
      '[]'::jsonb
    )
    ON CONFLICT (migration_id) DO UPDATE SET
      applied_at = timezone('utc'::text, now()),
      applied_by = current_user;
  END IF;

  RAISE NOTICE '>>> Stage 3 Migration: Successfully configured shared community policies and permissions.';
END $$;

COMMIT;
