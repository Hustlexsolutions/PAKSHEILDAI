import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, Target, Globe, Cpu, ArrowRight, Lightbulb, Award,
  Code2, Brain, BookOpen, ClipboardCheck, Image, Link2, Zap,
} from 'lucide-react';
import Footer from '../components/Footer';

const teamMembers = [
  {
    name: 'Samiullah Ashraf',
    role: 'Co-Founder & Lead Developer',
    description: 'BS Data Science · Superior University Lahore',
    bio: 'Artificial Intelligence, Cybersecurity, Scam Detection Systems, Deepfake Detection, and AI-powered digital protection.',
    icon: Code2,
    label: 'CO-FOUNDER',
    expertise: ['AI/ML', 'Cybersecurity', 'Backend'],
  },
  {
    name: 'Muazzam Ali',
    role: 'Co-Founder & AI Researcher',
    description: 'BS Data Science · Superior University Lahore',
    bio: 'Machine Learning, Data Science, Generative AI, and building intelligent systems that solve real-world problems.',
    icon: Brain,
    label: 'CO-FOUNDER',
    expertise: ['ML', 'Data Science', 'GenAI'],
  },
  {
    name: 'Aleena Aslam',
    role: 'Instructor & Academic Mentor',
    description: 'Generative AI Lecturer · Superior University Lahore',
    bio: 'Specialized in Artificial Intelligence, Generative AI, Emerging Technologies, and AI Education.',
    icon: BookOpen,
    label: 'INSTRUCTOR',
    expertise: ['GenAI', 'Education', 'Research'],
  },
  {
    name: 'Irfan Nagra',
    role: 'Quality Control Head',
    description: 'QCH · Superior University Lahore',
    bio: 'Overseeing system quality assurance, platform testing, accuracy benchmarking, and deployment standards.',
    icon: ClipboardCheck,
    label: 'QCH',
    expertise: ['QA', 'Testing', 'Standards'],
  },
];

const stats = [
  { icon: Cpu, label: 'AI Detection Engine', value: 'Hive AI', sub: 'Real-time deepfake & AI detection' },
  { icon: Image, label: 'Image Verification', value: '108+', sub: 'AI model classes detected' },
  { icon: Link2, label: 'URL Scanner', value: 'VirusTotal', sub: '70+ antivirus engines' },
  { icon: Zap, label: 'Threat Intelligence', value: '200+', sub: 'Fraud patterns monitored' },
];

const values = [
  { icon: Shield, title: 'Citizens First', desc: 'Every feature is built with one goal: protecting Pakistani citizens from digital threats.' },
  { icon: Cpu, title: 'Pakistan-Specific AI', desc: 'Trained on Urdu, Roman Urdu, and local fraud patterns across all major Pakistan platforms.' },
  { icon: Globe, title: 'Free for Everyone', desc: 'Enterprise-grade protection accessible to every Pakistani — no credit card, no signup required.' },
  { icon: Target, title: 'Always Improving', desc: 'Our threat database updates daily. New scam patterns are detected and countered within hours.' },
];

