import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Target, Users, CheckCircle } from 'lucide-react';

const stats = [
  { icon: Shield, val: '2.4M', suffix: '+', label: 'Scans Performed', num: 2400000 },
  { icon: Target, val: '99.2', suffix: '%', label: 'Detection Accuracy', num: 99.2 },
  { icon: Users, val: '18.4', suffix: 'K', label: 'Users Protected', num: 18400 },
  { icon: CheckCircle, val: '340', suffix: 'K+', label: 'Threats Detected', num: 340000 },
];

function AnimatedValue({ display, delay }: { display: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className="font-sora font-bold tabular-nums"
      style={{
        fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
        letterSpacing: '-0.04em',
        color: '#00FF88',
        lineHeight: 1,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
    >
      {display}
    </div>
  );
}

export default function TrustSection() {
  return (
    <section className="relative py-32">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />

      {/* Subtle section bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.015) 50%, transparent 100%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="section-label">By the Numbers</span>
          </div>
          <h2 className="display-lg max-w-xl">
            Pakistan's most trusted
            <br />
            <span style={{ color: '#00FF88' }}>AI security platform</span>
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="group relative rounded-2xl p-6 card-interactive overflow-hidden"
                style={{
                  background: '#0A1828',
                  border: '1px solid rgba(255,255,255,0.055)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
                }}
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 100% 0%, rgba(0,255,136,0.06) 0%, transparent 70%)',
                  }}
                />

                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)' }}
                >
                  <Icon className="w-4 h-4 text-accent" />
                </div>

                <AnimatedValue display={`${s.val}${s.suffix}`} delay={0.2 + i * 0.08} />

                <div className="mt-2 text-sm" style={{ color: '#5a6a88' }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Wide statement card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: 'rgba(0,255,136,0.03)',
            border: '1px solid rgba(0,255,136,0.1)',
            boxShadow: '0 1px 0 rgba(0,255,136,0.06) inset',
          }}
        >
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="status-dot" />
                <span className="data-mono text-accent" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                  REAL-TIME PROTECTION
                </span>
              </div>
              <p
                className="font-sora font-semibold leading-snug"
                style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)', letterSpacing: '-0.02em', color: '#ffffff' }}
              >
                Our AI detects new Pakistan-specific scam patterns within hours of them appearing online,
                keeping our database ahead of fraudsters.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Model Updates', val: 'Daily' },
                { label: 'Threat DB Size', val: '12M+ entries' },
                { label: 'Languages', val: 'Urdu + Roman Urdu' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-sm" style={{ color: '#6b7fa8' }}>{item.label}</span>
                  <span className="data-mono text-white font-medium" style={{ fontSize: '13px' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
