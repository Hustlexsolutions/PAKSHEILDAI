/*
  # Add Hive AI Deepfake Detection Columns to Scans Table

  1. New Columns
    - `hive_used` (boolean): Whether Hive AI was used in analysis
    - `hive_error` (text): Error message if Hive failed
    - `hive_ai_generated_score` (integer): AI-generated probability 0-100
    - `hive_deepfake_score` (integer): Deepfake probability 0-100
    - `hive_generator_attribution` (text): Detected AI generator name
    - `hive_detection_status` (text): Detection status (ai_generated/deepfake/authentic/inconclusive)

  2. Security
    - No RLS changes needed — table already has RLS enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'hive_used'
  ) THEN
    ALTER TABLE scans ADD COLUMN hive_used boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'hive_error'
  ) THEN
    ALTER TABLE scans ADD COLUMN hive_error text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'hive_ai_generated_score'
  ) THEN
    ALTER TABLE scans ADD COLUMN hive_ai_generated_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'hive_deepfake_score'
  ) THEN
    ALTER TABLE scans ADD COLUMN hive_deepfake_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'hive_generator_attribution'
  ) THEN
    ALTER TABLE scans ADD COLUMN hive_generator_attribution text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'hive_detection_status'
  ) THEN
    ALTER TABLE scans ADD COLUMN hive_detection_status text DEFAULT 'inconclusive';
  END IF;
END $$;