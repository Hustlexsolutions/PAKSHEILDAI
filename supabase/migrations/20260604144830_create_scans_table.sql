/*
  # Create scans table

  ## Summary
  Creates the `scans` table to store all user threat analysis results,
  with Row Level Security so users can only access their own scan records.

  ## New Tables
  - `scans`
    - `id` (uuid, primary key, auto-generated)
    - `user_id` (uuid, foreign key → auth.users, not null)
    - `scan_type` (text, either 'text' or 'image')
    - `content` (text, the scanned content or filename)
    - `risk_score` (integer 0-100)
    - `classification` (text, e.g. 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE')
    - `created_at` (timestamptz, defaults to now())

  ## Security
  - RLS enabled on `scans` table
  - SELECT: authenticated users can only read their own rows
  - INSERT: authenticated users can only insert rows with their own user_id
  - No UPDATE or DELETE policies (scans are immutable audit records)

  ## Indexes
  - Index on `user_id` for fast per-user queries
  - Index on `created_at` for time-ordered retrieval
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

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS scans_user_id_idx ON scans (user_id);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at DESC);

-- Enable Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Users can only read their own scans
CREATE POLICY "Users can view own scans"
  ON scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only insert scans for themselves
CREATE POLICY "Users can insert own scans"
  ON scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
