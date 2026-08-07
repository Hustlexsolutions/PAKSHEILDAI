import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useCallback, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin, AlertTriangle, Shield, Phone, Briefcase, TrendingUp, Globe,
  Clock, X, Send, Loader2, RefreshCw, Image, Link2,
  Search, CheckCircle, FileWarning, Crosshair, Layers, AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';

/* ─── Error Boundary ─── */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ThreatMapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('[ThreatMap] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ThreatMap] Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#071120', paddingTop: 96 }}>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(255,77,77,0.12)', border: '1px solid rgba(255,77,77,0.2)' }}>
              <AlertCircle className="w-8 h-8" style={{ color: '#FF4D4D' }} />
            </div>
            <h2 className="font-sora font-bold text-white mb-3" style={{ fontSize: '1.25rem' }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: '#6b7fa8', marginBottom: 24, lineHeight: 1.6 }}>
              The threat map encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-6 py-3"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Types ─── */
interface ThreatReport {
  id: string;
  created_at: string;
  location_name: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  threat_type: string;
  risk_level: 'low' | 'medium' | 'high';
  description: string;
  evidence_url: string | null;
  screenshot_url: string | null;
  status: string;
  report_source: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface FormState {
  threat_type: string;
  risk_level: 'low' | 'medium' | 'high';
  location_search: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  evidence_url: string;
}

/* ─── Constants ─── */
const THREAT_TYPES = [
  { value: 'Phishing', label: 'Phishing', icon: Globe },
  { value: 'Scam Call', label: 'Scam Call', icon: Phone },
  { value: 'Fake Job', label: 'Fake Job', icon: Briefcase },
  { value: 'Investment Scam', label: 'Investment Scam', icon: TrendingUp },
  { value: 'Deepfake', label: 'Deepfake', icon: Image },
  { value: 'Fake E-commerce', label: 'Fake E-commerce', icon: FileWarning },
  { value: 'Other', label: 'Other', icon: AlertTriangle },
];

const RISK_COLORS: Record<string, string> = {
  high: '#FF4D4D',
  medium: '#FFC857',
  low: '#00FF88',
};

const RISK_BG: Record<string, string> = {
  high: 'rgba(255,77,77,0.12)',
  medium: 'rgba(255,199,87,0.12)',
  low: 'rgba(0,255,136,0.12)',
};

const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451];

const BLANK_FORM: FormState = {
  threat_type: 'Phishing',
  risk_level: 'medium',
  location_search: '',
  location_name: '',
  latitude: null,
  longitude: null,
  description: '',
  evidence_url: '',
};

/* ─── Helpers ─── */
function createMarkerIcon(riskLevel: string) {
  const color = RISK_COLORS[riskLevel] || '#a8b3cf';
  try {
    return L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:24px;height:24px;">
          <div style="
            position:absolute;top:50%;left:50%;width:14px;height:14px;
            transform:translate(-50%,-50%);
            border-radius:50%;background:${color};
            border:2px solid rgba(255,255,255,0.8);
            box-shadow:0 0 12px ${color},0 0 24px ${color}55;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  } catch (err) {
    console.error('[MarkerIcon] Error creating icon:', err);
    return L.divIcon({ className: '', html: '<div></div>', iconSize: [0, 0] });
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
}

function formatRelativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  } catch {
    return 'Unknown';
  }
}

function computeStats(reports: ThreatReport[]) {
  const total = reports.length;
  const phishing = reports.filter((r) => r.threat_type === 'Phishing').length;
  const scamCalls = reports.filter((r) => r.threat_type === 'Scam Call').length;
  const deepfake = reports.filter((r) => r.threat_type === 'Deepfake').length;
  const highRisk = reports.filter((r) => r.risk_level === 'high').length;
  return { total, phishing, scamCalls, deepfake, highRisk };
}

function isValidReport(report: ThreatReport): boolean {
  return (
    typeof report.latitude === 'number' &&
    typeof report.longitude === 'number' &&
    !isNaN(report.latitude) &&
    !isNaN(report.longitude) &&
    isFinite(report.latitude) &&
    isFinite(report.longitude)
  );
}

