/*
  # Add Image Verification Columns to Scans Table

  1. New Columns
    - `image_type` (text): Classification of the image (e.g. Banking Transaction Screenshot, EasyPaisa Receipt, etc.)
    - `authenticity_score` (integer): Transaction authenticity score 0-100
    - `trust_score` (integer): Screenshot trust score 0-100
    - `risk_score` (integer): Already exists, reused for forgery risk score
    - `extracted_text` (text): OCR-extracted text from the image
    - `extracted_transaction_data` (jsonb): Structured extracted transaction data (amount, date, bank, etc.)
    - `editing_indicators` (jsonb): Array of editing/manipulation indicators found
    - `ai_indicators` (jsonb): Array of AI-generation indicators found
    - `verification_notes` (jsonb): Array of verification notes
    - `recommendations` (jsonb): Array of recommendation strings

  2. Security
    - No RLS changes needed — table already has RLS enabled
    - Existing policies remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'image_type'
  ) THEN
    ALTER TABLE scans ADD COLUMN image_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'authenticity_score'
  ) THEN
    ALTER TABLE scans ADD COLUMN authenticity_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'trust_score'
  ) THEN
    ALTER TABLE scans ADD COLUMN trust_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'extracted_text'
  ) THEN
    ALTER TABLE scans ADD COLUMN extracted_text text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'extracted_transaction_data'
  ) THEN
    ALTER TABLE scans ADD COLUMN extracted_transaction_data jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'editing_indicators'
  ) THEN
    ALTER TABLE scans ADD COLUMN editing_indicators jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'ai_indicators'
  ) THEN
    ALTER TABLE scans ADD COLUMN ai_indicators jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE scans ADD COLUMN verification_notes jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'recommendations'
  ) THEN
    ALTER TABLE scans ADD COLUMN recommendations jsonb DEFAULT '[]';
  END IF;
END $$;