export default function About() {
  return (
    <div className="min-h-screen" style={{ paddingTop: 96 }}>

      {/* ─── TEAM HERO ─── */}
      <section className="relative py-20 overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,136,0.06) 0%, transparent 65%)' }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="section-label">The Team</span>
            </div>
            <h1
              className="font-sora font-bold text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1.05 }}
            >
              Meet The Team Behind{' '}
              <span className="text-accent">PakShield AI</span>
            </h1>
            <p className="text-base mx-auto" style={{ color: '#a8b3cf', lineHeight: 1.7, maxWidth: 560 }}>
              Building Pakistan's AI Scam Detection &amp; Digital Trust Platform
            </p>
          </motion.div>

          {/* Large Team Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex justify-center mb-16"
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                maxWidth: 680,
                width: '100%',
                boxShadow: '0 0 0 1px rgba(0,255,136,0.2), 0 0 60px rgba(0,255,136,0.12), 0 0 120px rgba(0,255,136,0.06)',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none z-10"
                style={{ borderTop: '2px solid #00FF88', borderLeft: '2px solid #00FF88', borderRadius: '12px 0 0 0' }} />
              <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none z-10"
                style={{ borderTop: '2px solid #00FF88', borderRight: '2px solid #00FF88', borderRadius: '0 12px 0 0' }} />
              <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none z-10"
                style={{ borderBottom: '2px solid #00FF88', borderLeft: '2px solid #00FF88', borderRadius: '0 0 0 12px' }} />
              <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none z-10"
                style={{ borderBottom: '2px solid #00FF88', borderRight: '2px solid #00FF88', borderRadius: '0 0 12px 0' }} />

              {/* Scanline overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background: 'linear-gradient(0deg, rgba(0,255,136,0.04) 0%, transparent 50%, rgba(0,255,136,0.04) 100%)',
                }}
              />

              <img
                src="/images/team/36c50fa3-5d22-40ea-9453-08d766c0b828.png"
                alt="PakShield AI Team — Samiullah Ashraf & Muazzam Ali"
                className="w-full block"
                style={{ background: '#071120' }}
              />

              {/* Name overlays */}
              <div
                className="absolute bottom-0 left-0 right-0 flex justify-between px-8 pb-6 pt-20 z-10"
                style={{ background: 'linear-gradient(to top, rgba(7,17,32,0.92) 0%, transparent 100%)' }}
              >
                <div>
                  <div className="data-mono font-bold mb-0.5" style={{ fontSize: '13px', color: '#00FF88', letterSpacing: '0.08em' }}>SAMIULLAH ASHRAF</div>
                  <div style={{ fontSize: '12px', color: '#a8b3cf' }}>Co-Founder &amp; Lead Developer</div>
                </div>
                <div className="text-right">
                  <div className="data-mono font-bold mb-0.5" style={{ fontSize: '13px', color: '#00FF88', letterSpacing: '0.08em' }}>MUAZZAM ALI</div>
                  <div style={{ fontSize: '12px', color: '#a8b3cf' }}>Co-Founder &amp; AI Researcher</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4 Team Member Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((member, i) => {
              const Icon = member.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group"
                >
                  <div
                    className="rounded-2xl p-5 h-full transition-all duration-300 cursor-default"
                    style={{
                      background: 'rgba(10,24,40,0.9)',
                      border: '1px solid rgba(0,255,136,0.1)',
                      backdropFilter: 'blur(12px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)';
                      e.currentTarget.style.boxShadow = '0 0 28px rgba(0,255,136,0.08), 0 8px 32px rgba(0,0,0,0.3)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,255,136,0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Label + icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="data-mono font-bold px-2 py-1 rounded-md"
                        style={{ fontSize: '9px', background: 'rgba(0,255,136,0.1)', color: '#00FF88', letterSpacing: '0.1em', border: '1px solid rgba(0,255,136,0.15)' }}
                      >
                        {member.label}
                      </span>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.12)' }}
                      >
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                    </div>

                    {/* Name & role */}
                    <h3
                      className="font-sora font-bold text-white mb-1"
                      style={{ fontSize: '14px', letterSpacing: '-0.01em', lineHeight: 1.3 }}
                    >
                      {member.name}
                    </h3>
                    <p className="text-accent font-medium mb-1" style={{ fontSize: '11px' }}>{member.role}</p>
                    <p className="data-mono mb-3" style={{ fontSize: '10px', color: '#5a6a88' }}>{member.description}</p>

                    {/* Bio */}
                    <p className="leading-relaxed mb-4" style={{ fontSize: '11px', color: '#6b7fa8', lineHeight: 1.6 }}>
                      {member.bio}
                    </p>

                    {/* Expertise tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {member.expertise.map((exp, j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 rounded-md data-mono"
                          style={{ fontSize: '9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#a8b3cf' }}
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── STATISTICS ─── */}
      <section
        className="py-16"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="section-label">Platform</span>
            </div>
            <h2 className="font-sora font-bold text-white" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}>
              What PakShield <span className="text-accent">Powers</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-5 text-center group card-interactive"
                  style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-200"
                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)' }}
                  >
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="font-sora font-bold text-accent mb-1" style={{ fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
                    {s.value}
                  </div>
                  <div className="font-semibold text-white mb-1" style={{ fontSize: '12px' }}>{s.label}</div>
                  <div style={{ fontSize: '11px', color: '#5a6a88' }}>{s.sub}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── MISSION ─── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="section-label">Our Mission</span>
            </div>
            <h2 className="display-md mb-8">
              Protecting <span className="text-accent">Pakistani citizens</span> from digital threats
            </h2>
            <div
              className="rounded-2xl p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.03), rgba(0,255,136,0.01))',
                border: '1px solid rgba(0,255,136,0.1)',
                borderLeft: '3px solid #00FF88',
              }}
            >
              <p className="text-base leading-relaxed mb-5" style={{ color: '#a8b3cf' }}>
                PakShield AI was created to help protect Pakistani citizens from online scams, fake payment proofs, phishing attacks, manipulated media, deepfakes, and emerging AI-powered fraud.
              </p>
              <p className="text-base leading-relaxed" style={{ color: '#a8b3cf' }}>
                Our goal is to use Artificial Intelligence to create a safer digital environment by providing accessible scam detection, transaction verification, and deepfake analysis tools for everyone.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="section-label">Our Principles</span>
            </div>
            <h2 className="display-md" style={{ maxWidth: 460 }}>
              Why we built <span className="text-accent">PakShield</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.09 }}
                  className="rounded-2xl p-6 card-interactive"
                  style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)' }}
                  >
                    <Icon style={{ width: 18, height: 18 }} className="text-accent" />
                  </div>
                  <h3 className="font-sora font-semibold text-white mb-2" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b7fa8' }}>{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── UNIVERSITY ─── */}
      <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="section-label">Education & Partnership</span>
            </div>
            <h2 className="display-md mb-8">
              Built at <span className="text-accent">Superior University Lahore</span>
            </h2>
            <div
              className="rounded-2xl p-8"
              style={{
                background: '#0A1828',
                border: '1px solid rgba(255,255,255,0.055)',
                borderLeft: '3px solid #00FF88',
              }}
            >
              <div className="flex items-start gap-4 mb-6">
                <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-base leading-relaxed" style={{ color: '#a8b3cf' }}>
                  This project was developed through the collaborative efforts of students and academic mentorship at Superior University Lahore, combining expertise in Data Science, Artificial Intelligence, Cybersecurity, and Generative AI.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'Specialization', value: 'Data Science & AI' },
                  { label: 'Focus', value: 'Cybersecurity & GenAI' },
                  { label: 'Institution', value: 'Superior University' },
                  { label: 'Location', value: 'Lahore, Pakistan' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="data-mono text-xs mb-1" style={{ color: '#5a6a88' }}>{item.label}</div>
                    <div className="font-semibold text-white text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
            >
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <h2 className="display-md mb-4">
              Join Pakistan's<br />
              <span className="text-accent">digital defense</span>
            </h2>
            <p className="text-base mb-8" style={{ color: '#a8b3cf', lineHeight: 1.7 }}>
              Together, we can make Pakistan's online space safer for everyone.
            </p>
            <Link to="/scan" className="btn-primary py-4 px-8 text-sm">
              <Shield className="w-4 h-4" />
              Scan a Threat Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
