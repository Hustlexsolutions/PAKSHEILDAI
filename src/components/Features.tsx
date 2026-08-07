import { motion } from 'framer-motion';
import {
  MessageSquare, Image, BarChart3, Smartphone, Banknote, CreditCard,
  ShoppingBag, TrendingUp, Mail, Radar,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Scam Detection',
    desc: 'Classify scam messages across 200+ fraud pattern types with 99%+ precision.',
    color: '#00FF88',
    tag: 'Core',
    large: true,
  },
  {
    icon: Image,
    title: 'Deepfake Analysis',
    desc: 'Detect AI-generated images, video manipulation, and synthetic media.',
    color: '#00FF88',
    tag: 'Vision AI',
    large: true,
  },
  {
    icon: BarChart3,
    title: 'Risk Scoring',
    desc: 'Real-time 0–100 risk scores with detailed threat breakdowns.',
    color: '#FFC857',
    tag: 'Analytics',
  },
  {
    icon: Smartphone,
    title: 'WhatsApp Scams',
    desc: 'Analyze forwarded messages for fraud and malicious links.',
    color: '#00FF88',
    tag: 'Messaging',
  },
  {
    icon: Banknote,
    title: 'EasyPaisa',
    desc: 'Detect fake payment screenshots and fraudulent transfer requests.',
    color: '#00FF88',
    tag: 'Fintech',
  },
  {
    icon: CreditCard,
    title: 'JazzCash',
    desc: 'Identify JazzCash phishing and OTP scam attempts.',
    color: '#00FF88',
    tag: 'Fintech',
  },
  {
    icon: ShoppingBag,
    title: 'OLX Fraud',
    desc: 'Spot OLX listing scams and advance payment schemes.',
    color: '#FFC857',
    tag: 'Commerce',
  },
  {
    icon: TrendingUp,
    title: 'Investment Fraud',
    desc: 'Unmask Ponzi schemes and fake crypto investment promises.',
    color: '#FF4D4D',
    tag: 'Finance',
  },
  {
    icon: Mail,
    title: 'Email Phishing',
    desc: 'Scan for phishing URLs, spoofed domains, and credential theft.',
    color: '#FFC857',
    tag: 'Email',
  },
  {
    icon: Radar,
    title: 'Real-Time Monitor',
    desc: 'Continuous AI scanning with instant threat classification.',
    color: '#00FF88',
    tag: 'Live',
    large: true,
  },
];

export default function Features() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(13,27,42,0.3) 50%, transparent 100%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="section-label">Detection Suite</span>
            <span className="section-label text-text-dim">—</span>
            <span className="section-label">10 AI Modules</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <h2 className="display-lg">
              Every threat vector,
              <br />
              <span style={{ color: '#00FF88' }}>fully covered</span>
            </h2>
            <p className="text-base" style={{ color: '#a8b3cf', lineHeight: 1.7, maxWidth: 380 }}>
              Purpose-built for Pakistan's digital landscape. Our models are trained on
              local fraud patterns across all major platforms.
            </p>
          </div>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isLarge = f.large;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative overflow-hidden rounded-2xl p-5 card-interactive ${
                  isLarge && i === 0 ? 'md:col-span-2' : ''
                } ${isLarge && i === 9 ? 'md:col-span-2' : ''}`}
                style={{
                  background: '#0A1828',
                  border: '1px solid rgba(255,255,255,0.055)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.35)',
                }}
              >
                {/* Hover gradient */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 0% 0%, ${f.color}07 0%, transparent 60%)`,
                  }}
                />

                {/* Top line accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.color}30, transparent)` }}
                />

                <div className="relative">
                  {/* Tag + Icon row */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `${f.color}10`,
                        border: `1px solid ${f.color}20`,
                      }}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color: f.color, width: 18, height: 18 }} />
                    </div>
                    <span
                      className="data-mono rounded-md px-2 py-0.5"
                      style={{
                        fontSize: '10px',
                        color: f.color,
                        background: `${f.color}0f`,
                        border: `1px solid ${f.color}18`,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {f.tag}
                    </span>
                  </div>

                  <h3
                    className="font-sora font-semibold text-white mb-2 leading-snug"
                    style={{ fontSize: '0.9375rem', letterSpacing: '-0.01em' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7fa8' }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
