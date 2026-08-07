-- Phase 3: Add Hive expanded columns + OpenRouter verification + consensus
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_trust_score integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_response_time integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_midjourney_score integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_stablediffusion_score integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_dalle_score integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_flux_score integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_all_classes jsonb DEFAULT '[]';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS hive_image_metadata jsonb;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS openrouter_verification jsonb;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS consensus_status text DEFAULT 'hive_only';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS consensus_classification text;

-- RLS already enabled from prior migration