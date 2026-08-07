const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Text analysis models
const MODELS = [
  'mistralai/mistral-7b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
  'google/gemma-2-9b-it',
  'qwen/qwen-2.5-7b-instruct',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2.5-7b-instruct:free',
];

const SYSTEM_PROMPT = `You are PakShield AI — Pakistan's most advanced scam and fraud detection system.

Analyze the submitted text for scams, fraud, and threats targeting Pakistani users.

PAKISTAN-SPECIFIC CONTEXT:
Banks: Meezan Bank, HBL, UBL, MCB, Allied Bank, Askari Bank, Bank Alfalah, National Bank of Pakistan, Silk Bank, Faysal Bank
Mobile Payments: EasyPaisa, JazzCash, SadaPay, NayaPay, UPaisa
Telecom: Jazz, Zong, Ufone, Telenor Pakistan, PTCL
Government: NADRA, PTA, FBR, SECP, SBP

Return ONLY valid JSON:
{
  "risk_score": 0,
  "threat_level": "",
  "classification": "",
  "scam_type": "",
  "reasons": [],
  "recommendations": []
}

threat_level: SAFE, LOW, MEDIUM, HIGH, CRITICAL
risk_score: 0-100
Return ONLY the JSON object, no markdown, no extra text.`;

export interface AIAnalysisResult {
  risk_score: number;
  threat_level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  classification: string;
  scam_type: string;
  reasons: string[];
  recommendations: string[];
}

export type ModelStatusCallback = (status: string) => void;

function sanitizeResult(raw: Partial<AIAnalysisResult>): AIAnalysisResult {
  const validLevels = ['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  const threat_level = validLevels.includes(raw.threat_level as typeof validLevels[number])
    ? (raw.threat_level as AIAnalysisResult['threat_level'])
    : 'MEDIUM';
  return {
    risk_score: Math.min(100, Math.max(0, Math.round(Number(raw.risk_score) || 0))),
    threat_level,
    classification: String(raw.classification || 'Unknown'),
    scam_type: String(raw.scam_type || 'Unknown'),
    reasons: Array.isArray(raw.reasons) ? raw.reasons.map(String).slice(0, 6) : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map(String).slice(0, 5) : [],
  };
}

function parseRetryAfter(headers: Headers, body: string): number {
  const header = headers.get('Retry-After') ?? headers.get('x-ratelimit-reset-after');
  if (header) {
    const secs = Number(header);
    if (!isNaN(secs) && secs > 0) return Math.min(secs, 30);
    const date = Date.parse(header);
    if (!isNaN(date)) return Math.min(Math.ceil((date - Date.now()) / 1000), 30);
  }
  try {
    const json = JSON.parse(body);
    const secs = json?.error?.metadata?.retry_after_seconds ?? json?.retry_after_seconds ?? json?.retry_after;
    if (typeof secs === 'number' && secs > 0) return Math.min(secs, 30);
  } catch { /* ignore */ }
  return 5;
}

async function callModel(model: string, text: string, onStatus: ModelStatusCallback): Promise<AIAnalysisResult> {
  onStatus(`Analyzing with ${model.split('/')[1]?.replace(':free', '') ?? model}...`);
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'PakShield AI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this text for scams:\n\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (response.status === 429) {
    const bodyText = await response.text().catch(() => '');
    const waitSecs = parseRetryAfter(response.headers, bodyText);
    const err = new Error(`rate_limited:${waitSecs}`) as Error & { isRateLimit: boolean; waitSecs: number };
    err.isRateLimit = true;
    err.waitSecs = waitSecs;
    throw err;
  }
  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${bodyText || response.statusText}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  const jsonStr = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  let parsed: Partial<AIAnalysisResult>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON response from model.');
    parsed = JSON.parse(match[0]);
  }
  return sanitizeResult(parsed);
}

export async function analyzeWithAI(text: string, onStatus: ModelStatusCallback = () => {}): Promise<AIAnalysisResult> {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    throw new Error('OpenRouter API key is not configured.');
  }
  let lastError: Error = new Error('All models unavailable.');
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    const isLast = i === MODELS.length - 1;
    try {
      return await callModel(model, text, onStatus);
    } catch (err) {
      const e = err as Error & { isRateLimit?: boolean; waitSecs?: number };
      lastError = e;
      if (e.isRateLimit) {
        if (!isLast) { onStatus('Trying alternative AI model...'); continue; }
        const waitSecs = e.waitSecs ?? 5;
        onStatus(`All models busy. Retrying in ${waitSecs}s...`);
        await new Promise((r) => setTimeout(r, waitSecs * 1000));
        try { return await callModel(model, text, onStatus); } catch (retryErr) { lastError = retryErr instanceof Error ? retryErr : new Error(String(retryErr)); }
      } else if (!isLast) { onStatus('Trying alternative AI model...'); }
    }
  }
  throw lastError;
}
