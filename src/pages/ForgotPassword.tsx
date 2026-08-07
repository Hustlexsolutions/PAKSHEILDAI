import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) { setError(error); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ paddingTop: 80 }}>
      <div
        className="fixed pointer-events-none"
        style={{
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(0,255,136,0.04) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#0A1828',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <div className="px-8 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
              >
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <span className="font-sora font-bold text-white" style={{ fontSize: '15px' }}>
                Pak<span className="text-accent">Shield</span> AI
              </span>
            </div>
            <h1 className="font-sora font-bold text-white mb-1" style={{ fontSize: '1.5rem', letterSpacing: '-0.025em' }}>
              Reset your password
            </h1>
            <p className="text-sm" style={{ color: '#5a6a88' }}>
              Enter your email and we'll send a reset link.
            </p>
          </div>

          {sent ? (
            <div className="px-8 py-8 text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
              >
                <CheckCircle className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-sora font-bold text-white mb-2" style={{ fontSize: '1.125rem' }}>
                Reset link sent
              </h2>
              <p className="text-sm mb-6" style={{ color: '#a8b3cf' }}>
                Check <strong className="text-white">{email}</strong> for a password reset link.
              </p>
              <Link to="/login" className="btn-secondary justify-center w-full py-3 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="px-8 py-6 space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-xl p-3.5"
                  style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}
                >
                  <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                  <p className="text-sm" style={{ color: '#FF6B6B' }}>{error}</p>
                </motion.div>
              )}

              <div>
                <label className="block font-medium text-white mb-1.5" style={{ fontSize: '13px' }}>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5a6a88' }} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder:text-text-muted outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="w-4 h-4" /> Send Reset Link</>
                )}
              </button>

              <Link to="/login" className="btn-secondary w-full justify-center py-3 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
