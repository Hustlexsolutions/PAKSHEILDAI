const VT_API_KEY = (import.meta.env.VITE_VIRUSTOTAL_API_KEY as string | undefined) ?? '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const VT_PROXY_URL = `${SUPABASE_URL}/functions/v1/virustotal-proxy`;

export type UrlThreatLevel = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';

export interface UrlScanResult {
  url: string;
  threat_level: UrlThreatLevel;
  malicious_count: number;
  suspicious_count: number;
  harmless_count: number;
  undetected_count: number;
  total_engines: number;
  detection_names: string[];
  categories: string[];
  final_url: string | null;
  risk_score: number;
  recommendation: string;
  error: string | null;
}

export interface VtDiagnostics {
  api_key_loaded: boolean;
  api_key_preview: string;
  proxy_url: string;
  connection_status: 'connected' | 'disconnected' | 'unchecked';
  last_error: string | null;
}

export function getVtDiagnostics(): VtDiagnostics {
  const loaded = !!VT_API_KEY && VT_API_KEY.length > 8;
  return {
    api_key_loaded: loaded,
    api_key_preview: loaded ? `${VT_API_KEY.slice(0, 6)}****${VT_API_KEY.slice(-4)}` : 'Not set',
    proxy_url: VT_PROXY_URL,
    connection_status: 'unchecked',
    last_error: loaded ? null : 'VITE_VIRUSTOTAL_API_KEY is not set in .env',
  };
}

function calcThreatLevel(malicious: number, suspicious: number, total: number): UrlThreatLevel {
  if (total === 0) return 'UNKNOWN';
  if (malicious >= 3) return 'MALICIOUS';
  if (malicious >= 1 || suspicious >= 3) return 'SUSPICIOUS';
  return 'SAFE';
}

function calcRiskScore(malicious: number, suspicious: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((malicious / total) * 80 + (suspicious / total) * 30));
}

function buildRecommendation(level: UrlThreatLevel, malicious: number, suspicious: number): string {
  if (level === 'MALICIOUS') return `This URL is flagged malicious by ${malicious} security engine${malicious !== 1 ? 's' : ''}. Do NOT visit or share this link. Report it to PTA/FIA Cyber Crime wing.`;
  if (level === 'SUSPICIOUS') return `This URL shows suspicious indicators (${suspicious} engine${suspicious !== 1 ? 's' : ''} flagged). Avoid clicking and verify through official channels before sharing.`;
  if (level === 'SAFE') return 'No malicious indicators detected across all security engines. Standard caution is still advised before entering personal information.';
  return 'VirusTotal scan was inconclusive. Treat unknown URLs with caution and verify through official channels.';
}

export async function scanUrl(url: string): Promise<UrlScanResult> {
  const base: UrlScanResult = {
    url,
    threat_level: 'UNKNOWN',
    malicious_count: 0, suspicious_count: 0, harmless_count: 0, undetected_count: 0,
    total_engines: 0, detection_names: [], categories: [], final_url: null,
    risk_score: 0, recommendation: '', error: null,
  };

  console.log(`[PakShield VirusTotal] API key loaded: ${!!VT_API_KEY}, length=${VT_API_KEY.length}`);
  console.log(`[PakShield VirusTotal] Proxy URL: ${VT_PROXY_URL}`);
  console.log(`[PakShield VirusTotal] Scanning: ${url}`);

  if (!VT_API_KEY) {
    const msg = 'VirusTotal API key not configured. Add VITE_VIRUSTOTAL_API_KEY to your .env file.';
    console.error('[PakShield VirusTotal Error]', msg);
    return { ...base, error: msg, recommendation: msg };
  }

  try {
    console.log('[PakShield VirusTotal] Sending request to proxy...');
    const response = await fetch(VT_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ url, api_key: VT_API_KEY }),
    });

    console.log(`[PakShield VirusTotal] Proxy response status: ${response.status}`);
    const rawText = await response.text();
    console.log(`[PakShield VirusTotal] Proxy response body: ${rawText.slice(0, 500)}`);

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      const msg = `Proxy returned non-JSON: ${rawText.slice(0, 200)}`;
      console.error('[PakShield VirusTotal Error]', msg);
      return { ...base, error: msg, recommendation: 'Scan service error. Please try again.' };
    }

    if (!response.ok) {
      const msg = (data.error as string) ?? `Proxy error HTTP ${response.status}`;
      const code = (data.code as string) ?? '';
      console.error(`[PakShield VirusTotal Error] ${msg} (code=${code})`);
      return { ...base, error: `${msg}${code ? ` [${code}]` : ''}`, recommendation: 'Scan failed. Check your API key and try again.' };
    }

    const stats = (data.stats as Record<string, number>) ?? {};
    const malicious = stats.malicious ?? 0;
    const suspicious = stats.suspicious ?? 0;
    const harmless = stats.harmless ?? 0;
    const undetected = stats.undetected ?? 0;
    const total = malicious + suspicious + harmless + undetected;

    const threat_level = calcThreatLevel(malicious, suspicious, total);
    const risk_score = calcRiskScore(malicious, suspicious, total);

    console.log(`[PakShield VirusTotal] Result — threat=${threat_level}, malicious=${malicious}, suspicious=${suspicious}, harmless=${harmless}, total=${total}`);

    return {
      url,
      threat_level,
      malicious_count: malicious,
      suspicious_count: suspicious,
      harmless_count: harmless,
      undetected_count: undetected,
      total_engines: total,
      detection_names: (data.detection_names as string[]) ?? [],
      categories: (data.categories as string[]) ?? [],
      final_url: (data.final_url as string) ?? null,
      risk_score,
      recommendation: buildRecommendation(threat_level, malicious, suspicious),
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[PakShield VirusTotal Error]', msg);
    return { ...base, error: msg, recommendation: 'Scan failed. Check your network connection and try again.' };
  }
}
