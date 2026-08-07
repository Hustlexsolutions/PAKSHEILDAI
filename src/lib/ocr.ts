const OCR_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY as string;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Route through Supabase Edge Function to avoid CORS issues with OCR.Space
const OCR_PROXY_URL = `${SUPABASE_URL}/functions/v1/ocr-proxy`;

export interface OcrTransactionData {
  amount: string | null;
  date: string | null;
  time: string | null;
  account_name: string | null;
  account_number: string | null;
  transaction_id: string | null;
  reference_number: string | null;
  bank_name: string | null;
}

export interface OcrResult {
  extracted_text: string;
  transaction_data: OcrTransactionData;
  success: boolean;
  error: string | null;
}

const BANK_PATTERNS = [
  'easypaisa', 'easpaisa', 'jazzcash', 'jazz cash',
  'nayapay', 'naya pay', 'sadapay', 'sada pay',
  'meezan', 'hbl', 'ubl', 'mcb', 'allied bank',
  'askari', 'alfalah', 'bank alfalah', 'habib bank',
  'united bank', 'muslim commercial', 'national bank',
];

function detectBankName(text: string): string | null {
  const lower = text.toLowerCase();
  for (const bank of BANK_PATTERNS) {
    if (lower.includes(bank)) {
      return bank.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return null;
}

function extractTransactionData(text: string): OcrTransactionData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text;

  // Amount — Rs. / PKR / ₨
  const amountMatch = fullText.match(/(?:Rs\.?|PKR|₨)\s*([\d,]+(?:\.\d{1,2})?)/i)
    ?? fullText.match(/Amount[:\s]+(?:Rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : null;

  // Date — DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, "Jan 01, 2024"
  const dateMatch = fullText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/)
    ?? fullText.match(/\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/)
    ?? fullText.match(/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i);
  const date = dateMatch ? dateMatch[1] : null;

  // Time — HH:MM or HH:MM:SS AM/PM
  const timeMatch = fullText.match(/\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\b/i);
  const time = timeMatch ? timeMatch[1] : null;

  // Transaction ID / TXN ID
  const txnMatch = fullText.match(/(?:Transaction\s*(?:ID|No\.?|#)|TXN\s*(?:ID|#|No\.?)|Ref(?:erence)?\s*(?:No\.?|#)?)[:\s]+([A-Z0-9\-]{6,})/i);
  const transaction_id = txnMatch ? txnMatch[1] : null;

  // Reference number
  const refMatch = fullText.match(/(?:Ref(?:erence)?\s*(?:No\.?|#|Code)|Receipt\s*No\.?)[:\s]+([A-Z0-9\-]{4,})/i);
  const reference_number = refMatch ? refMatch[1] : null;

  // Account number
  const accNumMatch = fullText.match(/(?:Account\s*(?:No\.?|Number|#)|A\/C\s*(?:No\.?|#))[:\s]+([*X\d\-]{4,})/i)
    ?? fullText.match(/(?:03\d{2}[\s\-]?\d{7})/);
  const account_number = accNumMatch ? accNumMatch[1] : null;

  // Account / Sender name — look for "To:" or "From:" or "Sent to"
  let account_name: string | null = null;
  for (const line of lines) {
    const m = line.match(/(?:To|From|Sent to|Received from|Beneficiary)[:\s]+(.+)/i);
    if (m && m[1].length > 2 && m[1].length < 60) {
      account_name = m[1].trim();
      break;
    }
  }

  const bank_name = detectBankName(fullText);

  return { amount, date, time, account_name, account_number, transaction_id, reference_number, bank_name };
}

export async function extractTextFromImage(imageBase64: string, mimeType: string): Promise<OcrResult> {
  console.log('[PakShield OCR] Starting OCR extraction...');

  if (!OCR_API_KEY) {
    console.warn('[PakShield OCR] API key not configured — skipping OCR');
    return { extracted_text: '', transaction_data: emptyTx(), success: false, error: 'OCR API key not configured' };
  }

  try {
    const response = await fetch(OCR_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ imageBase64, mimeType, api_key: OCR_API_KEY }),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const msg = (data.error as string) ?? `OCR proxy error HTTP ${response.status}`;
      console.error('[PakShield OCR Error]', msg);
      return { extracted_text: '', transaction_data: emptyTx(), success: false, error: msg };
    }

    const text = String(data.text ?? '');
    console.log(`[PakShield OCR] Extracted ${text.length} characters`);

    const transaction_data = extractTransactionData(text);
    console.log('[PakShield OCR] Transaction data:', transaction_data);

    return { extracted_text: text, transaction_data, success: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[PakShield OCR Error]', msg);
    return { extracted_text: '', transaction_data: emptyTx(), success: false, error: msg };
  }
}

function emptyTx(): OcrTransactionData {
  return {
    amount: null, date: null, time: null,
    account_name: null, account_number: null,
    transaction_id: null, reference_number: null, bank_name: null,
  };
}
