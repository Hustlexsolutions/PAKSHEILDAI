import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import TrustSection from '../components/TrustSection';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

function CTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,255,136,0.04) 0%, transparent 60%)' }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="status-dot animate-pulse-slow" />
            <span className="data-mono text-accent" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>
              AVAILABLE NOW — FREE
            </span>
          </div>

          <h2
            className="font-sora font-bold text-white mb-6"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1.02 }}
          >
            Protect yourself before
            <br />
            the next scam finds you
          </h2>

          <p
            className="text-base mb-10 mx-auto"
            style={{ color: '#a8b3cf', lineHeight: 1.7, maxWidth: 480 }}
          >
            No signup required. Paste any suspicious message and get an instant AI-powered
            threat assessment in under 2 seconds.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/scan" className="btn-primary py-4 px-8 text-sm">
              <Shield className="w-4 h-4" />
              Analyze a Threat Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/image" className="btn-secondary py-4 px-8 text-sm">
              Check an Image
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <TrustSection />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}
