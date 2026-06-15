-- Adaugă coloana folder la tabela schemas
-- Rulează în Supabase Dashboard → SQL Editor
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT NULL;
