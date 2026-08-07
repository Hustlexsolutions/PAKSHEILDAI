import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Key, Globe, FileText, Zap, ChevronDown, ChevronUp, Wifi, WifiOff, Cpu,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const VT_API_KEY = (import.meta.env.VITE_VIRUSTOTAL_API_KEY as string | undefined) ?? '';
const OCR_API_KEY = (import.meta.env.VITE_OCR_SPACE_API_KEY as string | undefined) ?? '';

// Tiny 1×1 white PNG for OCR connectivity test
const TEST_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';

type ServiceStatus = 'idle' | 'testing' | 'ok' | 'error';

interface ServiceState {
  status: ServiceStatus;
  lastResponse: string;
  lastError: string;
  httpStatus: number | null;
  testedAt: string | null;
}

const initialService: ServiceState = {
  status: 'idle', lastResponse: '', lastError: '', httpStatus: null, testedAt: null,
};

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === 'testing') return (
    <div className="flex items-center gap-1.5">
      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: '#FFC857' }} />
      <span className="data-mono font-bold" style={{ fontSize: '11px', color: '#FFC857' }}>TESTING</span>
    </div>
  );
  if (status === 'ok') return (
    <div className="flex items-center gap-1.5">
      <CheckCircle className="w-3.5 h-3.5" style={{ color: '#00FF88' }} />
      <span className="data-mono font-bold" style={{ fontSize: '11px', color: '#00FF88' }}>CONNECTED</span>
    </div>
  );
  if (status === 'error') return (
    <div className="flex items-center gap-1.5">
      <XCircle className="w-3.5 h-3.5" style={{ color: '#FF4D4D' }} />
      <span className="data-mono font-bold" style={{ fontSize: '11px', color: '#FF4D4D' }}>DISCONNECTED</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }} />
      <span className="data-mono font-bold" style={{ fontSize: '11px', color: '#5a6a88' }}>IDLE</span>
    </div>
  );
}

