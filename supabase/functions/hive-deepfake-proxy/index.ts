import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Hive AI Generated & Deepfake Content Detection Proxy
 * Model: hive/ai-generated-and-deepfake-content-detection
 * Endpoint: https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection
 *
 * PHASE 1: Clean proxy - passes raw Hive response through unchanged
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const HIVE_ENDPOINT = "https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection";

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
    const apiKey = Deno.env.get("HIVE_SECRET_KEY") ?? "";
    console.log(`[Hive Proxy] API key loaded: ${!!apiKey}`);

    if (!apiKey) {
      console.error("[Hive Proxy] HIVE_SECRET_KEY not configured");
      return respond(
        { error: "Hive API key not configured", code: "MISSING_KEY", success: false },
        500
      );
    }

    let body: { imageBase64?: string; mimeType?: string; test?: boolean };
    try {
      body = await req.json() as { imageBase64?: string; mimeType?: string; test?: boolean };
    } catch {
      return respond({ error: "Invalid JSON body", code: "INVALID_JSON", success: false }, 400);
    }

    // Connectivity test
    if (body.test) {
      return respond({
        test: true,
        api_key_loaded: true,
        endpoint: HIVE_ENDPOINT,
        message: "Hive proxy is configured",
        success: true,
      });
    }

    const { imageBase64, mimeType } = body;
    if (!imageBase64 || !mimeType) {
      return respond({ error: "Missing imageBase64 or mimeType", code: "MISSING_FIELDS", success: false }, 400);
    }

    console.log(`[Hive Proxy] Image received: ${mimeType}, ~${Math.round(imageBase64.length * 0.75 / 1024)}KB`);

    // Decode base64 to binary
    const byteString = atob(imageBase64);
    const ab = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) ab[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mimeType });

    const formData = new FormData();
    formData.append("media", blob, `image.${mimeType.split('/')[1] || 'jpg'}`);

    console.log(`[Hive Proxy] Sending to Hive API...`);

    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);

    let hiveResponse: Response;
    try {
      hiveResponse = await fetch(HIVE_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      const isAbort = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      console.error(`[Hive Proxy] ${isAbort ? "Timeout" : "Network error"}`);
      return respond(
        { error: isAbort ? "Hive API timeout" : String(fetchErr), code: isAbort ? "TIMEOUT" : "NETWORK", success: false },
        isAbort ? 504 : 502
      );
    } finally {
      clearTimeout(timer);
    }

    const responseTime = Date.now() - startTime;
    const rawText = await hiveResponse.text();
    console.log(`[Hive Proxy] Hive response: ${hiveResponse.status}, ${responseTime}ms`);

    if (!hiveResponse.ok) {
      let errMsg = `Hive API error HTTP ${hiveResponse.status}`;
      try {
        const errData = JSON.parse(rawText) as { error?: { message?: string }; message?: string };
        if (errData?.error?.message) errMsg = errData.error.message;
        else if (errData?.message) errMsg = errData.message;
      } catch { /* keep default */ }

      if (hiveResponse.status === 429) {
        errMsg = "Hive API rate limit exceeded";
      }

      console.error(`[Hive Proxy] Error: ${errMsg}`);
      return respond({ error: errMsg, code: "HIVE_ERROR", success: false }, 502);
    }

    // Parse and validate Hive response
    let hiveData: Record<string, unknown>;
    try {
      hiveData = JSON.parse(rawText);
    } catch {
      console.error("[Hive Proxy] Invalid JSON from Hive");
      return respond({ error: "Hive returned invalid JSON", code: "PARSE_ERROR", success: false }, 502);
    }

    // Validate Hive response structure
    const statusArray = hiveData.status as Array<Record<string, unknown>> | undefined;
    const firstStatus = statusArray?.[0];
    const statusMessage = (firstStatus?.status as Record<string, unknown>)?.message as string | undefined;

    console.log(`[Hive Proxy] Hive status: ${statusMessage}`);

    if (statusMessage && statusMessage !== "SUCCESS" && statusMessage !== "success") {
      return respond({ error: `Hive status: ${statusMessage}`, code: "HIVE_STATUS", success: false }, 502);
    }

    // Return raw Hive response unchanged
    console.log(`[Hive Proxy] Success - returning raw response`);
    return respond({
      success: true,
      response_time_ms: responseTime,
      raw_response: hiveData,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Hive Proxy] Unexpected error:", msg);
    return respond({ error: msg, code: "PROXY_ERROR", success: false }, 500);
  }
});
