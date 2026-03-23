-- Migration: adicionar macros (proteína, carboidrato, gordura) nas tabelas meals e snacks
-- Execute no Supabase: Dashboard → SQL Editor → cole e execute

-- Adiciona colunas de macros na tabela meals
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS protein_total NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carbs_total   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fat_total     NUMERIC NOT NULL DEFAULT 0;

-- Adiciona colunas de macros na tabela snacks
ALTER TABLE public.snacks
  ADD COLUMN IF NOT EXISTS protein NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carbs   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fat     NUMERIC NOT NULL DEFAULT 0;

-- Adiciona políticas de UPDATE que estavam faltando
CREATE POLICY IF NOT EXISTS "Users can update own meals"
  ON public.meals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own snacks"
  ON public.snacks FOR UPDATE USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  sex TEXT CHECK (sex IN ('male', 'female')),
  weight NUMERIC,
  height NUMERIC,
  body_fat NUMERIC,
  muscle_mass NUMERIC,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')),
  goal_period TEXT CHECK (goal_period IN ('weekly', 'monthly', 'quarterly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Daily targets table
CREATE TABLE public.daily_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kcal_target INTEGER NOT NULL DEFAULT 2000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.daily_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own targets" ON public.daily_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own targets" ON public.daily_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own targets" ON public.daily_targets FOR UPDATE USING (auth.uid() = user_id);

-- Meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  kcal_total NUMERIC NOT NULL DEFAULT 0,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Snacks table
CREATE TABLE public.snacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grams NUMERIC NOT NULL,
  kcal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.snacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snacks" ON public.snacks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snacks" ON public.snacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own snacks" ON public.snacks FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.daily_targets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_daily_targets_updated_at BEFORE UPDATE ON public.daily_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
