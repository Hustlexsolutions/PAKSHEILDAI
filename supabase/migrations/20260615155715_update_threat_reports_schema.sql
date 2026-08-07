ALTER TABLE threat_reports ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE threat_reports ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE threat_reports ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE threat_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'resolved'));

-- Add index for future heatmap queries
CREATE INDEX IF NOT EXISTS idx_threat_reports_location ON threat_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_threat_reports_created_at ON threat_reports(created_at DESC);