import { motion } from 'framer-motion';
import { Upload, Cpu, FileText, Shield } from 'lucide-react';

const steps = [
  {
    n: '01',
    icon: Upload,
    title: 'Input Content',
    desc: 'Paste suspicious text or upload an image — WhatsApp messages, SMS, emails, screenshots, job offers, or investment pitches.',
    color: '#00FF88',
  },
  {
    n: '02',
    icon: Cpu,
    title: 'AI Engine Scans',
    desc: 'Multi-model analysis across 200+ fraud signals, behavioral patterns, and Pakistan-specific threat databases in real time.',
    color: '#FFC857',
  },
  {
    n: '03',
    icon: FileText,
    title: 'Get Threat Report',
    desc: 'Receive a full risk assessment — score, threat class, detected scam type, confidence rating, and visual indicators.',
    color: '#00FF88',
  },
  {
    n: '04',
    icon: Shield,
    title: 'Take Action',
    desc: 'Follow AI-recommended actions: block, report to FIA Cyber Crime, or proceed safely with a verified clean signal.',
    color: '#00FF88',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-32">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="section-label">How It Works</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <h2 className="display-lg">
              Threat detection
              <br />
              in <span style={{ color: '#00FF88' }}>four steps</span>
            </h2>
            <p className="text-base" style={{ color: '#a8b3cf', lineHeight: 1.7, maxWidth: 360 }}>
              Enterprise-grade analysis made simple. No technical knowledge required —
              results in under two seconds.
            </p>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl p-6 card-interactive"
                style={{
                  background: '#0A1828',
                  border: '1px solid rgba(255,255,255,0.055)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
                }}
              >
                {/* Step number — large, muted */}
                <div
                  className="font-sora font-bold mb-6 select-none"
                  style={{
                    fontSize: '3.5rem',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    color: 'rgba(255,255,255,0.04)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {step.n}
                </div>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${step.color}10`,
                    border: `1px solid ${step.color}20`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: step.color }} />
                </div>

                <h3
                  className="font-sora font-semibold text-white mb-2.5"
                  style={{ fontSize: '0.9375rem', letterSpacing: '-0.01em' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7fa8' }}>
                  {step.desc}
                </p>

                {/* Bottom connector line (except last) */}
                {i < 3 && (
                  <div
                    className="hidden lg:block absolute top-16 -right-4 w-8 h-px"
                    style={{ background: 'linear-gradient(90deg, rgba(0,255,136,0.2), transparent)', zIndex: 10 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