function RawResponseBlock({ label, content, defaultOpen = false }: { label: string; content: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 w-full text-left"
        style={{ color: '#5a6a88' }}
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        <span className="data-mono" style={{ fontSize: '10px' }}>{label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <pre
              className="mt-1.5 p-3 rounded-lg text-xs overflow-auto max-h-64 font-mono"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', color: '#a8b3cf', fontSize: '11px', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
              {content}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EnvRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>{label}</span>
      <span className="data-mono font-bold" style={{ fontSize: '11px', color: ok ? '#00FF88' : '#FF4D4D' }}>{value}</span>
    </div>
  );
}

export default function Diagnostics() {
  const [vt, setVt] = useState<ServiceState>(initialService);
  const [ocr, setOcr] = useState<ServiceState>(initialService);
  const [hive, setHive] = useState<ServiceState>(initialService);

  const envRows = [
    { label: 'VITE_SUPABASE_URL', value: SUPABASE_URL ? `Set (${SUPABASE_URL.slice(0, 30)}...)` : 'NOT SET', ok: !!SUPABASE_URL },
    { label: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY ? `Set (${SUPABASE_ANON_KEY.length} chars)` : 'NOT SET', ok: !!SUPABASE_ANON_KEY },
    { label: 'VITE_VIRUSTOTAL_API_KEY', value: VT_API_KEY ? `Set (${VT_API_KEY.length} chars) — ${VT_API_KEY.slice(0, 6)}****${VT_API_KEY.slice(-4)}` : 'NOT SET', ok: !!VT_API_KEY },
    { label: 'VITE_OCR_SPACE_API_KEY', value: OCR_API_KEY ? `Set (${OCR_API_KEY.length} chars) — ${OCR_API_KEY.slice(0, 4)}****${OCR_API_KEY.slice(-3)}` : 'NOT SET', ok: !!OCR_API_KEY },
    { label: 'VITE_OPENROUTER_API_KEY', value: import.meta.env.VITE_OPENROUTER_API_KEY ? `Set (${(import.meta.env.VITE_OPENROUTER_API_KEY as string).length} chars)` : 'NOT SET', ok: !!import.meta.env.VITE_OPENROUTER_API_KEY },
    { label: 'VT Proxy URL', value: `${SUPABASE_URL}/functions/v1/virustotal-proxy`, ok: !!SUPABASE_URL },
    { label: 'OCR Proxy URL', value: `${SUPABASE_URL}/functions/v1/ocr-proxy`, ok: !!SUPABASE_URL },
    { label: 'Hive Proxy URL', value: `${SUPABASE_URL}/functions/v1/hive-deepfake-proxy`, ok: !!SUPABASE_URL },
  ];

  const testVt = async () => {
    setVt({ ...initialService, status: 'testing', testedAt: new Date().toLocaleTimeString() });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/virustotal-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ url: 'https://google.com', api_key: VT_API_KEY }),
      });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep raw */ }

      if (res.ok) {
        const data = JSON.parse(text) as Record<string, unknown>;
        const stats = data.stats as Record<string, number> | undefined;
        const total = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;
        setVt((s) => ({ ...s, status: 'ok', httpStatus: res.status, lastResponse: pretty, lastError: total === 0 ? 'Warning: stats total=0 (may be cached empty result)' : '' }));
      } else {
        let errMsg = `HTTP ${res.status}`;
        try { errMsg = (JSON.parse(text) as { error?: string }).error ?? errMsg; } catch { /* keep */ }
        setVt((s) => ({ ...s, status: 'error', httpStatus: res.status, lastError: errMsg, lastResponse: pretty }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setVt((s) => ({ ...s, status: 'error', lastError: msg }));
    }
  };

  const testOcr = async () => {
    setOcr({ ...initialService, status: 'testing', testedAt: new Date().toLocaleTimeString() });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ocr-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ test: true, api_key: OCR_API_KEY }),
      });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep raw */ }

      if (res.ok) {
        setOcr((s) => ({ ...s, status: 'ok', httpStatus: res.status, lastResponse: pretty, lastError: '' }));
      } else {
        let errMsg = `HTTP ${res.status}`;
        try { errMsg = (JSON.parse(text) as { error?: string }).error ?? errMsg; } catch { /* keep */ }
        setOcr((s) => ({ ...s, status: 'error', httpStatus: res.status, lastError: errMsg, lastResponse: pretty }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setOcr((s) => ({ ...s, status: 'error', lastError: msg }));
    }
  };

  const testHive = async () => {
    setHive({ ...initialService, status: 'testing', testedAt: new Date().toLocaleTimeString() });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/hive-deepfake-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ test: true }),
      });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep raw */ }

      if (res.ok) {
        const data = JSON.parse(text) as Record<string, unknown>;
        const apiKeyLoaded = data.api_key_loaded as boolean | undefined;
        setHive((s) => ({
          ...s,
          status: apiKeyLoaded ? 'ok' : 'error',
          httpStatus: res.status,
          lastResponse: pretty,
          lastError: apiKeyLoaded ? '' : 'Hive API key not configured (HIVE_SECRET_KEY secret missing)',
        }));
      } else {
        let errMsg = `HTTP ${res.status}`;
        try { errMsg = (JSON.parse(text) as { error?: string }).error ?? errMsg; } catch { /* keep */ }
        setHive((s) => ({ ...s, status: 'error', httpStatus: res.status, lastError: errMsg, lastResponse: pretty }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setHive((s) => ({ ...s, status: 'error', lastError: msg }));
    }
  };

  // Auto-run tests on mount
  useEffect(() => {
    testVt();
    testOcr();
    testHive();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ paddingTop: 96, paddingBottom: 64 }}>
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-label">Internal</span>
            <span className="data-mono px-2 py-0.5 rounded" style={{ fontSize: '10px', color: '#FFC857', background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.15)' }}>
              DIAGNOSTICS
            </span>
          </div>
          <h1 className="font-sora font-bold text-white" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.035em', lineHeight: 1.05 }}>
            API Diagnostics
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#5a6a88' }}>
            Runtime status for all PakShield integrations. Tests run automatically on page load.
          </p>
        </motion.div>

        {/* Environment Variables */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mb-4">
          <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-accent" />
              <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Environment Variables</span>
              <span className="data-mono ml-auto" style={{ fontSize: '10px', color: '#3d4f6b' }}>Runtime values (no secrets exposed)</span>
            </div>
            <div>
              {envRows.map((row) => (
                <EnvRow key={row.label} label={row.label} value={row.value} ok={row.ok} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Service cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">

          {/* VirusTotal */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <div className="rounded-2xl p-5 h-full" style={{ background: '#0A1828', border: `1px solid ${vt.status === 'ok' ? 'rgba(0,255,136,0.15)' : vt.status === 'error' ? 'rgba(255,77,77,0.18)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {vt.status === 'ok' ? <Wifi className="w-4 h-4" style={{ color: '#00FF88' }} /> : vt.status === 'error' ? <WifiOff className="w-4 h-4" style={{ color: '#FF4D4D' }} /> : <Globe className="w-4 h-4 text-accent" />}
                  <span className="font-semibold text-white" style={{ fontSize: '13px' }}>VirusTotal API</span>
                </div>
                <StatusBadge status={vt.status} />
              </div>

              <div className="space-y-1.5 mb-4">
                <EnvRow label="API Key" value={VT_API_KEY ? `Loaded (${VT_API_KEY.length} chars)` : 'NOT SET'} ok={!!VT_API_KEY} />
                <EnvRow label="HTTP Status" value={vt.httpStatus ? String(vt.httpStatus) : '—'} ok={(vt.httpStatus ?? 0) >= 200 && (vt.httpStatus ?? 0) < 300} />
                <EnvRow label="Test URL" value="https://google.com" ok={true} />
                {vt.testedAt && <EnvRow label="Tested At" value={vt.testedAt} ok={true} />}
              </div>

              {vt.lastError && (
                <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.15)' }}>
                  <div className="data-mono mb-1" style={{ fontSize: '9px', color: '#5a6a88' }}>LAST ERROR</div>
                  <p className="text-xs break-all" style={{ color: '#FF6B6B' }}>{vt.lastError}</p>
                </div>
              )}

              <RawResponseBlock label="SHOW RAW RESPONSE" content={vt.lastResponse} defaultOpen={vt.status === 'error'} />

              <button
                onClick={testVt}
                disabled={vt.status === 'testing'}
                className="mt-4 btn-primary w-full justify-center py-2.5 text-xs disabled:opacity-40"
              >
                {vt.status === 'testing' ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Test VirusTotal</>
                )}
              </button>
            </div>
          </motion.div>

          {/* OCR */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <div className="rounded-2xl p-5 h-full" style={{ background: '#0A1828', border: `1px solid ${ocr.status === 'ok' ? 'rgba(0,255,136,0.15)' : ocr.status === 'error' ? 'rgba(255,77,77,0.18)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {ocr.status === 'ok' ? <Wifi className="w-4 h-4" style={{ color: '#00FF88' }} /> : ocr.status === 'error' ? <WifiOff className="w-4 h-4" style={{ color: '#FF4D4D' }} /> : <FileText className="w-4 h-4 text-accent" />}
                  <span className="font-semibold text-white" style={{ fontSize: '13px' }}>OCR.Space API</span>
                </div>
                <StatusBadge status={ocr.status} />
              </div>

              <div className="space-y-1.5 mb-4">
                <EnvRow label="API Key" value={OCR_API_KEY ? `Loaded (${OCR_API_KEY.length} chars)` : 'NOT SET'} ok={!!OCR_API_KEY} />
                <EnvRow label="HTTP Status" value={ocr.httpStatus ? String(ocr.httpStatus) : '—'} ok={(ocr.httpStatus ?? 0) >= 200 && (ocr.httpStatus ?? 0) < 300} />
                <EnvRow label="Test Image" value="1×1 PNG (connectivity check)" ok={true} />
                {ocr.testedAt && <EnvRow label="Tested At" value={ocr.testedAt} ok={true} />}
              </div>

              {ocr.lastError && (
                <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.15)' }}>
                  <div className="data-mono mb-1" style={{ fontSize: '9px', color: '#5a6a88' }}>LAST ERROR</div>
                  <p className="text-xs break-all" style={{ color: '#FF6B6B' }}>{ocr.lastError}</p>
                </div>
              )}

              <RawResponseBlock label="SHOW RAW RESPONSE" content={ocr.lastResponse} defaultOpen={ocr.status === 'error'} />

              <button
                onClick={testOcr}
                disabled={ocr.status === 'testing'}
                className="mt-4 btn-primary w-full justify-center py-2.5 text-xs disabled:opacity-40"
              >
                {ocr.status === 'testing' ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Test OCR</>
                )}
              </button>
            </div>
          </motion.div>

          {/* Hive AI */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <div className="rounded-2xl p-5 h-full" style={{ background: '#0A1828', border: `1px solid ${hive.status === 'ok' ? 'rgba(0,255,136,0.15)' : hive.status === 'error' ? 'rgba(255,77,77,0.18)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {hive.status === 'ok' ? <Wifi className="w-4 h-4" style={{ color: '#00FF88' }} /> : hive.status === 'error' ? <WifiOff className="w-4 h-4" style={{ color: '#FF4D4D' }} /> : <Cpu className="w-4 h-4 text-accent" />}
                  <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Hive AI Deepfake</span>
                </div>
                <StatusBadge status={hive.status} />
              </div>

              <div className="space-y-1.5 mb-4">
                <EnvRow label="API Key" value="Server-side secret (HIVE_SECRET_KEY)" ok={true} />
                <EnvRow label="HTTP Status" value={hive.httpStatus ? String(hive.httpStatus) : '—'} ok={(hive.httpStatus ?? 0) >= 200 && (hive.httpStatus ?? 0) < 300} />
                <EnvRow label="Model" value="ai-generated-and-deepfake-content-detection" ok={true} />
                {hive.testedAt && <EnvRow label="Tested At" value={hive.testedAt} ok={true} />}
              </div>

              {hive.lastError && (
                <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.15)' }}>
                  <div className="data-mono mb-1" style={{ fontSize: '9px', color: '#5a6a88' }}>LAST ERROR</div>
                  <p className="text-xs break-all" style={{ color: '#FF6B6B' }}>{hive.lastError}</p>
                </div>
              )}

              <RawResponseBlock label="SHOW RAW RESPONSE" content={hive.lastResponse} defaultOpen={hive.status === 'error'} />

              <button
                onClick={testHive}
                disabled={hive.status === 'testing'}
                className="mt-4 btn-primary w-full justify-center py-2.5 text-xs disabled:opacity-40"
              >
                {hive.status === 'testing' ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Test Hive</>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Summary row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <div className="rounded-2xl p-5" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-accent" />
              <span className="font-semibold text-white" style={{ fontSize: '13px' }}>All Services</span>
              <button
                onClick={() => { testVt(); testOcr(); testHive(); }}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.14)', color: '#00CC6A' }}
              >
                <RefreshCw className="w-3 h-3" />
                Re-test all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'VirusTotal', state: vt },
                { label: 'OCR.Space', state: ocr },
                { label: 'Hive AI', state: hive },
                { label: 'OpenRouter', state: { status: import.meta.env.VITE_OPENROUTER_API_KEY ? 'ok' : 'error' } as ServiceState },
              ].map(({ label, state }) => {
                const c = state.status === 'ok' ? '#00FF88' : state.status === 'error' ? '#FF4D4D' : state.status === 'testing' ? '#FFC857' : '#5a6a88';
                return (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: `${c}06`, border: `1px solid ${c}18` }}>
                    <div className="w-2 h-2 rounded-full mx-auto mb-2 animate-pulse" style={{ background: c }} />
                    <div className="text-white font-medium" style={{ fontSize: '12px' }}>{label}</div>
                    <div className="data-mono mt-0.5" style={{ fontSize: '10px', color: c }}>
                      {state.status === 'ok' ? 'Connected' : state.status === 'error' ? 'Disconnected' : state.status === 'testing' ? 'Testing...' : 'Unchecked'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Diagnostic notes */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,200,87,0.04)', border: '1px solid rgba(255,200,87,0.1)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#FFC857' }} />
              <div className="text-xs space-y-1" style={{ color: '#a8b3cf' }}>
                <p><span style={{ color: '#FFC857' }}>VirusTotal note:</span> First scan of an uncached URL takes ~16s (submit + wait). Known URLs like google.com return instantly from cache.</p>
                <p><span style={{ color: '#FFC857' }}>OCR note:</span> The test uses a 1×1 pixel image — "no text found" (exit code 0) is a successful connectivity response.</p>
                <p><span style={{ color: '#FFC857' }}>Hive AI note:</span> API key is stored server-side (HIVE_SECRET_KEY). The proxy returns key status without making a real API call on test.</p>
                <p><span style={{ color: '#FFC857' }}>Key bug fixed:</span> VT proxy was reading <code style={{ color: '#00FF88' }}>attrs.stats</code> — actual field is <code style={{ color: '#00FF88' }}>attrs.last_analysis_stats</code>. This caused all scans to return total=0 → UNKNOWN.</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
