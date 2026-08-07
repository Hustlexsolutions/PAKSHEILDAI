import { motion } from 'framer-motion';
import { ShieldAlert, ExternalLink, AlertTriangle } from 'lucide-react';

const FIA_URL = 'https://complaint.fia.gov.pk/';

interface FIAReportButtonProps {
  visible: boolean;
}

export default function FIAReportButton({ visible }: FIAReportButtonProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4 }}
    >
      {/* Warning box */}
      <div
        className="rounded-2xl p-4 mb-3 flex items-start gap-3"
        style={{
          background: 'rgba(255,77,77,0.05)',
          border: '1px solid rgba(255,77,77,0.2)',
        }}
      >
        <AlertTriangle
          className="w-4 h-4 flex-shrink-0 mt-0.5"
          style={{ color: '#FF4D4D' }}
        />
        <p className="text-sm leading-relaxed" style={{ color: '#a8b3cf' }}>
          <span className="font-semibold" style={{ color: '#FF6B6B' }}>
            PakShield has detected potential phishing, scam, or malicious activity.
          </span>{' '}
          If you believe you are a victim of cybercrime, report the incident to
          Pakistan's FIA Cyber Crime Wing.
        </p>
      </div>

      {/* Report button */}
      <a
        href={FIA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-center gap-3 w-full rounded-2xl py-4 px-6 font-semibold transition-all duration-200"
        style={{
          background: 'rgba(255,77,77,0.08)',
          border: '1px solid rgba(255,77,77,0.3)',
          color: '#FF4D4D',
          fontSize: '14px',
          letterSpacing: '-0.01em',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,77,77,0.14)';
          e.currentTarget.style.borderColor = 'rgba(255,77,77,0.5)';
          e.currentTarget.style.boxShadow = '0 0 28px rgba(255,77,77,0.12)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,77,77,0.08)';
          e.currentTarget.style.borderColor = 'rgba(255,77,77,0.3)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        Report to FIA Cyber Crime Wing
        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
      </a>
    </motion.div>
  );
}
