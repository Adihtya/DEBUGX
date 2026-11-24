-- ==============================================================================
-- DEBUGX SUPABASE DATABASE SCHEMA MIGRATION
-- Find the Bug. Understand the Cause. Fix with Confidence.
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Table: profiles
-- References auth.users(id). Automatically populated via auth trigger.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT DEFAULT 'Developer',
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Table: user_preferences
-- Stores user-specific settings: explanation mode, language, theme.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    explanation_mode TEXT DEFAULT 'beginner' CHECK (explanation_mode IN ('beginner', 'advanced')),
    preferred_language TEXT DEFAULT 'Python',
    theme TEXT DEFAULT 'dark',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. Table: debugging_history
-- Stores debugging sessions, AI code corrections, and root-cause explanations.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.debugging_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    programming_language TEXT NOT NULL DEFAULT 'Python',
    original_code TEXT NOT NULL,
    error_message TEXT,
    error_type TEXT DEFAULT 'Runtime Error',
    root_cause TEXT,
    corrected_code TEXT,
    explanation JSONB DEFAULT '[]'::jsonb,
    severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    screenshot_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. Indexes for fast querying & sorting
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_debugging_history_user_id ON public.debugging_history(user_id);
CREATE INDEX IF NOT EXISTS idx_debugging_history_created_at ON public.debugging_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debugging_history_lang ON public.debugging_history(programming_language);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- ==============================================================================
-- 6. UpdatedAt Automatic Trigger Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_preferences_updated ON public.user_preferences;
CREATE TRIGGER on_user_preferences_updated
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. Automatic User Profile & Preferences Creation Trigger
-- Fires when a new user signs up via Supabase Auth (e.g. Google OAuth)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_avatar TEXT;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'Developer'
    );
    user_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        ''
    );

    -- 1. Insert into profiles
    INSERT INTO public.profiles (id, full_name, email, avatar_url, created_at, updated_at)
    VALUES (NEW.id, user_name, NEW.email, user_avatar, now(), now())
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- 2. Insert into user_preferences
    INSERT INTO public.user_preferences (user_id, explanation_mode, preferred_language, theme)
    VALUES (NEW.id, 'beginner', 'Python', 'dark')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. Row Level Security (RLS) Policies
-- Complete user data isolation: users can strictly access only their own data.
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debugging_history ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policies for user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for debugging_history
DROP POLICY IF EXISTS "Users can view their own debugging history" ON public.debugging_history;
CREATE POLICY "Users can view their own debugging history"
    ON public.debugging_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their debugging history" ON public.debugging_history;
CREATE POLICY "Users can insert into their debugging history"
    ON public.debugging_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own debugging history" ON public.debugging_history;
CREATE POLICY "Users can update their own debugging history"
    ON public.debugging_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own debugging history" ON public.debugging_history;
CREATE POLICY "Users can delete their own debugging history"
    ON public.debugging_history FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 9. Storage Bucket: debugx-uploads
-- Dedicated storage for user screenshots and camera captures
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'debugx-uploads',
    'debugx-uploads',
    false,
    10485760, -- 10MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- Storage RLS Policies: Path format is {user_id}/{filename}
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
CREATE POLICY "Users can upload their own screenshots"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'debugx-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can view their own screenshots" ON storage.objects;
CREATE POLICY "Users can view their own screenshots"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'debugx-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;
CREATE POLICY "Users can delete their own screenshots"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'debugx-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
