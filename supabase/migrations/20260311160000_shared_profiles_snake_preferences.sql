-- Migration: Ristruttura database per supporto multi-app
-- 
-- Contesto: Questo progetto condivide lo stesso Supabase locale con altre app.
-- La tabella auth.users è naturalmente condivisa. Questa migration:
-- 1. Crea snake_preferences per le preferenze specifiche del gioco
-- 2. Rimuove le colonne snake-specific da profiles (se esistono)
-- 3. Rimuove il trigger on_auth_user_created (user_stats creato dal codice app)
-- 4. Assicura che profiles, game_scores, user_stats esistano

-- ============================================================
-- Funzione helper per updated_at (CREATE OR REPLACE è safe)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- Tabella profiles condivisa (se non esiste già da altre app)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies per profiles (IF NOT EXISTS non è supportato per policies, 
-- usiamo DO block per check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger updated_at per profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Tabella snake_preferences (preferenze specifiche del gioco)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.snake_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_theme TEXT DEFAULT 'nokia' CHECK (preferred_theme IN ('nokia', 'arcade', 'terminal')),
  preferred_difficulty TEXT DEFAULT 'medium' CHECK (preferred_difficulty IN ('easy', 'medium', 'hard')),
  sound_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Migra dati esistenti da profiles a snake_preferences (se le colonne esistono)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferred_theme'
  ) THEN
    INSERT INTO public.snake_preferences (user_id, preferred_theme, preferred_difficulty, sound_enabled)
    SELECT user_id, preferred_theme, preferred_difficulty, sound_enabled
    FROM public.profiles
    WHERE NOT EXISTS (
      SELECT 1 FROM public.snake_preferences sp WHERE sp.user_id = profiles.user_id
    );
  END IF;
END $$;

-- Rimuovi colonne snake-specific da profiles (se esistono)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS preferred_theme;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS preferred_difficulty;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS sound_enabled;

-- RLS per snake_preferences
ALTER TABLE public.snake_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'snake_preferences' AND policyname = 'Users can view their own snake preferences'
  ) THEN
    CREATE POLICY "Users can view their own snake preferences"
      ON public.snake_preferences FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'snake_preferences' AND policyname = 'Users can insert their own snake preferences'
  ) THEN
    CREATE POLICY "Users can insert their own snake preferences"
      ON public.snake_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'snake_preferences' AND policyname = 'Users can update their own snake preferences'
  ) THEN
    CREATE POLICY "Users can update their own snake preferences"
      ON public.snake_preferences FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_snake_preferences_updated_at ON public.snake_preferences;
CREATE TRIGGER update_snake_preferences_updated_at
  BEFORE UPDATE ON public.snake_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Tabelle specifiche di Snake (game_scores, user_stats)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  snake_length INTEGER NOT NULL DEFAULT 3,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  theme TEXT NOT NULL CHECK (theme IN ('nokia', 'arcade', 'terminal')),
  game_duration_seconds INTEGER NOT NULL DEFAULT 0,
  powerups_collected INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'game_scores' AND policyname = 'Game scores are viewable by everyone'
  ) THEN
    CREATE POLICY "Game scores are viewable by everyone"
      ON public.game_scores FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'game_scores' AND policyname = 'Users can insert their own scores'
  ) THEN
    CREATE POLICY "Users can insert their own scores"
      ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- FK game_scores -> profiles (se non esiste)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_game_scores_profiles' AND table_name = 'game_scores'
  ) THEN
    ALTER TABLE public.game_scores 
    ADD CONSTRAINT fk_game_scores_profiles 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indici per game_scores
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON public.game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_difficulty ON public.game_scores(difficulty);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON public.game_scores(created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_games INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  max_snake_length INTEGER NOT NULL DEFAULT 3,
  total_play_time_seconds INTEGER NOT NULL DEFAULT 0,
  total_powerups_collected INTEGER NOT NULL DEFAULT 0,
  games_by_difficulty JSONB DEFAULT '{"easy": 0, "medium": 0, "hard": 0}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can view their own stats'
  ) THEN
    CREATE POLICY "Users can view their own stats"
      ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can insert their own stats'
  ) THEN
    CREATE POLICY "Users can insert their own stats"
      ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can update their own stats'
  ) THEN
    CREATE POLICY "Users can update their own stats"
      ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON public.user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Rimuovi il trigger automatico on_auth_user_created
-- (user_stats viene creato dal codice app alla prima partita)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
