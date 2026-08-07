import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VT_BASE = "https://www.virustotal.com/api/v3";

/** Build the VirusTotal URL identifier (base64url of the URL, no padding) */
function urlToVtId(url: string): string {
  const encoded = new TextEncoder().encode(url);
  let binary = "";
  for (const byte of encoded) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

interface VtUrlReport {
  last_analysis_stats: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    timeout?: number;
  };
  last_analysis_results: Record<string, { category: string; engine_name?: string }>;
  categories: Record<string, string>;
  url?: string;
}

async function fetchUrlReport(vtId: string, apiKey: string): Promise<{ ok: boolean; attrs: VtUrlReport | null; status: number; raw: string }> {
  const res = await fetch(`${VT_BASE}/urls/${vtId}`, {
    headers: { "x-apikey": apiKey, "Accept": "application/json" },
  });
  const raw = await res.text();
  if (!res.ok) return { ok: false, attrs: null, status: res.status, raw };
  try {
    const data = JSON.parse(raw) as { data?: { attributes?: VtUrlReport } };
    const attrs = data?.data?.attributes ?? null;
    return { ok: true, attrs, status: res.status, raw };
  } catch {
    return { ok: false, attrs: null, status: res.status, raw };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    let body: { url?: string; api_key?: string };
    try {
      body = await req.json() as { url?: string; api_key?: string };
    } catch {
      return respond({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400);
    }

    const api_key = Deno.env.get("VIRUSTOTAL_API_KEY") || body.api_key || "";

    console.log(`[VT Proxy] api_key loaded: ${!!api_key}, length=${api_key.length}`);

    if (!api_key) {
      return respond({ error: "VirusTotal API key not configured (VIRUSTOTAL_API_KEY secret missing)", code: "MISSING_KEY" }, 500);
    }

    const targetUrl = body.url?.trim();
    if (!targetUrl) {
      return respond({ error: "Missing 'url' field in request body", code: "MISSING_URL" }, 400);
    }

    console.log(`[VT Proxy] Scanning: ${targetUrl}`);

    const vtId = urlToVtId(targetUrl);
    console.log(`[VT Proxy] VT URL ID: ${vtId}`);

    // ── Strategy: try cached lookup first, submit+retry if not found ──────
    let report = await fetchUrlReport(vtId, api_key);
    console.log(`[VT Proxy] Lookup attempt 1 — status=${report.status}`);

    if (!report.ok && report.status === 404) {
      // Not cached — submit URL for analysis
      console.log(`[VT Proxy] URL not cached, submitting...`);

      const submitForm = new URLSearchParams({ url: targetUrl });
      const submitRes = await fetch(`${VT_BASE}/urls`, {
        method: "POST",
        headers: {
          "x-apikey": api_key,
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: submitForm.toString(),
      });

      const submitRaw = await submitRes.text();
      console.log(`[VT Proxy] Submit response — status=${submitRes.status}, body=${submitRaw.slice(0, 300)}`);

      if (!submitRes.ok) {
        // Parse VT error details
        let errMsg = `VirusTotal submit error HTTP ${submitRes.status}`;
        try {
          const errData = JSON.parse(submitRaw) as { error?: { message?: string; code?: string } };
          if (errData?.error?.message) errMsg = errData.error.message;
        } catch { /* keep default */ }
        return respond({ error: errMsg, code: "VT_SUBMIT_ERROR", raw: submitRaw, http_status: submitRes.status }, 502);
      }

      // Wait for analysis to complete (progressive backoff)
      await new Promise((r) => setTimeout(r, 8000));
      report = await fetchUrlReport(vtId, api_key);
      console.log(`[VT Proxy] Lookup attempt 2 (post-submit) — status=${report.status}`);

      // One more retry if still not ready
      if (!report.ok || !report.attrs?.last_analysis_stats) {
        await new Promise((r) => setTimeout(r, 8000));
        report = await fetchUrlReport(vtId, api_key);
        console.log(`[VT Proxy] Lookup attempt 3 — status=${report.status}`);
      }
    } else if (!report.ok) {
      // Non-404 error (likely auth failure or quota)
      let errMsg = `VirusTotal API error HTTP ${report.status}`;
      try {
        const errData = JSON.parse(report.raw) as { error?: { message?: string; code?: string } };
        if (errData?.error?.message) errMsg = errData.error.message;
        if (errData?.error?.code) errMsg = `${errMsg} [${errData.error.code}]`;
      } catch { /* keep default */ }
      console.error(`[VT Proxy] Non-404 error: ${errMsg} | raw: ${report.raw.slice(0, 300)}`);
      return respond({ error: errMsg, code: "VT_API_ERROR", raw: report.raw, http_status: report.status }, 502);
    }

    // ── Parse result ────────────────────────────────────────────────────
    const attrs = report.attrs;
    if (!attrs) {
      return respond({ error: "Could not retrieve URL analysis from VirusTotal", code: "NO_ATTRS", raw: report.raw }, 502);
    }

    const stats = attrs.last_analysis_stats ?? { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
    const analysisResults = attrs.last_analysis_results ?? {};

    const detection_names: string[] = Object.entries(analysisResults)
      .filter(([, v]) => v.category === "malicious" || v.category === "suspicious")
      .map(([engine]) => engine)
      .slice(0, 15);

    const categories: string[] = [...new Set(Object.values(attrs.categories ?? {}))];

    console.log(`[VT Proxy] Stats: malicious=${stats.malicious}, suspicious=${stats.suspicious}, harmless=${stats.harmless}, undetected=${stats.undetected}`);

    return respond({
      stats: {
        malicious: stats.malicious ?? 0,
        suspicious: stats.suspicious ?? 0,
        harmless: stats.harmless ?? 0,
        undetected: stats.undetected ?? 0,
      },
      detection_names,
      categories,
      final_url: attrs.url ?? targetUrl,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[VT Proxy] Unexpected error:", msg);
    return respond({ error: msg, code: "PROXY_ERROR" }, 500);
  }
});
