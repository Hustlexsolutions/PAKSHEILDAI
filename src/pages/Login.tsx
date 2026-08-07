import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error); return; }
    toast('Welcome back! Signed in successfully.', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ paddingTop: 80 }}>
      {/* Ambient glow */}
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
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#0A1828',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div
            className="px-8 py-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
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
            <h1
              className="font-sora font-bold text-white mb-1"
              style={{ fontSize: '1.5rem', letterSpacing: '-0.025em' }}
            >
              Sign in to your account
            </h1>
            <p className="text-sm" style={{ color: '#5a6a88' }}>
              Access your scan history and threat dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="px-8 py-6 space-y-4">
            {/* Error */}
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-1.5" style={{ fontSize: '13px' }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5a6a88' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder:text-text-muted outline-none transition-all duration-150 text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-white" style={{ fontSize: '13px' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: '#5a6a88' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00FF88')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#5a6a88')}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5a6a88' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-white placeholder:text-text-muted outline-none transition-all duration-150 text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#5a6a88' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#a8b3cf')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#5a6a88')}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <><Shield className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="px-8 py-4 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-sm" style={{ color: '#5a6a88' }}>
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium transition-colors"
                style={{ color: '#00FF88' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#00CC6A')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#00FF88')}
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
