import { supabase } from './supabase';
import type { Scan, ScanInsert } from './supabase';

/* ─── Save a single scan result ─────────────────────────────────── */
export async function saveScan(data: Omit<ScanInsert, 'user_id'>): Promise<Scan | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: scan, error } = await supabase
    .from('scans')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('saveScan error:', error.message);
    return null;
  }
  return scan;
}

/* ─── Fetch all scans for the current user ───────────────────────── */
export async function getUserScans(limit = 50): Promise<Scan[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getUserScans error:', error.message);
    return [];
  }
  return data ?? [];
}

/* ─── Aggregate stats for the dashboard ─────────────────────────── */
export interface DashboardStats {
  totalScans: number;
  highRiskAlerts: number;
  scamsBlocked: number;
  imagesAnalyzed: number;
  urlsScanned: number;
  suspiciousUrls: number;
  safeUrls: number;
  verifiedTransactions: number;
  recentScans: Scan[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  const empty = { totalScans: 0, highRiskAlerts: 0, scamsBlocked: 0, imagesAnalyzed: 0, urlsScanned: 0, suspiciousUrls: 0, safeUrls: 0, verifiedTransactions: 0, recentScans: [] };
  if (!user) return empty;

  const { data: scans, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !scans) {
    console.error('getDashboardStats error:', error?.message);
    return empty;
  }

  const urlScans = scans.filter((s) => s.scan_type === 'url');
  const imageScans = scans.filter((s) => s.scan_type === 'image');
  const textScans = scans.filter((s) => s.scan_type === 'text');

  return {
    totalScans: scans.length,
    highRiskAlerts: scans.filter((s) => s.classification === 'CRITICAL' || s.classification === 'HIGH' || s.classification === 'MALICIOUS').length,
    scamsBlocked: textScans.filter((s) => s.classification === 'CRITICAL' || s.classification === 'HIGH').length,
    imagesAnalyzed: imageScans.length,
    urlsScanned: urlScans.length,
    suspiciousUrls: urlScans.filter((s) => s.classification === 'SUSPICIOUS' || s.classification === 'MALICIOUS').length,
    safeUrls: urlScans.filter((s) => s.classification === 'SAFE').length,
    verifiedTransactions: imageScans.filter((s) => s.classification === 'Likely Authentic Transaction' || s.classification === 'Likely Authentic').length,
    recentScans: scans.slice(0, 20),
  };
}
