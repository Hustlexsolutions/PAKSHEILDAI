/*
  # Create scans table with RLS

  1. New Tables
    - `scans`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, references auth.users, NOT NULL)
      - `scan_type` (text, 'text' or 'image')
      - `content` (text, scanned content or filename)
      - `risk_score` (integer, 0-100)
      - `classification` (text, e.g. CRITICAL, HIGH, MEDIUM, SAFE)
      - `created_at` (timestamptz, defaults to now())

  2. Security
    - Enable RLS on `scans` table
    - SELECT: authenticated users can only read their own scans
    - INSERT: authenticated users can only insert scans with their own user_id
    - UPDATE: authenticated users can only update their own scans
    - DELETE: authenticated users can only delete their own scans

  3. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for ordering
*/

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type text NOT NULL CHECK (scan_type IN ('text', 'image')),
  content text NOT NULL DEFAULT '',
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  classification text NOT NULL DEFAULT 'SAFE',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'scans' AND indexname = 'scans_user_id_idx'
  ) THEN
    CREATE INDEX scans_user_id_idx ON scans(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'scans' AND indexname = 'scans_created_at_idx'
  ) THEN
    CREATE INDEX scans_created_at_idx ON scans(created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can view own scans'
  ) THEN
    CREATE POLICY "Users can view own scans"
      ON scans FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can insert own scans'
  ) THEN
    CREATE POLICY "Users can insert own scans"
      ON scans FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can update own scans'
  ) THEN
    CREATE POLICY "Users can update own scans"
      ON scans FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can delete own scans'
  ) THEN
    CREATE POLICY "Users can delete own scans"
      ON scans FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
