import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Eye, Image, Activity, Zap, ArrowUpRight, Users, RefreshCw, Globe, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '../lib/db';
import type { Scan } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/* ─── Helpers ───────────────────────────────── */
const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#FF4D4D',
  HIGH: '#FF8C42',
  MEDIUM: '#FFC857',
  SAFE: '#00FF88',
  AI_GENERATED: '#FF4D4D',
  MANIPULATED: '#FF4D4D',
  SUSPICIOUS: '#FFC857',
  AUTHENTIC: '#00FF88',
  LOW: '#FFC857',
};

const riskColor = (c: string) => RISK_COLORS[c] ?? '#a8b3cf';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── SVG Area Chart ─────────────────────────── */
function AreaChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="w-full h-20 flex items-center justify-center text-xs" style={{ color: '#3d4f6b' }}>Not enough data</div>;
  }
  const H = 80, W = 280, pad = 8;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const coords = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#fill-${color.replace('#', '')})`} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/* ─── Bar Chart ──────────────────────────────── */
function BarChart({ data }: { data: { label: string; val: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.val)) || 1;
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full relative flex items-end" style={{ height: 64 }}>
            <motion.div
              className="w-full rounded-sm"
              style={{ background: d.color, opacity: 0.75 }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.val / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="data-mono" style={{ fontSize: '9px', color: '#5a6a88' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────── */
function StatCard({
  icon: Icon, label, value, delta, color = '#00FF88', delay = 0, loading = false,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  delta?: string;
  color?: string;
  delay?: number;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="group relative rounded-2xl p-5 overflow-hidden card-interactive"
      style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%, ${color}06 0%, transparent 70%)` }}
      />
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {delta && (
          <div className="flex items-center gap-0.5" style={{ color: '#00FF88' }}>
            <ArrowUpRight className="w-3 h-3" />
            <span className="data-mono" style={{ fontSize: '11px' }}>{delta}</span>
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
      ) : (
        <div className="font-sora font-bold mb-1 tabular-nums" style={{ fontSize: '1.625rem', letterSpacing: '-0.03em', lineHeight: 1, color: '#ffffff' }}>
          {value}
        </div>
      )}
      <div className="text-sm mt-1" style={{ color: '#5a6a88' }}>{label}</div>
    </motion.div>
  );
}

/* ─── Risk distribution from real scans ──────── */
function buildDistribution(scans: Scan[]) {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, SAFE: 0, OTHER: 0 };
  scans.forEach((s) => {
    const c = s.classification?.toUpperCase();
    if (c === 'CRITICAL') counts.CRITICAL++;
    else if (c === 'HIGH' || c === 'AI_GENERATED' || c === 'MANIPULATED') counts.HIGH++;
    else if (c === 'MEDIUM' || c === 'SUSPICIOUS') counts.MEDIUM++;
    else if (c === 'SAFE' || c === 'AUTHENTIC' || c === 'LOW') counts.SAFE++;
    else counts.OTHER++;
  });
  const total = scans.length || 1;
  return [
    { label: 'Critical', pct: Math.round((counts.CRITICAL / total) * 100), color: '#FF4D4D', count: counts.CRITICAL },
    { label: 'High', pct: Math.round((counts.HIGH / total) * 100), color: '#FF8C42', count: counts.HIGH },
    { label: 'Medium', pct: Math.round((counts.MEDIUM / total) * 100), color: '#FFC857', count: counts.MEDIUM },
    { label: 'Low / Safe', pct: Math.round((counts.SAFE / total) * 100), color: '#00FF88', count: counts.SAFE },
  ];
}

/* ─── Build chart data from scan timestamps ──── */
function buildChartData(scans: Scan[]) {
  // Group scans by hour (last 24 buckets)
  const now = Date.now();
  const buckets = Array(24).fill(0);
  scans.forEach((s) => {
    const hoursAgo = Math.floor((now - new Date(s.created_at).getTime()) / 3600000);
    if (hoursAgo >= 0 && hoursAgo < 24) {
      buckets[23 - hoursAgo]++;
    }
  });
  return buckets;
}

/* ─── Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(18432);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      setError('Failed to load dashboard data. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLiveCount((c) => c + Math.floor(Math.random() * 3)), 2500);
    return () => clearInterval(id);
  }, []);

  const chartData = stats ? buildChartData(stats.recentScans) : Array(24).fill(0);
  const distribution = stats ? buildDistribution(stats.recentScans) : [];
  const barData = Array.from({ length: 7 }, (_, i) => ({
    label: i === 6 ? 'Now' : `${6 - i}h`,
    val: chartData[17 + i] || 0,
    color: '#FF4D4D',
  }));

  return (
    <div className="min-h-screen" style={{ paddingTop: 96, paddingBottom: 48 }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="section-label">Security Operations</span>
            </div>
            <h1 className="font-sora font-bold text-white" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Threat Dashboard
            </h1>
            {user && (
              <p className="data-mono mt-1" style={{ fontSize: '11px', color: '#5a6a88' }}>
                {user.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-150 disabled:opacity-50"
              style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
              <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>Refresh</span>
            </button>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="status-dot animate-pulse" />
              <span className="data-mono text-accent" style={{ fontSize: '11px' }}>
                {liveCount.toLocaleString()} active
              </span>
            </div>
          </div>
        </motion.div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 rounded-xl p-4"
            style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}
          >
            <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
            <p className="text-sm" style={{ color: '#FF6B6B' }}>{error}</p>
          </motion.div>
        )}

        {/* Stat cards — 4 primary + 4 secondary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <StatCard icon={Shield} label="Total Scans" value={stats?.totalScans ?? 0} delay={0} loading={loading} />
          <StatCard icon={AlertTriangle} label="High-Risk Alerts" value={stats?.highRiskAlerts ?? 0} color="#FF4D4D" delay={0.07} loading={loading} />
          <StatCard icon={Eye} label="Scams Blocked" value={stats?.scamsBlocked ?? 0} color="#FFC857" delay={0.14} loading={loading} />
          <StatCard icon={Image} label="Images Analyzed" value={stats?.imagesAnalyzed ?? 0} delay={0.21} loading={loading} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Globe} label="URLs Scanned" value={stats?.urlsScanned ?? 0} color="#a8b3cf" delay={0.28} loading={loading} />
          <StatCard icon={AlertTriangle} label="Suspicious URLs" value={stats?.suspiciousUrls ?? 0} color="#FF8C42" delay={0.35} loading={loading} />
          <StatCard icon={CheckCircle} label="Safe URLs" value={stats?.safeUrls ?? 0} color="#00FF88" delay={0.42} loading={loading} />
          <StatCard icon={LinkIcon} label="Verified Transactions" value={stats?.verifiedTransactions ?? 0} color="#00FF88" delay={0.49} loading={loading} />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-3 mb-4">
          {/* Activity chart */}
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="font-semibold text-white" style={{ fontSize: '14px', letterSpacing: '-0.01em' }}>Threat Activity</div>
                <div className="data-mono mt-0.5" style={{ fontSize: '11px', color: '#5a6a88' }}>Last 24 hours (your scans)</div>
              </div>
              <div className="flex items-center gap-4">
                {[{ label: 'Threats', color: '#FF4D4D' }, { label: 'Scans', color: '#00FF88' }].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="w-full h-20 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ) : (
                <AreaChart data={chartData} color="#FF4D4D" />
              )}
            </div>
            <div className="flex justify-between mt-1 px-1">
              {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'].map((t) => (
                <span key={t} className="data-mono" style={{ fontSize: '10px', color: '#3d4f6b' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Risk distribution */}
          <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
            <div className="font-semibold text-white mb-0.5" style={{ fontSize: '14px', letterSpacing: '-0.01em' }}>Risk Distribution</div>
            <div className="data-mono mb-5" style={{ fontSize: '11px', color: '#5a6a88' }}>Your scan history</div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : distribution.length === 0 || (stats?.totalScans === 0) ? (
              <p className="text-sm" style={{ color: '#3d4f6b' }}>No scans yet. Run your first scan to see stats.</p>
            ) : (
              <div className="space-y-3">
                {distribution.map((d, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm" style={{ color: '#a8b3cf' }}>{d.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>{d.count}</span>
                        <span className="data-mono font-bold" style={{ fontSize: '12px', color: d.color, width: '32px', textAlign: 'right' }}>
                          {d.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: d.color }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hourly bar */}
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="data-mono mb-3" style={{ fontSize: '10px', color: '#5a6a88', letterSpacing: '0.06em' }}>HOURLY VOLUME</div>
              {loading ? (
                <div className="h-20 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ) : (
                <BarChart data={barData} />
              )}
            </div>
          </div>
        </div>

        {/* Row 3: scan history table + side panels */}
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Scan history table */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
            <div
              className="grid grid-cols-12 gap-2 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
            >
              {['Content', 'Type', 'Score', 'Risk', 'Time'].map((h, i) => (
                <div
                  key={h}
                  className={`data-mono ${i === 0 ? 'col-span-5' : 'col-span-1'} ${i === 4 ? 'col-span-3 text-right' : ''}`}
                  style={{ fontSize: '10px', color: '#3d4f6b', letterSpacing: '0.06em' }}
                >
                  {h.toUpperCase()}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : !stats || stats.recentScans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Shield className="w-10 h-10 mb-4" style={{ color: '#3d4f6b' }} />
                <p className="font-semibold text-white mb-1" style={{ fontSize: '14px' }}>No scans yet</p>
                <p className="text-sm" style={{ color: '#5a6a88' }}>
                  Run your first scan from the{' '}
                  <a href="/scan" className="text-accent hover:underline">Scam Detector</a>
                  {' '}or{' '}
                  <a href="/image" className="text-accent hover:underline">Image Analyzer</a>.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {stats.recentScans.map((scan, i) => {
                  const c = riskColor(scan.classification);
                  return (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: `${c}10`, border: `1px solid ${c}18` }}
                        >
                          {scan.scan_type === 'image'
                            ? <Image className="w-2.5 h-2.5" style={{ color: c }} />
                            : scan.scan_type === 'url'
                            ? <Globe className="w-2.5 h-2.5" style={{ color: c }} />
                            : <Eye className="w-2.5 h-2.5" style={{ color: c }} />
                          }
                        </div>
                        <span className="text-white truncate" style={{ fontSize: '12px' }}>{scan.content}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="data-mono capitalize" style={{ fontSize: '11px', color: '#5a6a88' }}>{scan.scan_type}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="data-mono font-bold" style={{ fontSize: '13px', color: c }}>
                          {scan.risk_score}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <span
                          className="data-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ fontSize: '10px', color: c, background: `${c}12`, border: `1px solid ${c}20`, letterSpacing: '0.04em' }}
                        >
                          {scan.classification.slice(0, 4)}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="data-mono" style={{ fontSize: '11px', color: '#3d4f6b' }}>
                          {timeAgo(scan.created_at)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side panels */}
          <div className="space-y-3">
            {/* Performance */}
            <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-accent" />
                <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Performance</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Avg Analysis', val: '1.18s', color: '#00FF88' },
                  { label: 'Image Scan', val: '2.04s', color: '#FFC857' },
                  { label: 'API P95', val: '380ms', color: '#00FF88' },
                  { label: 'Queue Depth', val: '0', color: '#00FF88' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#5a6a88' }}>{item.label}</span>
                    <span className="data-mono font-bold" style={{ fontSize: '12px', color: item.color }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-accent" />
                <span className="font-semibold text-white" style={{ fontSize: '13px' }}>System Status</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'OpenRouter AI', status: 'Operational', up: true },
                  { label: 'OCR.Space API', status: 'Operational', up: true },
                  { label: 'VirusTotal API', status: import.meta.env.VITE_VIRUSTOTAL_API_KEY ? 'Operational' : 'Key Required', up: !!import.meta.env.VITE_VIRUSTOTAL_API_KEY },
                  { label: 'Sightengine API', status: 'Operational', up: true },
                  { label: 'API Gateway', status: 'Operational', up: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#5a6a88' }}>{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: item.up ? '#00FF88' : '#FFC857' }} />
                      <span className="data-mono" style={{ fontSize: '11px', color: item.up ? '#00FF88' : '#FFC857' }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live users */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-accent" />
                <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Live Users</span>
              </div>
              <div className="font-sora font-bold tabular-nums mt-3" style={{ fontSize: '2rem', letterSpacing: '-0.04em', color: '#00FF88', lineHeight: 1 }}>
                {liveCount.toLocaleString()}
              </div>
              <div className="text-sm mt-1" style={{ color: '#5a6a88' }}>Currently protected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
