import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, AlertTriangle, CheckCircle, Activity, Zap } from 'lucide-react';

/* ─── Live dashboard preview ─────────────── */
const FEED_ITEMS = [
  { type: 'Investment Scam', source: 'WhatsApp', risk: 'CRIT', score: 96, t: '1s' },
  { type: 'Deepfake Image', source: 'OLX', risk: 'HIGH', score: 81, t: '4s' },
  { type: 'Phishing URL', source: 'Email', risk: 'HIGH', score: 78, t: '9s' },
  { type: 'EasyPaisa Fraud', source: 'SMS', risk: 'CRIT', score: 93, t: '14s' },
  { type: 'Fake Job Offer', source: 'LinkedIn', risk: 'HIGH', score: 74, t: '22s' },
];

const RISK_COLOR: Record<string, string> = {
  CRIT: '#FF4D4D',
  HIGH: '#FF8C42',
  MED: '#FFC857',
  SAFE: '#00FF88',
};

function AreaChart() {
  const points = [22, 45, 31, 68, 52, 83, 61, 74, 88, 65, 91, 76];
  const H = 52;
  const W = 100;
  const max = Math.max(...points);
  const coords = points.map((v, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - (v / max) * H,
  }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FF88" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)" />
      <motion.path
        d={line}
        fill="none"
        stroke="#00FF88"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 0.8, ease: 'easeInOut' }}
      />
    </svg>
  );
}

