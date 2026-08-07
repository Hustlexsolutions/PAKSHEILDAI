import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.2)', icon: '#00FF88' },
  error: { bg: 'rgba(255,77,77,0.08)', border: 'rgba(255,77,77,0.2)', icon: '#FF4D4D' },
  info: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', icon: '#a8b3cf' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            const c = COLORS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3 rounded-xl px-4 py-3.5 pointer-events-auto"
                style={{
                  background: '#0A1828',
                  border: `1px solid ${c.border}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: c.bg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: c.icon }} />
                </div>
                <p className="text-sm flex-1 leading-relaxed" style={{ color: '#a8b3cf' }}>{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="p-1 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: '#3d4f6b' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#5a6a88')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#3d4f6b')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
