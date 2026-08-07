/*
  # Create scans table (idempotent)

  ## Summary
  Ensures the `scans` table exists with correct schema and RLS policies.
  Safe to re-run — all statements use IF NOT EXISTS / IF NOT EXISTS guards.

  ## Tables
  - `scans`: stores all user threat analysis results

  ## Security
  - RLS enabled; users can only SELECT and INSERT their own rows
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

CREATE INDEX IF NOT EXISTS scans_user_id_idx ON scans (user_id);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at DESC);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can view own scans'
  ) THEN
    CREATE POLICY "Users can view own scans"
      ON scans FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scans' AND policyname = 'Users can insert own scans'
  ) THEN
    CREATE POLICY "Users can insert own scans"
      ON scans FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
