import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

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
    let body: { imageBase64?: string; mimeType?: string; api_key?: string; test?: boolean };
    try {
      body = await req.json() as { imageBase64?: string; mimeType?: string; api_key?: string; test?: boolean };
    } catch {
      return respond({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400);
    }

    const api_key = Deno.env.get("OCR_SPACE_API_KEY") || body.api_key || "";
    console.log(`[OCR Proxy] api_key loaded: ${!!api_key}, length=${api_key.length}`);

    if (!api_key) {
      return respond({ error: "OCR API key not configured (OCR_SPACE_API_KEY secret missing)", code: "MISSING_KEY" }, 500);
    }

    // ── Connectivity test ────────────────────────────────────────────────
    if (body.test) {
      // Use a minimal 1x1 white pixel PNG encoded as base64 to test connectivity
      const TEST_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==";
      const testMime = "image/png";

      const fd = new FormData();
      fd.append("base64Image", `data:${testMime};base64,${TEST_IMAGE}`);
      fd.append("apikey", api_key);
      fd.append("language", "eng");
      fd.append("OCREngine", "2");

      const testRes = await fetch(OCR_ENDPOINT, { method: "POST", body: fd });
      const testRaw = await testRes.text();
      console.log(`[OCR Proxy] Test result — status=${testRes.status}, body=${testRaw.slice(0, 300)}`);

      return respond({
        test: true,
        http_status: testRes.status,
        raw: testRaw,
        api_key_length: api_key.length,
        connected: testRes.ok,
      });
    }

    // ── Real OCR request ─────────────────────────────────────────────────
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return respond({ error: "Missing imageBase64 or mimeType", code: "MISSING_FIELDS" }, 400);
    }

    console.log(`[OCR Proxy] Received image — mimeType=${mimeType}, base64Length=${imageBase64.length}`);

    const formData = new FormData();
    formData.append("base64Image", `data:${mimeType};base64,${imageBase64}`);
    formData.append("apikey", api_key);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("isTable", "true");
    formData.append("OCREngine", "2");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    let ocrResponse: Response;
    try {
      ocrResponse = await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      const isAbort = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      return respond({ error: isAbort ? "OCR request timed out after 30s" : String(fetchErr), code: isAbort ? "TIMEOUT" : "NETWORK_ERROR" }, 504);
    } finally {
      clearTimeout(timer);
    }

    const rawText = await ocrResponse.text();
    console.log(`[OCR Proxy] OCR.Space responded — status=${ocrResponse.status}, body=${rawText.slice(0, 500)}`);

    if (!ocrResponse.ok) {
      return respond({ error: `OCR.Space HTTP ${ocrResponse.status}`, raw: rawText, code: "OCR_HTTP_ERROR", http_status: ocrResponse.status }, 502);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      return respond({ error: "OCR.Space returned non-JSON response", raw: rawText.slice(0, 300), code: "PARSE_ERROR" }, 502);
    }

    if ((data as { IsErroredOnProcessing?: boolean }).IsErroredOnProcessing) {
      const msgs = (data as { ErrorMessage?: string[] }).ErrorMessage ?? [];
      const msg = msgs.join("; ") || "OCR processing error (no details)";
      console.error("[OCR Proxy] IsErroredOnProcessing:", msg);
      return respond({ error: msg, code: "OCR_PROCESSING_ERROR", raw: data }, 502);
    }

    const parsedResults = (data as { ParsedResults?: Array<{ ParsedText?: string; TextOverlay?: unknown; FileParseExitCode?: number }> }).ParsedResults ?? [];

    if (parsedResults.length === 0) {
      return respond({ error: "No ParsedResults returned by OCR.Space", raw: data, code: "NO_RESULTS" }, 502);
    }

    const exitCode = parsedResults[0]?.FileParseExitCode ?? -1;
    // Exit code 1 = success, 0 = no text found, -1 = error
    if (exitCode !== 1 && exitCode !== 0) {
      return respond({ error: `OCR.Space parse failed (exit code ${exitCode})`, raw: data, code: "OCR_EXIT_ERROR" }, 502);
    }

    const text = parsedResults.map((r) => r.ParsedText ?? "").join("\n").trim();
    console.log(`[OCR Proxy] Extracted ${text.length} characters, exitCode=${exitCode}`);

    return respond({ text, success: true, exit_code: exitCode });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OCR Proxy] Unexpected error:", msg);
    return respond({ error: msg, code: "PROXY_ERROR" }, 500);
  }
});
