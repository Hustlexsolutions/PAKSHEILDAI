import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, LogOut, LayoutDashboard, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/scan', label: 'Scan' },
  { to: '/image', label: 'Image AI' },
  { to: '/url-scanner', label: 'URL Scanner' },
  { to: '/threat-map', label: 'Threat Map' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-center"
        style={{ paddingTop: 16 }}
      >
        <div
          className="w-full max-w-6xl mx-4 flex items-center h-14 px-4 rounded-2xl transition-all duration-300"
          style={{
            background: scrolled ? 'rgba(7,17,32,0.88)' : 'rgba(7,17,32,0.6)',
            backdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset' : 'none',
          }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mr-8 flex-shrink-0 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-accent-sm"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
            >
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <span className="font-sora font-bold text-[15px] text-white tracking-tight">
              Pak<span className="text-accent">Shield</span>
              <span className="text-text-muted font-normal ml-1 text-xs">AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {NAV.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium transition-colors duration-150"
                  style={{ color: active ? '#ffffff' : 'rgba(168,179,207,0.8)' }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
            {user && (
              <Link
                to="/dashboard"
                className="relative px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium transition-colors duration-150"
                style={{ color: location.pathname === '/dashboard' ? '#ffffff' : 'rgba(168,179,207,0.8)' }}
              >
                {location.pathname === '/dashboard' && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">Dashboard</span>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5">
              <span className="status-dot animate-pulse-slow" />
              <span className="data-mono text-accent" style={{ fontSize: '11px' }}>LIVE</span>
            </div>

            {loading ? null : user ? (
              /* Authenticated user menu */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-150"
                  style={{
                    background: userMenuOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center font-sora font-bold text-xs"
                    style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}
                  >
                    {userInitial}
                  </div>
                  <span className="text-xs font-medium text-white max-w-[120px] truncate">
                    {user.email}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden"
                      style={{
                        background: '#0A1828',
                        border: '1px solid rgba(255,255,255,0.09)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        zIndex: 100,
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-xs text-white font-medium truncate">{user.email}</div>
                        <div className="data-mono mt-0.5" style={{ fontSize: '10px', color: '#5a6a88' }}>Authenticated</div>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#a8b3cf' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/history"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#a8b3cf' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <History className="w-4 h-4" />
                          Scan History
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left transition-colors"
                          style={{ color: '#FF6B6B' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,77,77,0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Guest buttons */
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary py-2 px-4 text-xs">
                  Sign In
                </Link>
                <Link to="/scan" className="btn-primary py-2 px-5 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  Free Scan
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="ml-auto md:hidden p-2 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-20 z-40 mx-4 rounded-2xl p-4"
            style={{
              background: 'rgba(7,17,32,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex flex-col gap-1 mb-4">
              {NAV.map(({ to, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      color: active ? '#00FF88' : '#a8b3cf',
                      background: active ? 'rgba(0,255,136,0.07)' : 'transparent',
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
              {user && (
                <Link
                  to="/dashboard"
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    color: location.pathname === '/dashboard' ? '#00FF88' : '#a8b3cf',
                    background: location.pathname === '/dashboard' ? 'rgba(0,255,136,0.07)' : 'transparent',
                  }}
                >
                  Dashboard
                </Link>
              )}
              {user && (
                <Link
                  to="/history"
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    color: location.pathname === '/history' ? '#00FF88' : '#a8b3cf',
                    background: location.pathname === '/history' ? 'rgba(0,255,136,0.07)' : 'transparent',
                  }}
                >
                  Scan History
                </Link>
              )}
            </div>

            {user ? (
              <div className="space-y-2">
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#5a6a88' }}
                >
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary w-full justify-center text-sm"
                  style={{ color: '#FF6B6B', borderColor: 'rgba(255,77,77,0.2)' }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login" className="btn-secondary w-full justify-center text-sm">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary w-full justify-center text-sm">
                  <Shield className="w-4 h-4" />
                  Create Free Account
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
