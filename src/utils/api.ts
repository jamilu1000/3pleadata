/**
 * Robust API fetch utility for 3PLE A application.
 * Ensures responses are safely validated and never throws unexpected JSON parse errors
 * when encountering non-JSON, HTML error pages, or unexpected network failures.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        'Accept': 'application/json',
        ...(init?.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          ok: false,
          error: data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`,
          status: res.status,
          data,
        };
      }
      return { ok: true, data: data as T, status: res.status };
    }

    // Response was not JSON (e.g. text/html fallback or plain string)
    const text = await res.text().catch(() => '');
    return {
      ok: false,
      error: res.ok
        ? 'Received non-JSON response from server'
        : `Server returned HTTP ${res.status}${text ? `: ${text.slice(0, 80)}` : ''}`,
      status: res.status,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network request failed',
      status: 0,
    };
  }
}
