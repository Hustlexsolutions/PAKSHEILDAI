import { Link } from 'react-router-dom';
import { Shield, Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Scam Detector', to: '/scan' },
      { label: 'Image Analyzer', to: '/image' },
      { label: 'Live Dashboard', to: '/dashboard' },
      { label: 'About', to: '/about' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About PakShield', to: '/about' },
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Service', to: '#' },
      { label: 'Contact', to: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Report a Scam', to: '/scan' },
      { label: 'FIA Cyber Crime', to: '#' },
      { label: 'Security Blog', to: '#' },
      { label: 'API Access', to: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="relative"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
              >
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <span className="font-sora font-bold text-[15px] text-white tracking-tight">
                Pak<span className="text-accent">Shield</span>
                <span className="text-text-muted font-normal ml-1 text-xs">AI</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed mb-6 max-w-[280px]" style={{ color: '#5a6a88' }}>
              Pakistan's most advanced AI-powered cybersecurity platform protecting citizens
              from scams, fraud, and deepfakes.
            </p>

            {/* System status */}
            <div
              className="inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-6"
              style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="data-mono text-accent" style={{ fontSize: '11px' }}>All Systems Operational</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <span className="data-mono text-text-muted" style={{ fontSize: '11px' }}>99.98% uptime</span>
            </div>

            {/* Socials */}
            <div className="flex gap-2">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#5a6a88',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#a8b3cf';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#5a6a88';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4
                className="font-semibold text-white mb-4"
                style={{ fontSize: '13px', letterSpacing: '-0.01em' }}
              >
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm transition-colors duration-150"
                      style={{ color: '#5a6a88' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#a8b3cf')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#5a6a88')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="data-mono" style={{ fontSize: '12px', color: '#3d4f6b' }}>
            &copy; {new Date().getFullYear()} PakShield AI. Built for Pakistan. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Security'].map((l) => (
              <a
                key={l}
                href="#"
                className="data-mono transition-colors duration-150"
                style={{ fontSize: '12px', color: '#3d4f6b' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#5a6a88')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3d4f6b')}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
