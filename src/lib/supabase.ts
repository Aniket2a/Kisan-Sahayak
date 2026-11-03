import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable retrieval supporting Vite, browser, and Node contexts
function getEnvVar(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
  } catch {
    // ignore
  }

  return '';
}

function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    const cleanedPath = parsed.pathname.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    return `${parsed.origin}${cleanedPath}`;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
}

const rawSupabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY').trim();

/**
 * Validates whether the Supabase environment variables are properly formatted and populated.
 * Note: Never logs or exposes the actual key contents.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  // Reject unconfigured placeholders
  if (
    supabaseUrl.includes('your-project-id') ||
    supabaseAnonKey.includes('your-anon-public-key') ||
    supabaseUrl.includes('placeholder')
  ) {
    return false;
  }

  try {
    const parsed = new URL(supabaseUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Defensive check: Ensure the secret service-role key is NEVER exposed in frontend code
if (typeof window !== 'undefined') {
  const anyWindow = window as any;
  if (anyWindow.__SUPABASE_SERVICE_ROLE_KEY__ || getEnvVar('SUPABASE_SERVICE_ROLE_KEY')) {
    console.error('[Security Warning] Service-role key detected in browser context. Service-role key must remain exclusively server-side.');
  }
}

/**
 * Singleton Supabase Client.
 * Initialized with the public publishable anon key only.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/**
 * Isolated connection verification utility.
 * Tests if the configured Supabase endpoint is reachable without querying tables or modifying data.
 */
export async function verifySupabaseConnection(): Promise<{
  configured: boolean;
  reachable: boolean;
  latencyMs?: number;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      reachable: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured or contain placeholder values.'
    };
  }

  const startTime = Date.now();

  try {
    const baseUrl = supabaseUrl.replace(/\/$/, '');
    let res = await fetch(`${baseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey
      }
    });

    if (!res.ok) {
      res = await fetch(`${baseUrl}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey
        }
      });
    }

    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      return {
        configured: true,
        reachable: true,
        latencyMs,
        message: `Successfully connected to Supabase endpoint (${latencyMs}ms).`
      };
    } else {
      return {
        configured: true,
        reachable: false,
        latencyMs,
        message: `Supabase endpoint responded with HTTP status ${res.status}.`
      };
    }
  } catch (err: any) {
    return {
      configured: true,
      reachable: false,
      message: `Failed to reach Supabase endpoint: ${err?.message || 'Network error'}`
    };
  }
}

