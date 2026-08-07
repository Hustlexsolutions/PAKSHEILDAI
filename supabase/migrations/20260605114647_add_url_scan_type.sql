
-- Extend scan_type to include 'url'
ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_scan_type_check;
ALTER TABLE scans ADD CONSTRAINT scans_scan_type_check
  CHECK (scan_type IN ('text', 'image', 'url'));

-- Add URL scan columns
ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS url_threat_level TEXT,
  ADD COLUMN IF NOT EXISTS url_malicious_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_suspicious_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_harmless_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_total_engines INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_detection_names TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS url_categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS url_final_url TEXT;
