-- ============================================================================
-- KISAN SAHAYAK — STAGE 2 PRODUCTION DATABASE MIGRATION (AUDITED & HARDENED)
-- Migration: 20261102000000_create_kisan_sahayak_schema.sql
-- Target Database: Supabase PostgreSQL 15+
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. PREFLIGHT COMPREHENSIVE VALIDATION
-- Verifies Supabase environment, extensions, and compatibility of existing tables
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_rec record;
  v_col_count integer;
  v_pk_exists boolean;
  v_fk_count integer;
BEGIN
  RAISE NOTICE '>>> Step 1: Running comprehensive 9-table preflight validation...';

  -- 1.1 Verify auth schema exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    RAISE EXCEPTION 'Preflight Abort: Supabase auth schema not found.';
  END IF;

  -- 1.2 Verify pgcrypto extension
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  END IF;

  -- 1.3 Validate existing tables individually for structural compatibility
  FOR v_rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('profiles', 'categories', 'resources', 'bookmarks', 'feedback', 
                         'community_posts', 'comments', 'post_likes', 'audit_logs')
  LOOP
    -- A. Profiles Check
    IF v_rec.table_name = 'profiles' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' 
        AND column_name IN ('id', 'username', 'full_name', 'state', 'preferred_category', 'role')
        AND data_type IN ('uuid', 'text');
      IF v_col_count < 6 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing profiles table has incompatible column definitions.';
      END IF;
      SELECT count(*) > 0 INTO v_pk_exists FROM information_schema.table_constraints 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_type = 'PRIMARY KEY';
      IF NOT v_pk_exists THEN
        RAISE EXCEPTION 'Preflight Abort: Existing profiles table missing PRIMARY KEY constraint.';
      END IF;
    END IF;

    -- B. Categories Check
    IF v_rec.table_name = 'categories' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'categories' 
        AND column_name IN ('id', 'name', 'slug', 'description', 'icon');
      IF v_col_count < 5 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing categories table lacks required columns.';
      END IF;
    END IF;

    -- C. Resources Check
    IF v_rec.table_name = 'resources' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'resources' 
        AND column_name IN ('id', 'category_id', 'title', 'description', 'resource_type', 'views_count');
      IF v_col_count < 6 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing resources table lacks required columns.';
      END IF;
      SELECT count(*) INTO v_fk_count FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = 'resources';
      IF v_fk_count < 1 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing resources table lacks foreign key reference.';
      END IF;
    END IF;

    -- D. Bookmarks Check
    IF v_rec.table_name = 'bookmarks' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bookmarks' 
        AND column_name IN ('id', 'user_id', 'resource_id');
      IF v_col_count < 3 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing bookmarks table lacks required columns.';
      END IF;
    END IF;

    -- E. Feedback Check
    IF v_rec.table_name = 'feedback' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'feedback' 
        AND column_name IN ('id', 'user_id', 'resource_id', 'rating', 'comment');
      IF v_col_count < 5 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing feedback table lacks required columns.';
      END IF;
    END IF;

    -- F. Community Posts Check
    IF v_rec.table_name = 'community_posts' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'community_posts' 
        AND column_name IN ('id', 'user_id', 'author_name', 'title', 'content');
      IF v_col_count < 5 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing community_posts table lacks required columns.';
      END IF;
    END IF;

    -- G. Comments Check
    IF v_rec.table_name = 'comments' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'comments' 
        AND column_name IN ('id', 'post_id', 'user_id', 'comment');
      IF v_col_count < 4 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing comments table lacks required columns.';
      END IF;
    END IF;

    -- H. Post Likes Check
    IF v_rec.table_name = 'post_likes' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'post_likes' 
        AND column_name IN ('post_id', 'user_id');
      IF v_col_count < 2 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing post_likes table lacks required columns.';
      END IF;
    END IF;

    -- I. Audit Logs Check
    IF v_rec.table_name = 'audit_logs' THEN
      SELECT count(*) INTO v_col_count FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'audit_logs' 
        AND column_name IN ('id', 'action', 'target_type', 'target_id', 'details');
      IF v_col_count < 5 THEN
        RAISE EXCEPTION 'Preflight Abort: Existing audit_logs table lacks required columns.';
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '>>> Step 1: Preflight validation successful.';
END $$;