/* ─── Map Controller Component ─── */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    try {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    } catch (err) {
      console.error('[MapController] Error setting view:', err);
    }
  }, [center, zoom, map]);
  return null;
}

/* ─── Location Search Component ─── */
interface LocationSearchProps {
  value: string;
  onChange: (val: string, data: { name: string; lat: number; lng: number } | null) => void;
  selectedLocation: { lat: number; lng: number } | null;
}

function LocationSearch({ value, onChange, selectedLocation }: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchNominatim = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      console.log('[Nominatim] Searching for:', query);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=pk`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = await res.json();
      console.log('[Nominatim] Results:', data.length);
      setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (err) {
      console.error('[Nominatim] Search error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val, null);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(val), 350);
  };

  const handleSelect = (result: NominatimResult) => {
    const name = result.display_name.split(',').slice(0, 2).join(', ');
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    console.log('[LocationSearch] Selected:', name, lat, lng);
    onChange(name, { name, lat, lng });
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange('', null);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5a6a88' }} />
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => value.length >= 3 && setShowDropdown(true)}
          placeholder="Search location... e.g. DHA Phase 6 Lahore"
          className="w-full rounded-xl pl-10 pr-10 py-3"
          style={{
            background: '#071120',
            border: selectedLocation ? '1px solid rgba(0,255,136,0.35)' : '1px solid rgba(255,255,255,0.09)',
            color: '#fff',
            fontSize: 13,
          }}
        />
        {value && (
          <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5" style={{ color: '#5a6a88' }} />
          </button>
        )}
      </div>

      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}
        >
          <MapPin className="w-3.5 h-3.5 text-accent" />
          <span style={{ fontSize: 11, color: '#00FF88' }}>Location selected</span>
          <span style={{ fontSize: 11, color: '#6b7fa8' }}>{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {showDropdown && (suggestions.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
            style={{ background: '#0D1F35', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
          >
            {loading && (
              <div className="p-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#00FF88' }} />
                <span style={{ fontSize: 12, color: '#6b7fa8' }}>Searching...</span>
              </div>
            )}
            {!loading &&
              suggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#00FF88' }} />
                  <div>
                    <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.4 }}>
                      {s.display_name.split(',').slice(0, 2).join(', ')}
                    </div>
                    <div style={{ fontSize: 10, color: '#5a6a88' }}>{s.type}</div>
                  </div>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─── */
function ThreatMapContent() {
  const [reports, setReports] = useState<ThreatReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(PAKISTAN_CENTER);
  const [mapZoom, setMapZoom] = useState(5);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setLoadError(null);
    try {
      console.log('[ThreatMap] Fetching reports...');
      const { data, error } = await supabase
        .from('threat_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ThreatMap] Fetch error:', error);
        setLoadError(error.message);
      } else {
        console.log('[ThreatMap] Fetched reports:', data?.length || 0);
        const validReports = (data || []).filter(isValidReport);
        setReports(validReports as ThreatReport[]);
      }
    } catch (err) {
      console.error('[ThreatMap] Unexpected error:', err);
      setLoadError('Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const stats = computeStats(reports);

  const handleLocationChange = useCallback(
    (val: string, data: { name: string; lat: number; lng: number } | null) => {
      setForm((f) => ({
        ...f,
        location_search: val,
        location_name: data?.name || '',
        latitude: data?.lat ?? null,
        longitude: data?.lng ?? null,
      }));
      if (data && !isNaN(data.lat) && !isNaN(data.lng)) {
        setMapCenter([data.lat, data.lng]);
        setMapZoom(14);
      }
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.latitude || !form.longitude) {
      setSubmitError('Please select a valid location from the search results.');
      return;
    }
    if (isNaN(form.latitude) || isNaN(form.longitude)) {
      setSubmitError('Invalid coordinates. Please select a location again.');
      return;
    }
    if (!form.description.trim()) {
      setSubmitError('Description is required.');
      return;
    }

    setSubmitting(true);
    console.log('[ThreatMap] Submitting report:', {
      threat_type: form.threat_type,
      risk_level: form.risk_level,
      location_name: form.location_name,
      latitude: form.latitude,
      longitude: form.longitude,
    });

    try {
      const insertPayload = {
        threat_type: form.threat_type,
        risk_level: form.risk_level,
        location_name: form.location_name || null,
        city: null,
        province: null,
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description.trim(),
        evidence_url: form.evidence_url.trim() || null,
        screenshot_url: null,
        report_source: 'user',
        status: 'pending',
      };

      console.log('[ThreatMap] Insert payload:', insertPayload);

      const { data, error } = await supabase.from('threat_reports').insert(insertPayload).select();

      if (error) {
        console.error('[ThreatMap] Insert error:', error);
        setSubmitError(error.message || 'Failed to submit report. Please try again.');
      } else {
        console.log('[ThreatMap] Insert successful:', data);
        setSubmitSuccess(true);
        setForm(BLANK_FORM);
        await fetchReports();
        setTimeout(() => {
          setSubmitSuccess(false);
          setModalOpen(false);
          setMapCenter(PAKISTAN_CENTER);
          setMapZoom(5);
        }, 1800);
      }
    } catch (err) {
      console.error('[ThreatMap] Unexpected submit error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setSubmitError(null);
    setSubmitSuccess(false);
    setForm(BLANK_FORM);
    setModalOpen(true);
  };

  const handleReportClick = (report: ThreatReport) => {
    if (isValidReport(report)) {
      setMapCenter([report.latitude, report.longitude]);
      setMapZoom(15);
    }
  };

  const validMarkers = reports.filter(isValidReport);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [modalOpen]);

  return (
    <div className="min-h-screen" style={{ paddingTop: 96, paddingBottom: 48 }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="section-label">Live Intelligence</span>
            </div>
            <h1
              className="font-sora font-bold text-white mb-2"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              Pakistan <span className="text-accent">Threat Map</span>
            </h1>
            <p style={{ fontSize: 14, color: '#a8b3cf', maxWidth: 480, lineHeight: 1.65 }}>
              Real-time cyber threat intelligence dashboard. View and report phishing, scams, and fraud incidents across Pakistan.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowHeatmap((v) => !v)}
              className="p-2.5 rounded-xl transition-colors flex items-center gap-2"
              style={{
                background: showHeatmap ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
                border: showHeatmap ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,255,255,0.08)',
                color: showHeatmap ? '#00FF88' : '#6b7fa8',
                fontSize: 12,
              }}
              title="Toggle heatmap view (future feature)"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Heatmap</span>
            </button>
            <button
              onClick={fetchReports}
              disabled={loadingReports}
              className="p-2.5 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7fa8' }}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingReports ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={openModal} className="btn-primary text-sm py-2.5 px-5">
              <PlusIcon className="w-4 h-4" />
              Report Threat
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6"
        >
          {[
            { icon: Shield, label: 'Total Reports', value: stats.total, color: '#00FF88' },
            { icon: Globe, label: 'Phishing', value: stats.phishing, color: '#FF4D4D' },
            { icon: Phone, label: 'Scam Calls', value: stats.scamCalls, color: '#FFC857' },
            { icon: Image, label: 'Deepfakes', value: stats.deepfake, color: '#8B5CF6' },
            { icon: AlertTriangle, label: 'High Risk', value: stats.highRisk, color: '#FF4D4D' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                className="rounded-2xl p-4 group"
                style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  </div>
                  <span className="data-mono" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.06em' }}>
                    {s.label.toUpperCase()}
                  </span>
                </div>
                <div className="font-sora font-bold text-white" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {loadingReports ? (
                    <span className="inline-block w-12 h-6 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  ) : (
                    s.value
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Load Error */}
        {loadError && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-2 mb-6" style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.18)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FF4D4D' }} />
            <span style={{ fontSize: 13, color: '#FF6B6B' }}>Error loading reports: {loadError}</span>
          </div>
        )}

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid lg:grid-cols-4 gap-4"
        >
          {/* Map */}
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden" style={{ height: 520 }}>
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                border: '1px solid rgba(0,255,136,0.12)',
                borderRadius: 16,
                boxShadow: '0 0 40px rgba(0,255,136,0.04)',
              }}
            />

            {/* Legend */}
            <div
              className="absolute top-4 right-4 z-[1000] rounded-xl p-3"
              style={{ background: 'rgba(7,17,32,0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
            >
              <div className="flex items-center gap-4">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <div key={lvl} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[lvl], boxShadow: `0 0 6px ${RISK_COLORS[lvl]}` }} />
                    <span style={{ fontSize: 10, color: '#a8b3cf', textTransform: 'capitalize' }}>{lvl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Report count */}
            <div
              className="absolute top-4 left-4 z-[1000] rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: 'rgba(7,17,32,0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: '#00FF88', boxShadow: '0 0 6px #00FF88', animation: 'pulse 2s infinite' }} />
              <span className="data-mono font-bold" style={{ fontSize: 11, color: '#00FF88' }}>
                {validMarkers.length} {validMarkers.length === 1 ? 'REPORT' : 'REPORTS'}
              </span>
            </div>

            <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
              <MapController center={mapCenter} zoom={mapZoom} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                maxZoom={19}
              />
              {validMarkers.map((report) => (
                <Marker key={report.id} position={[report.latitude, report.longitude]} icon={createMarkerIcon(report.risk_level)}>
                  <Popup>
                    <div style={{ background: '#0A1828', border: `1px solid ${RISK_COLORS[report.risk_level]}30`, borderRadius: 12, padding: '14px 16px', minWidth: 240, fontFamily: 'inherit' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span style={{ padding: '3px 10px', borderRadius: 6, background: RISK_BG[report.risk_level], border: `1px solid ${RISK_COLORS[report.risk_level]}30`, fontSize: 10, fontWeight: 700, color: RISK_COLORS[report.risk_level], letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {report.risk_level} risk
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, color: '#a8b3cf' }}>
                          {report.threat_type}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
                        {report.location_name || report.city || 'Unknown Location'}
                      </div>
                      {report.description && (
                        <div style={{ fontSize: 11, color: '#6b7fa8', marginBottom: 10, lineHeight: 1.5 }}>
                          {report.description.length > 150 ? report.description.slice(0, 150) + '...' : report.description}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#3d4f68', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                        <span>{formatDate(report.created_at)}</span>
                        <span style={{ marginLeft: 8 }}>|</span>
                        <span style={{ marginLeft: 8, textTransform: 'capitalize' }}>{report.status}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Empty state */}
            {!loadingReports && validMarkers.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none" style={{ background: 'rgba(7,17,32,0.8)', backdropFilter: 'blur(4px)' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.15)' }}>
                    <Crosshair className="w-9 h-9" style={{ color: '#00FF88', opacity: 0.5 }} />
                  </div>
                  <div className="font-sora font-semibold text-white mb-2" style={{ fontSize: 16 }}>No threat reports available yet</div>
                  <div style={{ fontSize: 13, color: '#5a6a88', maxWidth: 280, lineHeight: 1.6 }}>Be the first to report a cyber threat in your area.</div>
                </motion.div>
              </div>
            )}

            {/* Loading */}
            {loadingReports && (
              <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(7,17,32,0.7)', backdropFilter: 'blur(2px)' }}>
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }} />
              </div>
            )}
          </div>

          {/* Recent Reports Sidebar */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)', height: 520 }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#FFC857' }} />
                <span className="font-semibold text-white" style={{ fontSize: 13 }}>Recent Reports</span>
              </div>
              <span className="data-mono px-2 py-0.5 rounded" style={{ fontSize: 10, background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>{reports.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {reports.length === 0 && !loadingReports && (
                <div className="text-center py-8"><div style={{ fontSize: 12, color: '#5a6a88' }}>No reports yet</div></div>
              )}
              {reports.slice(0, 10).map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleReportClick(r)}
                  className="w-full text-left rounded-xl p-3 transition-all hover:bg-white/3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-white" style={{ fontSize: 12 }}>{r.threat_type}</span>
                    <span className="data-mono px-1.5 py-0.5 rounded" style={{ fontSize: 9, color: RISK_COLORS[r.risk_level], background: RISK_BG[r.risk_level] }}>
                      {r.risk_level.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7fa8', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.location_name || r.city || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 10, color: '#3d4f68' }}>{formatRelativeTime(r.created_at)}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Table */}
        {reports.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 rounded-2xl overflow-hidden" style={{ background: '#0A1828', border: '1px solid rgba(255,255,255,0.055)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: '#FFC857' }} />
                <span className="font-semibold text-white" style={{ fontSize: 13 }}>All Threat Reports</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {['Date', 'Location', 'Threat Type', 'Risk', 'Status'].map((h) => (
                      <th key={h} className="data-mono text-left px-5 py-3" style={{ fontSize: 10, color: '#5a6a88', fontWeight: 600, letterSpacing: '0.07em' }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.slice(0, 10).map((r, i) => (
                    <tr key={r.id} className="transition-colors hover:bg-white/2" style={{ borderBottom: i < Math.min(9, reports.length - 1) ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <td className="px-5 py-3"><span style={{ fontSize: 12, color: '#a8b3cf' }}>{formatDate(r.created_at)}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#5a6a88' }} />
                          <span style={{ fontSize: 12, color: '#fff' }}>{r.location_name || r.city || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3"><span style={{ fontSize: 12, color: '#a8b3cf' }}>{r.threat_type}</span></td>
                      <td className="px-5 py-3">
                        <span className="data-mono font-bold px-2 py-1 rounded-md" style={{ fontSize: 10, color: RISK_COLORS[r.risk_level], background: RISK_BG[r.risk_level], border: `1px solid ${RISK_COLORS[r.risk_level]}22` }}>
                          {r.risk_level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="data-mono px-2 py-1 rounded" style={{
                          fontSize: 10,
                          color: r.status === 'verified' ? '#00FF88' : r.status === 'resolved' ? '#6b7fa8' : '#FFC857',
                          background: r.status === 'verified' ? 'rgba(0,255,136,0.1)' : r.status === 'resolved' ? 'rgba(107,127,168,0.1)' : 'rgba(255,199,87,0.1)',
                        }}>
                          {r.status ? r.status.toUpperCase() : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="threat-modal-overlay fixed inset-0 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[850px] rounded-2xl overflow-hidden flex flex-col"
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(10,24,40,0.99) 0%, rgba(7,17,32,1) 100%)',
                border: '1px solid rgba(0,255,136,0.25)',
                boxShadow: '0 32px 100px rgba(0,0,0,0.8), 0 0 80px rgba(0,255,136,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
                maxHeight: '90vh',
              }}
            >
              {/* Sticky Header */}
              <div
                className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  position: 'sticky',
                  top: 0,
                  background: 'linear-gradient(135deg, rgba(10,24,40,1) 0%, rgba(7,17,32,1) 100%)',
                  zIndex: 10,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,77,77,0.12)', border: '1px solid rgba(255,77,77,0.25)' }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: '#FF4D4D' }} />
                  </div>
                  <div>
                    <div className="font-sora font-semibold text-white" style={{ fontSize: 16 }}>Submit Threat Report</div>
                    <div className="data-mono" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.05em' }}>PAKSHIELD THREAT INTELLIGENCE</div>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8" style={{ color: '#5a6a88' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <div className="overflow-y-auto flex-1 px-6 py-5" style={{ overscrollBehavior: 'contain' }}>
                  <div className="space-y-5">
                {/* Threat Type */}
                <div>
                  <label className="data-mono block mb-2" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.06em' }}>THREAT TYPE</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {THREAT_TYPES.map((t) => {
                      const Icon = t.icon;
                      const isSelected = form.threat_type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, threat_type: t.value }))}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                          style={{
                            background: isSelected ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.03)',
                            border: isSelected ? '1px solid rgba(0,255,136,0.25)' : '1px solid rgba(255,255,255,0.07)',
                            color: isSelected ? '#00FF88' : '#6b7fa8',
                            fontSize: 11,
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="font-medium">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="data-mono block mb-2" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.06em' }}>RISK LEVEL</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, risk_level: lvl }))}
                        className="py-3 rounded-xl font-semibold transition-all"
                        style={{
                          fontSize: 12,
                          textTransform: 'capitalize',
                          background: form.risk_level === lvl ? RISK_BG[lvl] : 'rgba(255,255,255,0.03)',
                          border: form.risk_level === lvl ? `1px solid ${RISK_COLORS[lvl]}40` : '1px solid rgba(255,255,255,0.07)',
                          color: form.risk_level === lvl ? RISK_COLORS[lvl] : '#5a6a88',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="data-mono block mb-2" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.06em' }}>LOCATION</label>
                  <LocationSearch value={form.location_search} onChange={handleLocationChange} selectedLocation={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null} />
                </div>

                {/* Description */}
                <div>
                  <label className="data-mono block mb-2" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.06em' }}>DESCRIPTION</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the threat in detail..."
                    rows={4}
                    className="w-full rounded-xl px-4 py-3 resize-none"
                    style={{ background: '#071120', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 13, lineHeight: 1.6 }}
                  />
                </div>

                {/* Evidence URL */}
                <div>
                  <label className="data-mono block mb-2 flex items-center gap-1.5" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.06em' }}>
                    <Link2 className="w-3 h-3" />
                    EVIDENCE URL (OPTIONAL)
                  </label>
                  <input
                    type="url"
                    value={form.evidence_url}
                    onChange={(e) => setForm((f) => ({ ...f, evidence_url: e.target.value }))}
                    placeholder="https://... (link to screenshot, website, or document)"
                    className="w-full rounded-xl px-4 py-3"
                    style={{ background: '#071120', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 13 }}
                  />
                </div>

                {/* Screenshot Upload - Future Ready */}
                <div>
                  <label className="data-mono block mb-2 flex items-center gap-1.5" style={{ fontSize: 10, color: '#5a6a88', letterSpacing: '0.06em' }}>
                    <Image className="w-3 h-3" />
                    SCREENSHOT UPLOAD (OPTIONAL)
                  </label>
                  <div
                    className="rounded-xl px-4 py-5 text-center cursor-not-allowed opacity-60"
                    style={{ background: '#071120', border: '1px dashed rgba(255,255,255,0.12)' }}
                  >
                    <Image className="w-6 h-6 mx-auto mb-2" style={{ color: '#3d4f68' }} />
                    <div style={{ fontSize: 12, color: '#5a6a88' }}>Screenshot upload coming soon</div>
                    <div style={{ fontSize: 10, color: '#3d4f68' }}>Use Evidence URL to share images</div>
                  </div>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.25)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FF4D4D' }} />
                    <span style={{ fontSize: 12, color: '#FF6B6B' }}>{submitError}</span>
                  </div>
                )}

                {/* Success */}
                {submitSuccess && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00FF88' }} />
                    <span style={{ fontSize: 12, color: '#00FF88' }}>Report submitted successfully! Thank you for protecting the community.</span>
                  </div>
                )}
                  </div>
                </div>

                {/* Sticky Footer - Inside Form */}
                <div
                  className="flex-shrink-0 px-6 py-4"
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: 'linear-gradient(135deg, rgba(10,24,40,1) 0%, rgba(7,17,32,1) 100%)',
                  }}
                >
                  <button
                    type="submit"
                    disabled={submitting || submitSuccess}
                    className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Report
                      </>
                    )}
                  </button>
                  <p className="text-center mt-3" style={{ fontSize: 10, color: '#5a6a88' }}>
                    Reports are publicly visible. Do not include personal information.
                  </p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-16"><Footer /></div>
    </div>
  );
}

/* ─── Export with Error Boundary ─── */
export default function ThreatMap() {
  return (
    <ThreatMapErrorBoundary>
      <ThreatMapContent />
    </ThreatMapErrorBoundary>
  );
}

/* Plus icon */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
