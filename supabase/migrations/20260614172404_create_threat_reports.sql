CREATE TABLE IF NOT EXISTS threat_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  threat_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  report_source TEXT DEFAULT 'user' NOT NULL
);

ALTER TABLE threat_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can read threat reports (public safety data)
CREATE POLICY "public_read_threat_reports" ON threat_reports
  FOR SELECT TO anon, authenticated USING (true);

-- Anyone can submit a report (public safety reporting tool)
CREATE POLICY "public_insert_threat_reports" ON threat_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);
