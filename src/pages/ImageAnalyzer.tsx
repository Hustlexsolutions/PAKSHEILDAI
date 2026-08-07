import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Image as ImageIcon, X, AlertTriangle, Info, Cpu, Fingerprint,
  ChevronDown, ChevronUp, Database, Scan, LogIn, CheckCircle, XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { analyzeWithHive, type HiveDetectionResult } from '../lib/hive';

export default function ImageAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<HiveDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    setResult(null);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file || !preview) return;
    setLoading(true);
    setResult(null);
    setStatus('Connecting to Hive AI...');

    try {
      const base64 = preview.split(',')[1];
      const mimeType = file.type;

      setStatus('Analyzing image...');
      const { result: hiveResult, error } = await analyzeWithHive(base64, mimeType);

      if (error) {
        toast(`Hive AI Error: ${error.message}`, 'error');
        setStatus('');
        setResult(null);
      } else {
        setResult(hiveResult);
        setStatus('');
        console.log('[ImageAnalyzer] Analysis complete');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toast(msg, 'error');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStatus('');
  };

  // Convert 0-1 value to percentage for display
  const toPercent = (val: number) => Math.round(val * 100);

  const scoreColor = (val: number, invert = false): string => {
    const pct = val * 100;
    if (invert) {
      if (pct < 20) return '#00FF88';
      if (pct < 40) return '#7dffaf';
      if (pct < 60) return '#FFC857';
      if (pct < 80) return '#FF8C42';
      return '#FF4D4D';
    }
    if (pct > 80) return '#00FF88';
    if (pct > 60) return '#7dffaf';
    if (pct > 40) return '#FFC857';
    if (pct > 20) return '#FF8C42';
    return '#FF4D4D';
  };

  return (
    <div className="min-h-screen" style={{ paddingTop: 96, paddingBottom: 48 }}>
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="section-label">Vision AI</span>
          </div>
          <h1
            className="font-sora font-bold text-white mb-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.035em', lineHeight: 1.05 }}
          >
            AI Image & Deepfake Detection
          </h1>
          <p className="text-base" style={{ color: '#a8b3cf', lineHeight: 1.7 }}>
            Upload any image to detect AI-generated content and deepfakes powered by Hive AI.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Upload / Preview */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            {!preview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) load(f); }}
                onClick={() => inputRef.current?.click()}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: drag ? 'rgba(0,255,136,0.04)' : '#0A1828',
                  border: drag ? '1px solid rgba(0,255,136,0.25)' : '1px dashed rgba(255,255,255,0.12)',
                  minHeight: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2.5rem',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-200"
                  style={{
                    background: drag ? 'rgba(0,255,136,0.12)' : 'rgba(0,255,136,0.07)',
                    border: '1px solid rgba(0,255,136,0.15)',
                  }}
                >
                  <Upload className="w-6 h-6 text-accent" style={{ opacity: drag ? 1 : 0.7 }} />
                </div>
                <h3 className="font-sora font-semibold text-white mb-2" style={{ fontSize: '15px' }}>
                  {drag ? 'Drop to analyze' : 'Upload Image'}
                </h3>
                <p className="text-sm text-center mb-5" style={{ color: '#5a6a88', maxWidth: 280 }}>
                  Drag and drop or click to browse. Upload any image for AI authenticity verification.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['JPG', 'PNG', 'WebP', 'GIF', 'Screenshots'].map((f) => (
                    <span
                      key={f}
                      className="px-2.5 py-1 rounded-lg data-mono"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '11px', color: '#5a6a88' }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 280 }} />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 p-2 rounded-xl"
                    style={{ background: 'rgba(7,17,32,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {loading && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ background: 'rgba(7,17,32,0.75)', backdropFilter: 'blur(4px)' }}
                    >
                      <div
                        className="w-12 h-12 rounded-full border-2 animate-spin mb-4"
                        style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }}
                      />
                      <div className="font-semibold text-accent" style={{ fontSize: '13px' }}>
                        {status || 'Analyzing...'}
                      </div>
                      <div className="data-mono mt-1" style={{ fontSize: '11px', color: '#5a6a88' }}>
                        Hive AI Detection
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-accent" />
                    <span className="text-sm text-white font-medium truncate">{file?.name}</span>
                  </div>
                  <button
                    onClick={analyze}
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3 disabled:opacity-40 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(7,17,32,0.3)', borderTopColor: '#071120' }} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        Analyze Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl flex flex-col items-center justify-center text-center p-10"
                  style={{
                    background: '#0A1828',
                    border: '1px solid rgba(255,255,255,0.055)',
                    minHeight: 320,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.12)' }}
                  >
                    <Scan className="w-6 h-6" style={{ color: 'rgba(0,255,136,0.4)' }} />
                  </div>
                  <h3 className="font-semibold text-white mb-2" style={{ fontSize: '14px' }}>Analysis Results</h3>
                  <p className="text-sm" style={{ color: '#5a6a88', maxWidth: 260 }}>
                    Upload an image to detect AI-generated content and deepfakes
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {/* Hive Status Card */}
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: '#0A1828',
                      border: `1px solid ${result.success ? 'rgba(0,255,136,0.15)' : 'rgba(255,77,77,0.15)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: result.success ? 'rgba(0,255,136,0.12)' : 'rgba(255,77,77,0.12)' }}
                        >
                          {result.success ? (
                            <CheckCircle className="w-5 h-5" style={{ color: '#00FF88' }} />
                          ) : (
                            <XCircle className="w-5 h-5" style={{ color: '#FF4D4D' }} />
                          )}
                        </div>
                        <div>
                          <div className="data-mono" style={{ fontSize: '10px', color: result.success ? '#00FF88' : '#FF4D4D', letterSpacing: '0.08em' }}>
                            HIVE AI
                          </div>
                          <div className="font-sora font-semibold text-white" style={{ fontSize: '14px' }}>
                            {result.success ? 'Analysis Complete' : 'Analysis Failed'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono" style={{ fontSize: '11px', color: '#5a6a88' }}>
                          {result.responseTimeMs}ms
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3" style={{ color: '#00FF88' }} />
                      <span className="data-mono" style={{ fontSize: '9px', color: '#00a85a' }}>
                        {result.model || 'hive/ai-generated-and-deepfake-content-detection'}
                      </span>
                    </div>
                  </div>

                  {/* Detection Metrics - RAW VALUES FROM HIVE */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Cpu className="w-4 h-4" style={{ color: '#00FF88' }} />
                      <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Detection Metrics</span>
                      <span className="data-mono ml-auto px-2 py-0.5 rounded" style={{ fontSize: '10px', background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                        HIVE RAW
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* AI Generated */}
                      <div className="rounded-lg p-3" style={{ background: 'rgba(255,77,77,0.03)', border: '1px solid rgba(255,77,77,0.1)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4" style={{ color: '#FF4D4D' }} />
                            <span className="text-white font-medium" style={{ fontSize: '13px' }}>AI Generated</span>
                          </div>
                          <span className="font-mono font-bold" style={{ fontSize: '18px', color: scoreColor(result.aiGeneratedValue, true) }}>
                            {toPercent(result.aiGeneratedValue)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: scoreColor(result.aiGeneratedValue, true) }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${toPercent(result.aiGeneratedValue)}%` }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>

                      {/* Deepfake */}
                      <div className="rounded-lg p-3" style={{ background: 'rgba(255,77,77,0.03)', border: '1px solid rgba(255,77,77,0.1)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Fingerprint className="w-4 h-4" style={{ color: '#FF4D4D' }} />
                            <span className="text-white font-medium" style={{ fontSize: '13px' }}>Deepfake</span>
                          </div>
                          <span className="font-mono font-bold" style={{ fontSize: '18px', color: scoreColor(result.deepfakeValue, true) }}>
                            {toPercent(result.deepfakeValue)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: scoreColor(result.deepfakeValue, true) }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${toPercent(result.deepfakeValue)}%` }}
                            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>

                      {/* Not AI Generated */}
                      <div className="rounded-lg p-3" style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} />
                            <span className="text-white font-medium" style={{ fontSize: '13px' }}>Not AI Generated</span>
                          </div>
                          <span className="font-mono font-bold" style={{ fontSize: '18px', color: scoreColor(result.notAiGeneratedValue, false) }}>
                            {toPercent(result.notAiGeneratedValue)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: scoreColor(result.notAiGeneratedValue, false) }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${toPercent(result.notAiGeneratedValue)}%` }}
                            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generator Attribution */}
                  {result.topGenerator && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Fingerprint className="w-3.5 h-3.5" style={{ color: '#a8b3cf' }} />
                        <span className="font-semibold text-white" style={{ fontSize: '12px' }}>Generator Attribution</span>
                      </div>

                      <div
                        className="rounded-lg p-3 mb-3"
                        style={{ background: result.topGenerator.value > 0.01 ? 'rgba(255,77,77,0.05)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,77,77,0.15)' }}
                      >
                        <div className="data-mono mb-1" style={{ fontSize: '9px', color: '#5a6a88' }}>TOP DETECTED GENERATOR</div>
                        <div className="text-sm font-medium" style={{ color: result.topGenerator.value > 0.01 ? '#FF6B6B' : '#a8b3cf' }}>
                          {result.topGenerator.displayName}
                          <span className="font-mono ml-2" style={{ color: '#a8b3cf', fontSize: '11px' }}>
                            ({toPercent(result.topGenerator.value)}%)
                          </span>
                        </div>
                      </div>

                      {/* Top Generators List */}
                      {result.topGenerators.length > 1 && (
                        <div className="space-y-1.5">
                          <div className="data-mono" style={{ fontSize: '9px', color: '#5a6a88' }}>ALL DETECTED GENERATORS</div>
                          {result.topGenerators.map((gen, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span style={{ color: '#a8b3cf', fontSize: '11px' }}>{gen.displayName}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${toPercent(gen.value)}%`, background: scoreColor(gen.value, true) }} />
                                </div>
                                <span className="font-mono font-bold" style={{ color: scoreColor(gen.value, true), fontSize: '10px', minWidth: 28, textAlign: 'right' }}>
                                  {toPercent(gen.value)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Debug Panel */}
                  <DebugPanel result={result} />

                  {/* Login prompt */}
                  {!user && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <LogIn className="w-4 h-4 flex-shrink-0" style={{ color: '#6b7fa8' }} />
                      <p className="text-sm" style={{ color: '#6b7fa8' }}>
                        <Link to="/signup" className="font-medium" style={{ color: '#a8b3cf' }}>Sign up free</Link>
                        {' '}to save scan history.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <div className="mt-24"><Footer /></div>
    </div>
  );
}

function DebugPanel({ result }: { result: HiveDetectionResult }) {
  const [open, setOpen] = useState(false);
  const rawJson = JSON.stringify(result.rawResponse, null, 2);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0A1828', border: '1px solid rgba(255,200,87,0.15)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: '#FFC857' }} />
          <span className="font-semibold text-white" style={{ fontSize: '13px' }}>Developer Debug Panel</span>
          <span className="data-mono px-2 py-0.5 rounded" style={{ fontSize: '10px', background: 'rgba(255,200,87,0.1)', color: '#FFC857' }}>
            RAW HIVE DATA
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="data-mono" style={{ fontSize: '9px', color: '#5a6a88' }}>RESPONSE TIME</div>
                  <div className="font-mono font-semibold text-white" style={{ fontSize: '12px' }}>{result.responseTimeMs}ms</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="data-mono" style={{ fontSize: '9px', color: '#5a6a88' }}>CLASSES</div>
                  <div className="font-mono font-semibold text-white" style={{ fontSize: '12px' }}>{result.allClasses.length}</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="data-mono" style={{ fontSize: '9px', color: '#5a6a88' }}>VERSION</div>
                  <div className="font-mono text-white" style={{ fontSize: '10px' }}>{result.version || 'N/A'}</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="data-mono" style={{ fontSize: '9px', color: '#5a6a88' }}>TASK ID</div>
                  <div className="font-mono text-white truncate" style={{ fontSize: '9px' }}>{result.taskId?.slice(0, 8) || 'N/A'}...</div>
                </div>
              </div>

              {/* Primary Values */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,200,87,0.05)' }}>
                <div className="data-mono mb-2" style={{ fontSize: '10px', color: '#FFC857' }}>RAW HIVE VALUES (NOT CALCULATED)</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="data-mono" style={{ fontSize: '10px', color: '#5a6a88' }}>ai_generated</div>
                    <div className="font-mono font-bold" style={{ fontSize: '14px', color: '#FF4D4D' }}>
                      {(result.aiGeneratedValue * 100).toFixed(4)}%
                    </div>
                  </div>
                  <div>
                    <div className="data-mono" style={{ fontSize: '10px', color: '#5a6a88' }}>deepfake</div>
                    <div className="font-mono font-bold" style={{ fontSize: '14px', color: '#FF4D4D' }}>
                      {(result.deepfakeValue * 100).toFixed(4)}%
                    </div>
                  </div>
                  <div>
                    <div className="data-mono" style={{ fontSize: '10px', color: '#5a6a88' }}>not_ai_generated</div>
                    <div className="font-mono font-bold" style={{ fontSize: '14px', color: '#00FF88' }}>
                      {(result.notAiGeneratedValue * 100).toFixed(4)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* All Classes */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="data-mono mb-2" style={{ fontSize: '10px', color: '#FFC857' }}>ALL HIVE CLASSES ({result.allClasses.length})</div>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {result.allClasses.map((cls, i) => (
                    <div key={i} className="flex justify-between">
                      <span style={{ color: '#a8b3cf', fontSize: '11px' }}>{cls.class}</span>
                      <span className="font-mono font-bold" style={{ color: cls.value > 0.3 ? '#FF4D4D' : cls.value > 0.1 ? '#FFC857' : '#a8b3cf', fontSize: '11px' }}>
                        {Math.round(cls.value * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <div className="rounded-lg p-3 overflow-auto max-h-64" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="data-mono mb-1" style={{ fontSize: '10px', color: '#5a6a88' }}>FULL RAW HIVE JSON</div>
                <pre className="font-mono text-xs" style={{ color: '#a8b3cf', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {rawJson}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
