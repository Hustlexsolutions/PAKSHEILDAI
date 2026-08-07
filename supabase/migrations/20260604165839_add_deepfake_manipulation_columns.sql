/*
  # Add Deepfake and Manipulation Score Columns to Scans Table

  1. New Columns
    - `deepfake_probability` (integer): Deepfake detection probability 0-100
    - `ai_generation_probability` (integer): AI generation probability 0-100
    - `manipulation_score` (integer): Image manipulation score 0-100
    - `forgery_score` (integer): Forgery risk score 0-100
    - `confidence_score` (integer): Overall analysis confidence 0-100

  2. Security
    - No RLS changes needed — table already has RLS enabled
    - Existing policies remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'deepfake_probability'
  ) THEN
    ALTER TABLE scans ADD COLUMN deepfake_probability integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'ai_generation_probability'
  ) THEN
    ALTER TABLE scans ADD COLUMN ai_generation_probability integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'manipulation_score'
  ) THEN
    ALTER TABLE scans ADD COLUMN manipulation_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'forgery_score'
  ) THEN
    ALTER TABLE scans ADD COLUMN forgery_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE scans ADD COLUMN confidence_score integer DEFAULT 0;
  END IF;
END $$;
