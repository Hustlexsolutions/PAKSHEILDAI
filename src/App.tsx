import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import CyberBackground from './components/CyberBackground';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ScamDetector from './pages/ScamDetector';
import ImageAnalyzer from './pages/ImageAnalyzer';
import UrlScanner from './pages/UrlScanner';
import Diagnostics from './pages/Diagnostics';
import Dashboard from './pages/Dashboard';
import ScanHistory from './pages/ScanHistory';
import About from './pages/About';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ThreatMap from './pages/ThreatMap';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Redirect to /login if not authenticated */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/** Redirect authenticated users away from auth pages */
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }}
        />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="enter" exit="exit">
        <Routes location={location}>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<ScamDetector />} />
          <Route path="/image" element={<ImageAnalyzer />} />
          <Route path="/url-scanner" element={<UrlScanner />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/about" element={<About />} />
          <Route path="/threat-map" element={<ThreatMap />} />

          {/* Guest-only auth routes */}
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><SignUp /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><ScanHistory /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#071120', color: '#ffffff' }}>
            <CyberBackground />
            <CustomCursor />
            <Navbar />
            <main className="relative z-10">
              <AppRoutes />
            </main>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