function DashboardPreview() {
  const [feedIndex, setFeedIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(FEED_ITEMS.slice(0, 4));

  useEffect(() => {
    const id = setInterval(() => {
      setFeedIndex((i) => {
        const next = (i + 1) % FEED_ITEMS.length;
        setVisibleItems((prev) => [FEED_ITEMS[next], ...prev.slice(0, 3)]);
        return next;
      });
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Ambient glow behind */}
      <div
        className="absolute -inset-8 rounded-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(0,255,136,0.06) 0%, transparent 70%)' }}
      />

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(7,17,32,0.95)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 2px 0 rgba(255,255,255,0.05) inset, 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.04)',
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span
              className="data-mono text-text-muted ml-2"
              style={{ fontSize: '11px' }}
            >
              pakshield.ai/monitor
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="status-dot animate-pulse" />
            <span className="data-mono text-accent" style={{ fontSize: '10px' }}>SCANNING</span>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-4 gap-px"
          style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {[
            { label: 'Scans Today', val: '12,847', up: true },
            { label: 'Blocked', val: '3,412', color: '#FF4D4D' },
            { label: 'Accuracy', val: '99.2%', color: '#00FF88' },
            { label: 'Avg Score', val: '1.2s', color: '#FFC857' },
          ].map((s, i) => (
            <div key={i} className="px-3.5 py-2.5" style={{ background: 'rgba(7,17,32,0.7)' }}>
              <div className="data-mono text-text-muted mb-0.5" style={{ fontSize: '10px' }}>{s.label}</div>
              <div
                className="font-sora font-bold tabular-nums"
                style={{ fontSize: '14px', color: s.color || '#ffffff', lineHeight: 1 }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-5">
          {/* Left: chart + summary */}
          <div className="col-span-3 p-4 space-y-3" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Chart header */}
            <div className="flex items-center justify-between">
              <span className="data-mono text-text-muted" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                THREAT ACTIVITY — 12H
              </span>
              <span className="data-mono text-accent" style={{ fontSize: '10px' }}>+18%</span>
            </div>

            <AreaChart />

            {/* Risk distribution */}
            <div className="space-y-1.5 pt-1">
              {[
                { label: 'Critical', pct: 18, color: '#FF4D4D' },
                { label: 'High', pct: 27, color: '#FF8C42' },
                { label: 'Safe', pct: 55, color: '#00FF88' },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="data-mono text-text-muted w-12" style={{ fontSize: '10px' }}>{r.label}</span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: r.color, width: `${r.pct}%` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${r.pct}%` }}
                      transition={{ duration: 1.2, delay: 1 + Math.random() * 0.3 }}
                    />
                  </div>
                  <span className="data-mono tabular-nums" style={{ fontSize: '10px', color: r.color, width: '28px', textAlign: 'right' }}>
                    {r.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live feed */}
          <div className="col-span-2 p-4">
            <div className="data-mono text-text-muted mb-3" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
              LIVE FEED
            </div>
            <div className="space-y-1.5">
              {visibleItems.map((item, i) => (
                <motion.div
                  key={`${item.type}-${item.t}-${i}`}
                  initial={i === 0 ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start justify-between rounded-lg px-2.5 py-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: RISK_COLOR[item.risk], boxShadow: `0 0 4px ${RISK_COLOR[item.risk]}` }}
                      />
                      <span className="text-white font-medium truncate" style={{ fontSize: '11px' }}>
                        {item.type}
                      </span>
                    </div>
                    <div className="data-mono text-text-muted" style={{ fontSize: '10px', paddingLeft: '12px' }}>
                      {item.source} · {item.t} ago
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 ml-2 flex-shrink-0">
                    <span
                      className="data-mono font-bold"
                      style={{ fontSize: '13px', color: RISK_COLOR[item.risk], lineHeight: 1 }}
                    >
                      {item.score}
                    </span>
                    <span
                      className="data-mono font-bold"
                      style={{ fontSize: '9px', color: RISK_COLOR[item.risk], letterSpacing: '0.06em' }}
                    >
                      {item.risk}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* AI scan indicator */}
            <div className="mt-3 rounded-lg px-2.5 py-2" style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="data-mono text-text-muted" style={{ fontSize: '10px' }}>AI ENGINE</span>
                <span className="data-mono text-accent" style={{ fontSize: '10px' }}>ACTIVE</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00FF88, #00CC6A)' }}
                  animate={{ width: ['5%', '95%', '5%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Hero ───────────────────────────────── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ paddingTop: 96, paddingBottom: 64 }}>
      {/* Radial ambient */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          left: '30%',
          width: 900,
          height: 700,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(0,255,136,0.045) 0%, transparent 65%)',
          transform: 'translateX(-50%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '0%',
          right: '-5%',
          width: 600,
          height: 600,
          background: 'radial-gradient(ellipse, rgba(77,168,255,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_1.08fr] gap-12 xl:gap-16 items-center">

          {/* Left */}
          <div className="max-w-xl">
            {/* Badge */}
            <motion.div {...fade(0)} className="mb-8">
              <span className="label-tag">
                <span className="status-dot animate-pulse-slow" />
                Pakistan's AI Security Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fade(0.08)} className="display-xl text-balance mb-6">
              The AI Shield
              <br />
              <span style={{ color: '#00FF88' }}>Pakistan</span>
              <br />
              Needed
            </motion.h1>

            {/* Sub */}
            <motion.p
              {...fade(0.16)}
              className="text-base leading-relaxed mb-10 max-w-md"
              style={{ color: '#a8b3cf' }}
            >
              Detect scam messages, phishing attempts, deepfakes, investment fraud, and
              AI-generated threats across WhatsApp, EasyPaisa, JazzCash, and OLX —
              in under two seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fade(0.24)} className="flex flex-wrap gap-3 mb-12">
              <Link to="/scan" className="btn-primary text-sm py-3.5 px-7">
                <Shield className="w-4 h-4" />
                Start Free Scan
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/dashboard" className="btn-secondary text-sm py-3.5 px-7">
                <Activity className="w-4 h-4" />
                Live Dashboard
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              {...fade(0.32)}
              className="flex gap-8 pt-8"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {[
                { val: '2.4M+', label: 'Threats Analyzed' },
                { val: '99.2%', label: 'Detection Rate' },
                { val: '<1.2s', label: 'Response Time' },
              ].map((s, i) => (
                <div key={i}>
                  <div
                    className="font-sora font-bold mb-0.5 tabular-nums"
                    style={{ fontSize: '1.375rem', letterSpacing: '-0.03em', color: '#ffffff' }}
                  >
                    {s.val}
                  </div>
                  <div className="text-xs" style={{ color: '#5a6a88' }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: dashboard */}
          <div className="hidden lg:block">
            <DashboardPreview />
          </div>
        </div>

        {/* Bottom trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-20 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex flex-wrap items-center gap-6 justify-center sm:justify-start">
            <span className="data-mono text-text-muted" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
              TRUSTED FOR
            </span>
            {[
              { icon: Zap, label: 'WhatsApp Scams' },
              { icon: Shield, label: 'EasyPaisa Fraud' },
              { icon: AlertTriangle, label: 'Investment Scams' },
              { icon: CheckCircle, label: 'Deepfake Detection' },
              { icon: Activity, label: 'OLX Fraud' },
            ].map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Icon className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs font-medium" style={{ color: '#6b7fa8' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #071120, transparent)' }}
      />
    </section>
  );
}
