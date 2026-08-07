import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      scans: {
        Row: {
          id: string;
          user_id: string;
          scan_type: 'text' | 'image' | 'url';
          content: string;
          risk_score: number;
          classification: string;
          created_at: string;
          // Image scan columns
          image_type: string;
          authenticity_score: number;
          trust_score: number;
          deepfake_probability: number;
          ai_generation_probability: number;
          manipulation_score: number;
          forgery_score: number;
          confidence_score: number;
          extracted_text: string;
          extracted_transaction_data: Record<string, unknown>;
          editing_indicators: string[];
          ai_indicators: string[];
          verification_notes: string[];
          recommendations: string[];
          // URL scan columns
          url_threat_level: string | null;
          url_malicious_count: number;
          url_suspicious_count: number;
          url_harmless_count: number;
          url_total_engines: number;
          url_detection_names: string[];
          url_categories: string[];
          url_final_url: string | null;
          // Hive AI deepfake columns (sole authority)
          hive_used: boolean;
          hive_error: string | null;
          hive_ai_generated_score: number;
          hive_deepfake_score: number;
          hive_generator_attribution: string | null;
          hive_detection_status: string;
          hive_trust_score: number;
          hive_response_time: number;
          hive_midjourney_score: number;
          hive_stablediffusion_score: number;
          hive_dalle_score: number;
          hive_flux_score: number;
          hive_all_classes: Array<{ class: string; score: number }>;
          hive_image_metadata: { width: number; height: number; mimetype: string } | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          scan_type: 'text' | 'image' | 'url';
          content: string;
          risk_score: number;
          classification: string;
          created_at?: string;
          // Image scan columns
          image_type?: string;
          authenticity_score?: number;
          trust_score?: number;
          deepfake_probability?: number;
          ai_generation_probability?: number;
          manipulation_score?: number;
          forgery_score?: number;
          confidence_score?: number;
          extracted_text?: string;
          extracted_transaction_data?: Record<string, unknown>;
          editing_indicators?: string[];
          ai_indicators?: string[];
          verification_notes?: string[];
          recommendations?: string[];
          // URL scan columns
          url_threat_level?: string;
          url_malicious_count?: number;
          url_suspicious_count?: number;
          url_harmless_count?: number;
          url_total_engines?: number;
          url_detection_names?: string[];
          url_categories?: string[];
          url_final_url?: string;
          // Hive AI deepfake columns (sole authority)
          hive_used?: boolean;
          hive_error?: string;
          hive_ai_generated_score?: number;
          hive_deepfake_score?: number;
          hive_generator_attribution?: string;
          hive_detection_status?: string;
          hive_trust_score?: number;
          hive_response_time?: number;
          hive_midjourney_score?: number;
          hive_stablediffusion_score?: number;
          hive_dalle_score?: number;
          hive_flux_score?: number;
          hive_all_classes?: Array<{ class: string; score: number }>;
          hive_image_metadata?: { width: number; height: number; mimetype: string } | null;
        };
      };
    };
  };
};

export type Scan = Database['public']['Tables']['scans']['Row'];
export type ScanInsert = Database['public']['Tables']['scans']['Insert'];
