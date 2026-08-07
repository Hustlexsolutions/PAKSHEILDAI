import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, Zap, Trash2, ChevronRight, Info, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import FIAReportButton from '../components/FIAReportButton';
import { saveScan } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { analyzeWithAI, type AIAnalysisResult } from '../lib/openrouter';

const SAMPLES = [
  `Congratulations! You have won Rs. 500,000 in lucky draw. Send Rs. 2000 processing fee to JazzCash 0300-1234567 to claim your prize today! Offer expires in 24 hours.`,
  `URGENT: Your EasyPaisa account will be blocked in 2 hours. Verify your CNIC and PIN immediately at: http://easypaisa-verify.com.pk to avoid suspension.`,
  `Investment opportunity — guaranteed 40% monthly returns. Only 10 slots remaining. WhatsApp +92300 for details. Trusted by 5,000 investors across Pakistan.`,
];

const LEVEL_CONFIG: Record<string, {
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
}> = {
  SAFE: { color: '#00FF88', icon: CheckCircle, label: 'SAFE' },
  LOW: { color: '#FFC857', icon: Info, label: 'LOW RISK' },
  MEDIUM: { color: '#FFC857', icon: AlertTriangle, label: 'MEDIUM' },
  HIGH: { color: '#FF8C42', icon: XCircle, label: 'HIGH RISK' },
  CRITICAL: { color: '#FF4D4D', icon: AlertTriangle, label: 'CRITICAL' },
};

