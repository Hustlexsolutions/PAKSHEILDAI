/**
 * Hive AI Generated & Deepfake Content Detection
 * Model: hive/ai-generated-and-deepfake-content-detection
 * Endpoint: https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection
 *
 * PHASE 1: Clean integration - NO custom calculations
 * All values come DIRECTLY from Hive API response
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const HIVE_PROXY_URL = `${SUPABASE_URL}/functions/v1/hive-deepfake-proxy`;

/** Raw class from Hive API - uses 'value' field */
export interface HiveClass {
  class: string;
  value: number;
}

/** Raw Hive API response structure (actual format from Hive) */
export interface HiveRawResponse {
  task_id?: string;
  model?: string;
  version?: string;
  output?: Array<{
    classes?: HiveClass[];
    extra?: Array<{ name: string; value: unknown }>;
  }>;
  [key: string]: unknown;
}

/** Clean Hive result - RAW VALUES ONLY, no calculations */
export interface HiveDetectionResult {
  success: boolean;
  error: string | null;
  responseTimeMs: number;

  // RAW VALUES FROM HIVE - NO MODIFICATIONS
  rawResponse: HiveRawResponse;
  allClasses: HiveClass[];
  taskId: string | null;
  model: string | null;
  version: string | null;

  // Primary detection classes (extracted, not calculated)
  aiGeneratedValue: number;      // 0-1 from Hive
  notAiGeneratedValue: number;    // 0-1 from Hive
  deepfakeValue: number;          // 0-1 from Hive

  // Generator attribution (top scoring generator class)
  topGenerator: {
    className: string;        // e.g. "flux", "midjourney", "4o"
    displayName: string;      // e.g. "Flux", "Midjourney", "GPT-4o"
    value: number;             // 0-1 from Hive
  } | null;

  // Top 5 generator classes for display
  topGenerators: Array<{
    className: string;
    displayName: string;
    value: number;
  }>;
}

/**
 * Friendly display names for common generators
 * Fallback to raw class name if not in map
 */
const GENERATOR_DISPLAY_NAMES: Record<string, string> = {
  'flux': 'Flux',
  'flux2': 'Flux 2',
  '4o': 'GPT-4o',
  'gptimage1_5': 'GPT Image 1.5',
  'gptimage2': 'GPT Image 2',
  'dalle': 'DALL-E',
  'midjourney': 'Midjourney',
  'stablediffusion': 'Stable Diffusion',
  'stablediffusionxl': 'Stable Diffusion XL',
  'sdxlinpaint': 'SDXL Inpaint',
  'stablediffusioninpaint': 'SD Inpaint',
  'stablecascade': 'Stable Cascade',
  'deepfloyd': 'DeepFloyd',
  'adobefirefly': 'Adobe Firefly',
  'ideogram': 'Ideogram',
  'imagen': 'Imagen',
  'imagen4': 'Imagen 4',
  'gemini': 'Gemini',
  'gemini3': 'Gemini 3',
  'grok': 'Grok',
  'grokimagine': 'Grok Imagine',
  'sora': 'Sora',
  'sora2': 'Sora 2',
  'pika': 'Pika',
  'runway': 'Runway',
  'kling': 'Kling',
  'luma': 'Luma',
  'haiper': 'Haiper',
  'hailuo': 'Hailuo',
  'recraft': 'Recraft',
  'leonardo': 'Leonardo',
  'krea': 'Krea',
  'bria': 'Bria',
  'janus': 'Janus',
  'cosmos': 'Cosmos',
  'omnigen': 'OmniGen',
  'emu3': 'Emu3',
  'sana': 'Sana',
  'wan': 'Wan',
  'veo3': 'Veo3',
  'infinity': 'Infinity',
  'titan': 'Titan',
  'pixart': 'PixArt',
  'glide': 'Glide',
  'dmd2': 'DMD2',
  'switti': 'Switti',
  'var': 'VAR',
  'liveportrait': 'LivePortrait',
  'hallo': 'Hallo',
  'hunyuan': 'Hunyuan',
  'mochi': 'Mochi',
  'hedra': 'Hedra',
  'luminagpt': 'LuminaGPT',
  'mcnet': 'MCNet',
  'cogvideos': 'CogVideo',
  'flashvideo': 'FlashVideo',
  'pyramidflows': 'PyramidFlows',
  'transpixar': 'TransPixar',
  'vqdiffusion': 'VQ Diffusion',
  'kandinsky': 'Kandinsky',
  'wuerstchen': 'Wuerstchen',
  'amused': 'aMUSEd',
  'bingimagecreator': 'Bing Image Creator',
  'lcm': 'LCM',
  'gan': 'GAN',
  'other_image_generators': 'Other AI Generator',
};

/** Classes that are NOT generators */
const NON_GENERATOR_CLASSES = new Set([
  'ai_generated',
  'not_ai_generated',
  'deepfake',
  'inconclusive',
  'inconclusive_video',
  'none',
  'not_ai_generated_audio',
  'ai_generated_audio',
]);

