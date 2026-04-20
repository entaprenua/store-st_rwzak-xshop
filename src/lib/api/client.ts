const API_BASE = '/api/v1';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  csrfToken?: string;
};

export function setTokenExpiry(_expiresAt: number | null) {
  // Kept for backward compatibility - platform tokens not used in storefront
}

export function getTokenExpiry(): number | null {
  // Kept for backward compatibility - platform tokens not used in storefront
  return null;
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function shouldIncludeCsrf(path: string, method: string): boolean {
  if (method === 'GET') return false;
  // Store customer endpoints that don't need CSRF
  const exemptPaths = ['/customers/login', '/customers/register', '/customers/logout'];
  return !exemptPaths.some(p => path.includes(p));
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  return requestInternal<T>(path, options, API_BASE);
}

async function requestInternal<T>(path: string, options: FetchOptions, baseUrl: string): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken && shouldIncludeCsrf(path, method)) {
    requestHeaders['X-CSRF-Token'] = csrfToken;
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();

  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    const apiResponse = json as { success: boolean; data: unknown; message?: string; error?: unknown };
    if (apiResponse.success) {
      return apiResponse.data as T;
    } else {
      throw new ApiError(apiResponse.message || 'Request failed', response.status, apiResponse.error);
    }
  }

  return json as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const csrfToken = getCsrfTokenFromCookie();
    const headers: Record<string, string> = {};
    if (csrfToken && shouldIncludeCsrf(path, 'POST')) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    return response.json();
  },
};