import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Ahmed Hassan',
    role: 'Small Business Owner',
    city: 'Lahore',
    initials: 'AH',
    text: 'PakShield flagged an investment scheme before I transferred Rs. 150,000. The risk score was 96/100. This tool paid for itself before I even needed to pay for it.',
    blocked: 'Investment Scam · Score 96',
    blockColor: '#FF4D4D',
  },
  {
    name: 'Fatima Malik',
    role: 'Secondary School Teacher',
    city: 'Karachi',
    initials: 'FM',
    text: 'My daughter received a fake job offer that looked completely legitimate — full company name, letterhead, everything. PakShield identified it as phishing in one second.',
    blocked: 'Fake Job Offer · Score 88',
    blockColor: '#FF8C42',
  },
  {
    name: 'Usman Raza',
    role: 'Freelance Developer',
    city: 'Islamabad',
    initials: 'UR',
    text: 'The deepfake detector is extraordinary. A "client" sent manipulated bank transfer screenshots. PakShield caught image tampering artifacts instantly.',
    blocked: 'Deepfake Image · Score 81',
    blockColor: '#FF4D4D',
  },
  {
    name: 'Sara Khan',
    role: 'Bank Compliance Officer',
    city: 'Rawalpindi',
    initials: 'SK',
    text: 'We integrated PakShield into our fraud team workflow. Detection accuracy improved our internal reviews by 40%. The Pakistan-specific threat models are unmatched.',
    blocked: 'Enterprise · API Integration',
    blockColor: '#00FF88',
  },
  {
    name: 'Bilal Akhtar',
    role: 'IT Systems Engineer',
    city: 'Faisalabad',
    initials: 'BA',
    text: 'Got an SMS claiming to be JazzCash about account suspension. Scanned it — 93% risk score, confirmed phishing. Blocked and reported within 30 seconds.',
    blocked: 'JazzCash Phishing · Score 93',
    blockColor: '#FF4D4D',
  },
  {
    name: 'Ayesha Siddiqui',
    role: 'University Student',
    city: 'Multan',
    initials: 'AS',
    text: 'Lost money to an OLX scam before finding PakShield. Now I scan every message before responding. This should be taught in every school in Pakistan.',
    blocked: 'OLX Fraud Prevention',
    blockColor: '#FFC857',
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
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
            <span className="section-label">User Stories</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <h2 className="display-lg">
              Real Pakistanis,
              <br />
              <span style={{ color: '#00FF88' }}>real protection</span>
            </h2>
            <p className="text-base" style={{ color: '#a8b3cf', lineHeight: 1.7, maxWidth: 380 }}>
              Thousands of citizens have avoided scams, fraud, and deepfakes using PakShield AI.
            </p>
          </div>
        </motion.div>

        {/* Masonry-ish grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="group relative rounded-2xl p-6 card-interactive overflow-hidden"
              style={{
                background: '#0A1828',
                border: '1px solid rgba(255,255,255,0.055)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
              }}
            >
              {/* Threat blocked badge */}
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mb-5"
                style={{
                  background: `${t.blockColor}0d`,
                  border: `1px solid ${t.blockColor}20`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: t.blockColor, boxShadow: `0 0 5px ${t.blockColor}` }}
                />
                <span className="data-mono" style={{ fontSize: '10px', color: t.blockColor, letterSpacing: '0.04em' }}>
                  {t.blocked}
                </span>
              </div>

              {/* Quote */}
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: '#a8b3cf', lineHeight: 1.7 }}
              >
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.12)' }}
                >
                  <span className="font-sora font-bold text-accent" style={{ fontSize: '11px' }}>{t.initials}</span>
                </div>
                <div>
                  <div className="font-medium text-white" style={{ fontSize: '13px' }}>{t.name}</div>
                  <div className="data-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>
                    {t.role} · {t.city}
                  </div>
                </div>
              </div>

              {/* Hover line */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${t.blockColor}30, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