export default function ScamDetector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setProgress(0);
    setSaved(false);
    setApiError(null);
    setModelStatus('');

    // Simulate progress while waiting for AI
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        return p + Math.floor(Math.random() * 12 + 4);
      });
    }, 300);

    try {
      const analysisResult = await analyzeWithAI(text, (status) => setModelStatus(status));
      clearInterval(progressTimer);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 120));
      setModelStatus('');
      setResult(analysisResult);

      if (user) {
        const saved = await saveScan({
          scan_type: 'text',
          content: text.slice(0, 500),
          risk_score: analysisResult.risk_score,
          classification: analysisResult.threat_level,
        });
        if (saved) {
          setSaved(true);
          toast('Scan saved to your history.', 'success');
        } else {
          toast('Could not save scan. Please try again.', 'error');
        }
      }
    } catch (err) {
      clearInterval(progressTimer);
      setModelStatus('');
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setApiError(msg);
      toast(msg, 'error');
    }

    setLoading(false);
  };

  const cfg = result ? (LEVEL_CONFIG[result.threat_level] ?? LEVEL_CONFIG.MEDIUM) : null;

  const trustScore = result ? Math.max(4, 100 - result.risk_score) : 0;

  return (
    <div className="min-h-screen" style={{ paddingTop: 96, paddingBottom: 48 }}>
      <div className="max-w-3xl mx-auto px-6">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="section-label">AI Detection</span>
            <span
              className="data-mono px-2 py-0.5 rounded"
              style={{ fontSize: '10px', color: '#00CC6A', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)' }}
            >
              Powered by OpenRouter AI
            </span>
          </div>
          <h1
            className="font-sora font-bold text-white mb-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.035em', lineHeight: 1.05 }}
          >
            Scam &amp; Threat Analyzer
          </h1>
          <p className="text-base" style={{ color: '#a8b3cf', lineHeight: 1.7 }}>
            Paste any suspicious message — WhatsApp, SMS, email, job offer, or investment pitch.
            Real AI analysis powered by LLaMA 3.1.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="rounded-2xl overflow-hidden mb-3"
          style={{
            background: '#0A1828',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="font-medium text-white" style={{ fontSize: '13px' }}>Threat Analysis Input</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="data-mono" style={{ fontSize: '11px', color: '#3d4f6b' }}>
                {text.length} chars
              </span>
              {text && (
                <button
                  onClick={() => { setText(''); setResult(null); setApiError(null); }}
                  className="p-1.5 rounded-lg transition-colors duration-150"
                  style={{ color: '#5a6a88' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#a8b3cf')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#5a6a88')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste suspicious WhatsApp messages, SMS, emails, job offers, investment schemes, banking messages, or any phishing content here..."
            className="w-full bg-transparent text-white placeholder:text-text-muted resize-none outline-none px-5 py-4"
            style={{ fontSize: '14px', lineHeight: 1.7, minHeight: 160 }}
          />

          <div
            className="flex flex-wrap items-center gap-2 px-5 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="data-mono" style={{ fontSize: '10px', color: '#3d4f6b', letterSpacing: '0.06em' }}>
              TRY SAMPLE:
            </span>
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => { setText(s); setResult(null); setApiError(null); }}
                className="px-2.5 py-1 rounded-lg transition-colors duration-150"
                style={{
                  background: 'rgba(0,255,136,0.05)',
                  border: '1px solid rgba(0,255,136,0.12)',
                  fontSize: '11px',
                  color: '#00CC6A',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.09)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.05)')}
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={run}
            disabled={!text.trim() || loading}
            className="btn-primary w-full justify-center py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontSize: '14px' }}
          >
            {loading ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(7,17,32,0.3)', borderTopColor: '#071120' }}
                />
                AI Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze with AI
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Progress */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="rounded-xl p-4" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between mb-2">
                    <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>
                      {modelStatus || 'LLaMA 3.1 AI Engine'}
                    </span>
                    <span className="data-mono text-accent" style={{ fontSize: '11px' }}>{Math.min(progress, 99)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #00FF88, #00CC6A)' }}
                      animate={{ width: `${Math.min(progress, 99)}%` }}
                      transition={{ duration: 0.35 }}
                    />
                  </div>
                  <div className="flex gap-4 mt-3">
                    {['Pattern matching', 'Context analysis', 'Fraud detection', 'Risk scoring'].map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: progress > i * 25 ? '#00FF88' : 'rgba(255,255,255,0.1)' }}
                        />
                        <span className="data-mono" style={{ fontSize: '10px', color: '#3d4f6b' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* API Error */}
          <AnimatePresence>
            {apiError && !loading && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-start gap-3 rounded-xl p-4"
                style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}
              >
                <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm" style={{ color: '#FF6B6B' }}>{apiError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && cfg && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-3"
            >
              {/* Verdict card */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: `${cfg.color}06`,
                  border: `1px solid ${cfg.color}20`,
                  boxShadow: `0 0 40px ${cfg.color}06`,
                }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}22` }}
                    >
                      <cfg.icon className="w-6 h-6" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div
                        className="data-mono font-bold mb-1"
                        style={{ fontSize: '11px', color: cfg.color, letterSpacing: '0.08em' }}
                      >
                        {cfg.label}
                      </div>
                      <div className="font-sora font-semibold text-white" style={{ fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
                        {result.classification}
                      </div>
                      <div className="text-sm mt-0.5" style={{ color: '#6b7fa8' }}>{result.scam_type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-sora font-bold tabular-nums"
                      style={{ fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1, color: cfg.color }}
                    >
                      {result.risk_score}
                    </div>
                    <div className="data-mono" style={{ fontSize: '10px', color: '#5a6a88', letterSpacing: '0.06em' }}>
                      RISK SCORE
                    </div>
                  </div>
                </div>

                {/* Risk bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>Risk Level</span>
                    <span className="data-mono" style={{ fontSize: '11px', color: cfg.color }}>{result.risk_score}/100</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: result.risk_score > 70
                          ? 'linear-gradient(90deg, #FF8C42, #FF4D4D)'
                          : result.risk_score > 44
                          ? 'linear-gradient(90deg, #00FF88, #FFC857)'
                          : '#00FF88',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${result.risk_score}%` }}
                      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                {/* Trust + Confidence */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="data-mono mb-1" style={{ fontSize: '10px', color: '#5a6a88', letterSpacing: '0.06em' }}>TRUST SCORE</div>
                    <div className="font-sora font-bold text-accent tabular-nums" style={{ fontSize: '1.5rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {trustScore}/100
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="data-mono mb-1" style={{ fontSize: '10px', color: '#5a6a88', letterSpacing: '0.06em' }}>SCAM TYPE</div>
                    <div className="font-sora font-bold text-white" style={{ fontSize: '0.85rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {result.scam_type}
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicators + Recs */}
              <div className="grid md:grid-cols-2 gap-3">
                <div
                  className="rounded-2xl p-5"
                  style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4" style={{ color: '#FFC857' }} />
                    <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Threat Indicators</span>
                  </div>
                  {result.reasons.length > 0 ? (
                    <ul className="space-y-2.5">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: '#FF4D4D' }} />
                          <span className="text-sm leading-relaxed" style={{ color: '#a8b3cf' }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm" style={{ color: '#5a6a88' }}>No significant indicators found.</p>
                  )}
                </div>

                <div
                  className="rounded-2xl p-5"
                  style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Recommendations</span>
                  </div>
                  {result.recommendations.length > 0 ? (
                    <ul className="space-y-2.5">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed" style={{ color: '#a8b3cf' }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm" style={{ color: '#5a6a88' }}>No recommendations available.</p>
                  )}
                </div>
              </div>

              {/* FIA Cyber Crime Report Button */}
              <FIAReportButton
                visible={result.threat_level === 'HIGH' || result.threat_level === 'CRITICAL'}
              />

              {/* Saved / login prompt */}
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}
                >
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                  <p className="text-sm" style={{ color: '#a8b3cf' }}>
                    Scan saved to your history.{' '}
                    <Link to="/dashboard" className="text-accent font-medium hover:underline">View dashboard</Link>
                    {' '}or{' '}
                    <Link to="/history" className="text-accent font-medium hover:underline">scan history</Link>
                  </p>
                </motion.div>
              )}
              {!user && result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <LogIn className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  <p className="text-sm" style={{ color: '#6b7fa8' }}>
                    <Link to="/signup" className="font-medium" style={{ color: '#a8b3cf' }}>Create a free account</Link>
                    {' '}to save your scan history and access the dashboard.
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