-- ----------------------------------------------------------------------------
-- 1. DYNAMIC PRE-STATE INVENTORY CAPTURE
-- Records precise pre-existence of every affected object
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._kisan_migration_manifest (
  migration_id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  applied_by text NOT NULL DEFAULT current_user,
  created_objects jsonb NOT NULL DEFAULT '[]'::jsonb,
  reused_objects jsonb NOT NULL DEFAULT '[]'::jsonb,
  unknown_objects jsonb NOT NULL DEFAULT '[]'::jsonb,
  pre_existing_definitions jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS and lock manifest immediately to trusted administrative roles only
ALTER TABLE public._kisan_migration_manifest ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public._kisan_migration_manifest FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public._kisan_migration_manifest TO postgres, service_role;

CREATE TEMPORARY TABLE _kisan_inventory (
  obj_name text PRIMARY KEY,
  obj_type text NOT NULL,
  pre_existed boolean NOT NULL
) ON COMMIT DROP;

INSERT INTO _kisan_inventory (obj_name, obj_type, pre_existed)
VALUES
  -- Tables
  ('profiles', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles')),
  ('categories', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='categories')),
  ('resources', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='resources')),
  ('bookmarks', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookmarks')),
  ('feedback', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feedback')),
  ('community_posts', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='community_posts')),
  ('comments', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments')),
  ('post_likes', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='post_likes')),
  ('audit_logs', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs')),
  ('_kisan_migration_manifest', 'table', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='_kisan_migration_manifest')),
  -- Views
  ('v_community_posts', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_community_posts')),
  ('v_community_comments', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_community_comments')),
  ('v_resource_feedback', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_resource_feedback')),
  ('v_resource_ratings', 'view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_resource_ratings')),
  -- Functions
  ('fn_protect_profile_mutations', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_protect_profile_mutations' AND pronamespace='public'::regnamespace)),
  ('admin_set_user_role', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='admin_set_user_role' AND pronamespace='public'::regnamespace)),
  ('fn_handle_new_auth_user', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_handle_new_auth_user' AND pronamespace='public'::regnamespace)),
  ('fn_stamp_feedback_author_snapshot', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_stamp_feedback_author_snapshot' AND pronamespace='public'::regnamespace)),
  ('fn_protect_feedback_mutations', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_protect_feedback_mutations' AND pronamespace='public'::regnamespace)),
  ('fn_stamp_post_author_snapshot', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_stamp_post_author_snapshot' AND pronamespace='public'::regnamespace)),
  ('fn_protect_post_mutations', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_protect_post_mutations' AND pronamespace='public'::regnamespace)),
  ('fn_stamp_comment_author_snapshot', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_stamp_comment_author_snapshot' AND pronamespace='public'::regnamespace)),
  ('fn_protect_comment_mutations', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_protect_comment_mutations' AND pronamespace='public'::regnamespace)),
  ('fn_increment_resource_view', 'function', EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_increment_resource_view' AND pronamespace='public'::regnamespace)),
  -- Triggers
  ('trg_protect_profile_mutations', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_protect_profile_mutations')),
  ('trg_on_auth_user_created', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_on_auth_user_created')),
  ('trg_stamp_feedback_author', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_stamp_feedback_author')),
  ('trg_protect_feedback_mutations', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_protect_feedback_mutations')),
  ('trg_stamp_post_author', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_stamp_post_author')),
  ('trg_protect_post_mutations', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_protect_post_mutations')),
  ('trg_stamp_comment_author', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_stamp_comment_author')),
  ('trg_protect_comment_mutations', 'trigger', EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_protect_comment_mutations'));

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE & MULTI-LAYER ROLE ESCALATION PROTECTION
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

-- Function: Trigger to block client-side role and user ID tampering
CREATE OR REPLACE FUNCTION public.fn_protect_profile_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Idempotent Trigger Creation: Protect existing triggers without blind drops
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_protect_profile_mutations'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_protect_profile_mutations
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_protect_profile_mutations()';
  END IF;
END $$;

-- Function: Privileged server-side role assignment (Service Role only)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id uuid,
  p_new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Function: Concurrency-safe profile generation on auth.users registration
CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
  v_raw_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_clean_username := regexp_replace(lower(trim(v_raw_username)), '[^a-z0-9_]', '_', 'g');
  
  IF char_length(v_clean_username) < 3 THEN
    v_clean_username := 'farmer_' || substr(md5(NEW.id::text), 1, 6);
  END IF;

  v_full_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'Kisan Farmer');
  v_state := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'state'), ''), 'General');
  v_pref_cat := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'preferred_category'), ''), 'General');
  v_candidate_username := v_clean_username;

  WHILE NOT v_inserted AND v_retry_count < 5 LOOP
    BEGIN
      INSERT INTO public.profiles (id, username, full_name, state, preferred_category, role)
      VALUES (NEW.id, v_candidate_username, v_full_name, v_state, v_pref_cat, 'user');
      v_inserted := true;
    EXCEPTION WHEN unique_violation THEN
      v_retry_count := v_retry_count + 1;
      v_candidate_username := v_clean_username || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
    END;
  END LOOP;

  IF NOT v_inserted THEN
    v_candidate_username := 'farmer_' || substr(replace(NEW.id::text, '-', ''), 1, 10);
    INSERT INTO public.profiles (id, username, full_name, state, preferred_category, role)
    VALUES (NEW.id, v_candidate_username, v_full_name, v_state, v_pref_cat, 'user')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Idempotent Trigger Creation on auth.users: Non-destructive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_on_auth_user_created'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_handle_new_auth_user()';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. APPLICATION TABLES
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

CREATE OR REPLACE FUNCTION public.fn_stamp_feedback_author_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Idempotent Trigger Creation: Feedback stamping
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_stamp_feedback_author'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_stamp_feedback_author
      BEFORE INSERT ON public.feedback
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_stamp_feedback_author_snapshot()';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_protect_feedback_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.user_id <> OLD.user_id OR NEW.resource_id <> OLD.resource_id OR 
     NEW.author_name <> OLD.author_name OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Feedback author identity, resource association, and creation time are immutable.';
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Idempotent Trigger Creation: Feedback mutation protection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_protect_feedback_mutations'
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

CREATE OR REPLACE FUNCTION public.fn_stamp_post_author_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Idempotent Trigger Creation: Post author snapshot
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_stamp_post_author'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_stamp_post_author
      BEFORE INSERT ON public.community_posts
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_stamp_post_author_snapshot()';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_protect_post_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id OR NEW.author_name <> OLD.author_name OR NEW.author_state <> OLD.author_state THEN
    RAISE EXCEPTION 'Author identity and post ownership cannot be altered.';
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Idempotent Trigger Creation: Post mutation protection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_protect_post_mutations'
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

CREATE OR REPLACE FUNCTION public.fn_stamp_comment_author_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Idempotent Trigger Creation: Comment author snapshot
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_stamp_comment_author'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_stamp_comment_author
      BEFORE INSERT ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_stamp_comment_author_snapshot()';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_protect_comment_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.post_id <> OLD.post_id OR NEW.user_id <> OLD.user_id OR 
     NEW.comment_author <> OLD.comment_author OR NEW.comment_state <> OLD.comment_state OR 
     NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Comment metadata, post association, and author identity are immutable.';
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Idempotent Trigger Creation: Comment mutation protection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_protect_comment_mutations'
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
-- Absolute zero raw user UUID exposure to external callers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_community_posts
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

CREATE OR REPLACE VIEW public.v_community_comments
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

CREATE OR REPLACE VIEW public.v_resource_feedback
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

CREATE OR REPLACE VIEW public.v_resource_ratings
WITH (security_barrier = true) AS
SELECT
  resource_id,
  round(avg(rating)::numeric, 1) AS avg_rating,
  count(*)::integer AS review_count
FROM public.feedback
GROUP BY resource_id;

-- ----------------------------------------------------------------------------
-- 5. RESOURCE VIEW INCREMENT FUNCTION (SERVICE ROLE ONLY)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_increment_resource_view(p_resource_id bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE public.resources
  SET views_count = views_count + 1
  WHERE id = p_resource_id
  RETURNING views_count INTO v_new_count;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Idempotent, non-destructive policy configuration for all tables
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
  -- Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own') THEN
    EXECUTE 'CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    EXECUTE 'CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
  END IF;

  -- Categories policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'categories_read_public') THEN
    EXECUTE 'CREATE POLICY "categories_read_public" ON public.categories FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  -- Resources policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resources' AND policyname = 'resources_read_public') THEN
    EXECUTE 'CREATE POLICY "resources_read_public" ON public.resources FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  -- Bookmarks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_select_own') THEN
    EXECUTE 'CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_insert_own') THEN
    EXECUTE 'CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_delete_own') THEN
    EXECUTE 'CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;

  -- Feedback policies
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

  -- Community Posts policies
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

  -- Comments policies
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

  -- Post Likes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_select_own') THEN
    EXECUTE 'CREATE POLICY "likes_select_own" ON public.post_likes FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_insert_own') THEN
    EXECUTE 'CREATE POLICY "likes_insert_own" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'likes_delete_own') THEN
    EXECUTE 'CREATE POLICY "likes_delete_own" ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;

  -- Manifest policy: Access restricted to service role and database administrator
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

-- 7.3 Specific Function Revocations
REVOKE ALL ON FUNCTION public.fn_protect_profile_mutations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_stamp_feedback_author_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_protect_feedback_mutations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_stamp_post_author_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_protect_post_mutations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_stamp_comment_author_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_protect_comment_mutations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_increment_resource_view(bigint) FROM PUBLIC, anon, authenticated;

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
GRANT EXECUTE ON FUNCTION public.fn_protect_profile_mutations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_stamp_feedback_author_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_protect_feedback_mutations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_stamp_post_author_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_protect_post_mutations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_stamp_comment_author_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_protect_comment_mutations() TO authenticated;

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
GRANT EXECUTE ON FUNCTION public.fn_increment_resource_view(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_handle_new_auth_user() TO postgres, service_role;

-- ----------------------------------------------------------------------------
-- 8. RECORD OWNERSHIP IN MANIFEST
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_created text[] := ARRAY[]::text[];
  v_reused text[] := ARRAY[]::text[];
  v_row record;
BEGIN
  FOR v_row IN SELECT obj_name, pre_existed FROM _kisan_inventory LOOP
    IF v_row.pre_existed THEN
      v_reused := array_append(v_reused, v_row.obj_name);
    ELSE
      v_created := array_append(v_created, v_row.obj_name);
    END IF;
  END LOOP;

  INSERT INTO public._kisan_migration_manifest (
    migration_id, created_objects, reused_objects, unknown_objects
  ) VALUES (
    '20261102000000_create_kisan_sahayak_schema',
    to_jsonb(v_created),
    to_jsonb(v_reused),
    '[]'::jsonb
  )
  ON CONFLICT (migration_id) DO UPDATE SET
    applied_at = timezone('utc'::text, now()),
    applied_by = current_user,
    created_objects = EXCLUDED.created_objects,
    reused_objects = EXCLUDED.reused_objects;
END $$;

COMMIT;
