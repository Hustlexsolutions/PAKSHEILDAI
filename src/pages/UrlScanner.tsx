import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link as LinkIcon, Shield, AlertTriangle, CheckCircle, XCircle, Info,
  Zap, Trash2, ChevronRight, LogIn, Globe, Search, Eye, Wifi, WifiOff, Key,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import FIAReportButton from '../components/FIAReportButton';
import { saveScan } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { scanUrl, getVtDiagnostics, type UrlScanResult, type VtDiagnostics } from '../lib/virustotal';

const LEVEL_CFG: Record<string, {
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
}> = {
  SAFE: { color: '#00FF88', icon: CheckCircle, label: 'SAFE' },
  SUSPICIOUS: { color: '#FFC857', icon: AlertTriangle, label: 'SUSPICIOUS' },
  MALICIOUS: { color: '#FF4D4D', icon: XCircle, label: 'MALICIOUS' },
  UNKNOWN: { color: '#5a6a88', icon: Info, label: 'UNKNOWN' },
};

const SAMPLES = [
  'https://google.com',
  'https://easypaisa.com.pk',
  'http://easypaisa-verify-account.tk/login',
];

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    return u.hostname.includes('.');
  } catch { return false; }
}

export default function UrlScanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<UrlScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [diagnostics, setDiagnostics] = useState<VtDiagnostics | null>(null);
  const [connStatus, setConnStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Check API connection on mount
  useEffect(() => {
    const diag = getVtDiagnostics();
    if (!diag.api_key_loaded) {
      setDiagnostics({ ...diag, connection_status: 'disconnected' });
      setConnStatus('disconnected');
      return;
    }
    // Mark as connected if key is present — real validation happens on first scan
    setDiagnostics({ ...diag, connection_status: 'connected' });
    setConnStatus('connected');
  }, []);

  const run = async () => {
    const target = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    if (!isValidUrl(target)) { setApiError('Please enter a valid URL.'); return; }
    setLoading(true);
    setResult(null);
    setSaved(false);
    setApiError(null);
    setStatusMsg('Submitting URL to VirusTotal...');

    try {
      setStatusMsg('Analyzing with 70+ security engines...');
      const scanResult = await scanUrl(target);
      setStatusMsg('');

      if (scanResult.error) {
        // Update diagnostics with the error
        setDiagnostics((d) => d ? { ...d, connection_status: 'disconnected', last_error: scanResult.error } : d);
        setConnStatus('disconnected');
        setApiError(scanResult.error);
        toast(scanResult.error, 'error');
        setLoading(false);
        return;
      }

      // Successful scan — mark connected
      setDiagnostics((d) => d ? { ...d, connection_status: 'connected', last_error: null } : d);
      setConnStatus('connected');
      setResult(scanResult);

      if (user) {
        const savedScan = await saveScan({
          scan_type: 'url',
          content: target,
          risk_score: scanResult.risk_score,
          classification: scanResult.threat_level,
          url_threat_level: scanResult.threat_level,
          url_malicious_count: scanResult.malicious_count,
          url_suspicious_count: scanResult.suspicious_count,
          url_harmless_count: scanResult.harmless_count,
          url_total_engines: scanResult.total_engines,
          url_detection_names: scanResult.detection_names,
          url_categories: scanResult.categories,
          url_final_url: scanResult.final_url ?? target,
        });
        if (savedScan) { setSaved(true); toast('URL scan saved.', 'success'); }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan failed. Please try again.';
      setDiagnostics((d) => d ? { ...d, connection_status: 'disconnected', last_error: msg } : d);
      setConnStatus('disconnected');
      setApiError(msg);
      toast(msg, 'error');
    }
    setStatusMsg('');
    setLoading(false);
  };

  const cfg = result ? (LEVEL_CFG[result.threat_level] ?? LEVEL_CFG.UNKNOWN) : null;

  const connColor = connStatus === 'connected' ? '#00FF88' : connStatus === 'disconnected' ? '#FF4D4D' : '#FFC857';
  const connLabel = connStatus === 'connected' ? 'VirusTotal Connected' : connStatus === 'disconnected' ? 'VirusTotal Disconnected' : 'Checking...';

  return (
    <div className="min-h-screen" style={{ paddingTop: 96, paddingBottom: 48 }}>
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="section-label">URL Scanner</span>
            <span className="data-mono px-2 py-0.5 rounded flex items-center gap-1.5"
              style={{ fontSize: '10px', color: connColor, background: `${connColor}10`, border: `1px solid ${connColor}25` }}>
              {connStatus === 'connected'
                ? <Wifi className="w-2.5 h-2.5" />
                : connStatus === 'disconnected'
                ? <WifiOff className="w-2.5 h-2.5" />
                : <div className="w-2.5 h-2.5 rounded-full border border-current animate-spin" />
              }
              {connLabel}
            </span>
          </div>
          <h1 className="font-sora font-bold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.035em', lineHeight: 1.05 }}>
            URL & Link Scanner
          </h1>
          <p className="text-base" style={{ color: '#a8b3cf', lineHeight: 1.7 }}>
            Check any website, WhatsApp link, payment portal, or unknown domain against 70+ security engines in real time.
          </p>
        </motion.div>

        {/* Diagnostics panel */}
        {diagnostics && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
            <div className="rounded-2xl p-4" style={{
              background: '#0A1828',
              border: `1px solid ${diagnostics.connection_status === 'connected' ? 'rgba(0,255,136,0.12)' : 'rgba(255,77,77,0.15)'}`,
            }}>
              <div className="flex items-center gap-2 mb-3">
                {diagnostics.connection_status === 'connected'
                  ? <Wifi className="w-3.5 h-3.5" style={{ color: '#00FF88' }} />
                  : <WifiOff className="w-3.5 h-3.5" style={{ color: '#FF4D4D' }} />
                }
                <span className="font-semibold" style={{ fontSize: '12px', color: diagnostics.connection_status === 'connected' ? '#00FF88' : '#FF4D4D' }}>
                  VirusTotal API Diagnostics
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'API Key Loaded',
                    value: diagnostics.api_key_loaded ? 'Yes' : 'No',
                    ok: diagnostics.api_key_loaded,
                  },
                  {
                    label: 'Key Preview',
                    value: diagnostics.api_key_preview,
                    ok: diagnostics.api_key_loaded,
                  },
                  {
                    label: 'API Connection',
                    value: diagnostics.connection_status === 'connected' ? 'Connected' : diagnostics.connection_status === 'disconnected' ? 'Disconnected' : 'Checking',
                    ok: diagnostics.connection_status === 'connected',
                  },
                  {
                    label: 'Proxy Endpoint',
                    value: 'supabase edge fn',
                    ok: true,
                  },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="data-mono mb-0.5" style={{ fontSize: '9px', color: '#3d4f6b' }}>{row.label.toUpperCase()}</div>
                    <div className="data-mono font-bold" style={{ fontSize: '11px', color: row.ok ? '#00FF88' : '#FF4D4D' }}>{row.value}</div>
                  </div>
                ))}
              </div>
              {diagnostics.last_error && (
                <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.12)' }}>
                  <div className="data-mono mb-1" style={{ fontSize: '9px', color: '#5a6a88' }}>LAST ERROR</div>
                  <p className="text-xs break-all" style={{ color: '#FF6B6B' }}>{diagnostics.last_error}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="rounded-2xl overflow-hidden mb-3" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              <span className="font-medium text-white" style={{ fontSize: '13px' }}>URL Input</span>
            </div>
            {url && (
              <button onClick={() => { setUrl(''); setResult(null); setApiError(null); }} className="p-1.5 rounded-lg" style={{ color: '#5a6a88' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-4">
            <LinkIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#5a6a88' }} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && run()}
              placeholder="https://example.com or paste any suspicious link..."
              className="flex-1 bg-transparent text-white placeholder:text-text-muted outline-none"
              style={{ fontSize: '14px' }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="data-mono" style={{ fontSize: '10px', color: '#3d4f6b', letterSpacing: '0.06em' }}>TRY SAMPLE:</span>
            {SAMPLES.map((s, i) => (
              <button key={i} onClick={() => { setUrl(s); setResult(null); setApiError(null); }}
                className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)', fontSize: '11px', color: '#00CC6A' }}>
                {i === 0 ? 'Safe URL' : i === 1 ? 'EasyPaisa' : 'Phishing URL'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <button onClick={run} disabled={!url.trim() || loading}
            className="btn-primary w-full justify-center py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(7,17,32,0.3)', borderTopColor: '#071120' }} />
                {statusMsg || 'Scanning...'}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Scan URL
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                <div className="rounded-xl p-4" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between mb-2">
                    <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>{statusMsg || 'Contacting VirusTotal...'}</span>
                    <span className="data-mono text-accent" style={{ fontSize: '11px' }}>Running</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #00FF88, #00CC6A)' }}
                      animate={{ width: ['10%', '70%', '90%'] }} transition={{ duration: 20, ease: 'easeOut' }} />
                  </div>
                  <div className="flex gap-4 mt-3">
                    {['Submit URL', 'Engine analysis', 'Threat scoring', 'Results'].map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: i < 2 ? '#00FF88' : 'rgba(255,255,255,0.1)' }} />
                        <span className="data-mono" style={{ fontSize: '10px', color: '#3d4f6b' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {apiError && !loading && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-3 flex items-start gap-3 rounded-xl p-4" style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm" style={{ color: '#FF6B6B' }}>{apiError}</p>
                  {!diagnostics?.api_key_loaded && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Key className="w-3 h-3" style={{ color: '#FFC857' }} />
                      <p className="text-xs" style={{ color: '#FFC857' }}>
                        Add VITE_VIRUSTOTAL_API_KEY to your .env file and restart the dev server.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && cfg && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="space-y-3">

              {/* Verdict */}
              <div className="rounded-2xl p-6" style={{ background: `${cfg.color}06`, border: `1px solid ${cfg.color}20`, boxShadow: `0 0 40px ${cfg.color}06` }}>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}22` }}>
                      <cfg.icon className="w-6 h-6" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="data-mono font-bold mb-1" style={{ fontSize: '11px', color: cfg.color, letterSpacing: '0.08em' }}>{cfg.label}</div>
                      <div className="font-sora font-semibold text-white" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                        {result.threat_level === 'MALICIOUS' ? 'Malicious URL Detected' :
                         result.threat_level === 'SUSPICIOUS' ? 'Suspicious URL' :
                         result.threat_level === 'SAFE' ? 'URL Appears Safe' : 'Unable to Verify'}
                      </div>
                      <div className="text-sm mt-0.5 font-mono truncate max-w-xs" style={{ color: '#6b7fa8' }}>{result.url}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-sora font-bold tabular-nums" style={{ fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1, color: cfg.color }}>{result.risk_score}</div>
                    <div className="data-mono" style={{ fontSize: '10px', color: '#5a6a88', letterSpacing: '0.06em' }}>RISK SCORE</div>
                  </div>
                </div>

                {/* Risk bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>Risk Level</span>
                    <span className="data-mono" style={{ fontSize: '11px', color: cfg.color }}>{result.risk_score}/100</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: result.risk_score > 70 ? 'linear-gradient(90deg,#FF8C42,#FF4D4D)' : result.risk_score > 20 ? 'linear-gradient(90deg,#00FF88,#FFC857)' : '#00FF88' }}
                      initial={{ width: '0%' }} animate={{ width: `${result.risk_score}%` }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                </div>

                {/* Engine stats */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Malicious', val: result.malicious_count, color: '#FF4D4D' },
                    { label: 'Suspicious', val: result.suspicious_count, color: '#FFC857' },
                    { label: 'Harmless', val: result.harmless_count, color: '#00FF88' },
                    { label: 'Undetected', val: result.undetected_count, color: '#5a6a88' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="font-sora font-bold tabular-nums" style={{ fontSize: '1.5rem', color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div className="data-mono mt-1" style={{ fontSize: '9px', color: '#5a6a88' }}>{s.label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="data-mono" style={{ fontSize: '10px', color: '#5a6a88' }}>Total security engines</span>
                  <span className="data-mono font-bold text-accent" style={{ fontSize: '10px' }}>{result.total_engines}</span>
                </div>
              </div>

              {/* Detection names */}
              {result.detection_names.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-danger" />
                    <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Flagging Engines ({result.detection_names.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.detection_names.map((name) => (
                      <span key={name} className="px-2.5 py-1 rounded-lg data-mono" style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.18)', fontSize: '11px', color: '#FF6B6B' }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {result.categories.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-white" style={{ fontSize: '13px' }}>URL Categories</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.categories.map((cat) => (
                      <span key={cat} className="px-2.5 py-1 rounded-lg data-mono" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.14)', fontSize: '11px', color: '#00CC6A' }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Security Recommendation</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#a8b3cf' }}>{result.recommendation}</p>
              </div>

              {/* FIA Cyber Crime Report Button */}
              <FIAReportButton
                visible={result.threat_level === 'MALICIOUS' || result.threat_level === 'SUSPICIOUS'}
              />

              {/* Saved / login prompt */}
              {saved && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                  <p className="text-sm" style={{ color: '#a8b3cf' }}>
                    Scan saved.{' '}
                    <Link to="/dashboard" className="text-accent font-medium hover:underline">View dashboard</Link>
                  </p>
                </motion.div>
              )}
              {!user && result && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <LogIn className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  <p className="text-sm" style={{ color: '#6b7fa8' }}>
                    <Link to="/signup" className="font-medium" style={{ color: '#a8b3cf' }}>Create a free account</Link>
                    {' '}to save URL scan history.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-24"><Footer /></div>
    </div>
  );
}
