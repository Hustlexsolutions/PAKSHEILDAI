import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Eye, Image, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getUserScans } from '../lib/db';
import type { Scan } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

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

const riskColor = (c: string) => RISK_COLORS[c?.toUpperCase()] ?? '#a8b3cf';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type FilterType = 'all' | 'text' | 'image';
type FilterRisk = 'all' | 'critical' | 'high' | 'medium' | 'safe';

export default function ScanHistory() {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterRisk, setFilterRisk] = useState<FilterRisk>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserScans(200);
      setScans(data);
    } catch {
      setError('Failed to load scan history. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = scans.filter((s) => {
    if (filterType !== 'all' && s.scan_type !== filterType) return false;
    if (filterRisk !== 'all') {
      const c = s.classification?.toUpperCase();
      if (filterRisk === 'critical' && c !== 'CRITICAL') return false;
      if (filterRisk === 'high' && !['HIGH', 'AI_GENERATED', 'MANIPULATED'].includes(c)) return false;
      if (filterRisk === 'medium' && !['MEDIUM', 'SUSPICIOUS'].includes(c)) return false;
      if (filterRisk === 'safe' && !['SAFE', 'AUTHENTIC', 'LOW'].includes(c)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.content.toLowerCase().includes(q) && !s.classification.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: scans.length,
    critical: scans.filter((s) => s.classification?.toUpperCase() === 'CRITICAL').length,
    high: scans.filter((s) => ['HIGH', 'AI_GENERATED', 'MANIPULATED'].includes(s.classification?.toUpperCase())).length,
    safe: scans.filter((s) => ['SAFE', 'AUTHENTIC', 'LOW'].includes(s.classification?.toUpperCase())).length,
  };

  return (
    <div className="min-h-screen" style={{ paddingTop: 96, paddingBottom: 48 }}>
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="section-label">Security Records</span>
            </div>
            <h1
              className="font-sora font-bold text-white"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              Scan History
            </h1>
            {user && (
              <p className="data-mono mt-1" style={{ fontSize: '11px', color: '#5a6a88' }}>
                {user.email}
              </p>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-150 disabled:opacity-50"
            style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>Refresh</span>
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Total Scans', val: stats.total, color: '#a8b3cf' },
            { label: 'Critical', val: stats.critical, color: '#FF4D4D' },
            { label: 'High Risk', val: stats.high, color: '#FF8C42' },
            { label: 'Safe', val: stats.safe, color: '#00FF88' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              className="rounded-2xl p-4"
              style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
            >
              {loading ? (
                <div className="h-6 w-10 rounded animate-pulse mb-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              ) : (
                <div className="font-sora font-bold tabular-nums mb-1" style={{ fontSize: '1.5rem', letterSpacing: '-0.03em', color: s.color, lineHeight: 1 }}>
                  {s.val}
                </div>
              )}
              <div className="text-xs" style={{ color: '#5a6a88' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters + search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5a6a88' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by content or classification..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder:text-text-muted outline-none text-sm"
              style={{
                background: '#0A1828',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['all', 'text', 'image'] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize"
                style={{
                  background: filterType === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: filterType === t ? '#ffffff' : '#5a6a88',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Risk filter */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['all', 'critical', 'high', 'medium', 'safe'] as FilterRisk[]).map((r) => (
              <button
                key={r}
                onClick={() => { setFilterRisk(r); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize"
                style={{
                  background: filterRisk === r ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: filterRisk === r ? '#ffffff' : '#5a6a88',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
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

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
          >
            {[
              { label: 'Content', span: 'col-span-5' },
              { label: 'Type', span: 'col-span-1' },
              { label: 'Score', span: 'col-span-1' },
              { label: 'Risk', span: 'col-span-2' },
              { label: 'Date', span: 'col-span-3 text-right' },
            ].map((h) => (
              <div key={h.label} className={`data-mono ${h.span}`} style={{ fontSize: '10px', color: '#3d4f6b', letterSpacing: '0.06em' }}>
                {h.label.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <Shield className="w-10 h-10 mb-4" style={{ color: '#3d4f6b' }} />
              {scans.length === 0 ? (
                <>
                  <p className="font-semibold text-white mb-2" style={{ fontSize: '14px' }}>No scans yet</p>
                  <p className="text-sm mb-5" style={{ color: '#5a6a88' }}>
                    Start protecting yourself by running your first scan.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/scan" className="btn-primary text-sm py-2.5 px-4">
                      <Shield className="w-4 h-4" />
                      Scam Detector
                    </Link>
                    <Link to="/image" className="btn-secondary text-sm py-2.5 px-4">
                      <Eye className="w-4 h-4" />
                      Image Analyzer
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white mb-1" style={{ fontSize: '14px' }}>No matching scans</p>
                  <p className="text-sm" style={{ color: '#5a6a88' }}>Try adjusting your filters or search query.</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <AnimatePresence>
                {paginated.map((scan, i) => {
                  const c = riskColor(scan.classification);
                  const isExpanded = expanded === scan.id;
                  return (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div
                        className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center cursor-pointer"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onClick={() => setExpanded(isExpanded ? null : scan.id)}
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
                              : <Eye className="w-2.5 h-2.5" style={{ color: c }} />
                            }
                          </div>
                          <span className="text-white truncate" style={{ fontSize: '12px' }}>{scan.content}</span>
                        </div>
                        <div className="col-span-1">
                          <span className="data-mono capitalize" style={{ fontSize: '11px', color: '#5a6a88' }}>{scan.scan_type}</span>
                        </div>
                        <div className="col-span-1">
                          <span className="data-mono font-bold" style={{ fontSize: '13px', color: c }}>{scan.risk_score}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span
                            className="data-mono font-bold px-1.5 py-0.5 rounded"
                            style={{ fontSize: '10px', color: c, background: `${c}12`, border: `1px solid ${c}20`, letterSpacing: '0.04em' }}
                          >
                            {scan.classification.slice(0, 8)}
                          </span>
                          {isExpanded
                            ? <ChevronUp className="w-3 h-3 ml-auto" style={{ color: '#3d4f6b' }} />
                            : <ChevronDown className="w-3 h-3 ml-auto" style={{ color: '#3d4f6b' }} />
                          }
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="data-mono" style={{ fontSize: '11px', color: '#3d4f6b' }}>{timeAgo(scan.created_at)}</span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div
                              className="px-5 py-4 mx-5 mb-3 rounded-xl"
                              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                              <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                  <div className="data-mono mb-1.5" style={{ fontSize: '10px', color: '#3d4f6b', letterSpacing: '0.06em' }}>CONTENT</div>
                                  <p className="text-sm" style={{ color: '#a8b3cf', lineHeight: 1.6, wordBreak: 'break-all' }}>{scan.content}</p>
                                </div>
                                <div>
                                  <div className="data-mono mb-1.5" style={{ fontSize: '10px', color: '#3d4f6b', letterSpacing: '0.06em' }}>DETAILS</div>
                                  <div className="space-y-1.5">
                                    {[
                                      { k: 'Type', v: scan.scan_type },
                                      { k: 'Risk Score', v: `${scan.risk_score}/100` },
                                      { k: 'Classification', v: scan.classification },
                                    ].map((d) => (
                                      <div key={d.k} className="flex justify-between">
                                        <span className="text-xs" style={{ color: '#5a6a88' }}>{d.k}</span>
                                        <span className="data-mono text-xs" style={{ color: '#a8b3cf' }}>{d.v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="data-mono mb-1.5" style={{ fontSize: '10px', color: '#3d4f6b', letterSpacing: '0.06em' }}>TIMESTAMP</div>
                                  <p className="text-sm" style={{ color: '#a8b3cf' }}>
                                    {new Date(scan.created_at).toLocaleString()}
                                  </p>
                                  <p className="data-mono mt-1" style={{ fontSize: '10px', color: '#3d4f6b' }}>
                                    {timeAgo(scan.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b3cf' }}
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-7 rounded-lg text-xs transition-all duration-150"
                      style={{
                        background: page === p ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
                        color: page === p ? '#00FF88' : '#5a6a88',
                        border: page === p ? '1px solid rgba(0,255,136,0.2)' : '1px solid transparent',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b3cf' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <div className="mt-24"><Footer /></div>
    </div>
  );
}