/**
 * Get display name for a class
 */
function getDisplayName(className: string): string {
  return GENERATOR_DISPLAY_NAMES[className] || className;
}

/**
 * Analyze an image with Hive AI
 * Returns RAW values from Hive - NO custom calculations
 */
export async function analyzeWithHive(
  imageBase64: string,
  mimeType: string,
): Promise<{ result: HiveDetectionResult | null; error: { message: string; code: string } | null }> {
  console.log('[Hive] Starting analysis...');
  console.log(`[Hive] Image: ${mimeType}, ${Math.round(imageBase64.length * 0.75 / 1024)}KB`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      result: null,
      error: { message: 'Supabase not configured', code: 'CONFIG_ERROR' }
    };
  }

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    let response: Response;
    try {
      response = await fetch(HIVE_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ imageBase64, mimeType }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const responseTimeMs = Math.round(performance.now() - startTime);
    const rawText = await response.text();
    console.log(`[Hive] Response: ${response.status}, ${responseTimeMs}ms`);

    let data: {
      success: boolean;
      response_time_ms: number;
      error?: string;
      code?: string;
      raw_response?: HiveRawResponse;
    };

    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        result: null,
        error: { message: 'Invalid JSON from Hive proxy', code: 'PARSE_ERROR' }
      };
    }

    if (!response.ok || !data.success) {
      const errorMsg = data.error || `HTTP ${response.status}`;
      const errorCode = data.code || 'API_ERROR';
      console.error(`[Hive] Error: ${errorMsg}`);
      return {
        result: null,
        error: { message: errorMsg, code: errorCode }
      };
    }

    const rawResponse = data.raw_response;
    if (!rawResponse) {
      return {
        result: null,
        error: { message: 'No raw response from Hive', code: 'NO_DATA' }
      };
    }

    // Parse ACTUAL Hive API structure
    // Hive returns: { task_id, model, version, output: [{ classes: [...] }] }
    const taskId = rawResponse.task_id ?? null;
    const model = rawResponse.model ?? null;
    const version = rawResponse.version ?? null;
    const outputArray = rawResponse.output;
    const classesArray = outputArray?.[0]?.classes || [];

    console.log(`[Hive] Task ID: ${taskId}`);
    console.log(`[Hive] Model: ${model}`);
    console.log(`[Hive] Version: ${version}`);
    console.log(`[Hive] Classes received: ${classesArray.length}`);

    // Log all classes with their values
    console.log('[Hive] === ALL CLASSES ===');
    for (const cls of classesArray) {
      console.log(`  ${cls.class}: ${(cls.value * 100).toFixed(4)}%`);
    }
    console.log('[Hive] === END CLASSES ===');

    // Extract primary detection values (RAW, not calculated)
    const aiGeneratedValue = classesArray.find(c => c.class === 'ai_generated')?.value ?? 0;
    const notAiGeneratedValue = classesArray.find(c => c.class === 'not_ai_generated')?.value ?? 0;
    const deepfakeValue = classesArray.find(c => c.class === 'deepfake')?.value ?? 0;

    console.log(`[Hive] ai_generated: ${(aiGeneratedValue * 100).toFixed(4)}%`);
    console.log(`[Hive] not_ai_generated: ${(notAiGeneratedValue * 100).toFixed(4)}%`);
    console.log(`[Hive] deepfake: ${(deepfakeValue * 100).toFixed(4)}%`);

    // Find generator classes (exclude detection classes)
    const generatorClasses = classesArray
      .filter(c => !NON_GENERATOR_CLASSES.has(c.class) && c.value > 0.0001)
      .sort((a, b) => b.value - a.value);

    // Top generator
    let topGenerator: HiveDetectionResult['topGenerator'] = null;
    if (generatorClasses.length > 0) {
      const top = generatorClasses[0];
      topGenerator = {
        className: top.class,
        displayName: getDisplayName(top.class),
        value: top.value,
      };
      console.log(`[Hive] Top generator: ${topGenerator.displayName} (${(topGenerator.value * 100).toFixed(4)}%)`);
    }

    // Top 5 generators
    const topGenerators = generatorClasses.slice(0, 5).map(c => ({
      className: c.class,
      displayName: getDisplayName(c.class),
      value: c.value,
    }));

    const result: HiveDetectionResult = {
      success: true,
      error: null,
      responseTimeMs: data.response_time_ms || responseTimeMs,
      rawResponse,
      allClasses: classesArray,
      taskId,
      model,
      version,
      aiGeneratedValue,
      notAiGeneratedValue,
      deepfakeValue,
      topGenerator,
      topGenerators,
    };

    console.log('[Hive] Analysis complete');
    return { result, error: null };

  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    const message = isTimeout ? 'Hive request timed out' : (err instanceof Error ? err.message : 'Unknown error');
    console.error(`[Hive] Error: ${message}`);
    return {
      result: null,
      error: { message, code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR' }
    };
  }
}
