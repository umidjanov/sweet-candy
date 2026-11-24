function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // If running in browser on HTTPS (e.g. Vercel deployment, Telegram Web App),
  // localhost cannot be reached due to browser Mixed Content security rules.
  if (isHttps) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/+$/, '');
    }
    // Active Cloudflare Tunnel connection
    return 'https://conviction-life-oven-samples.trycloudflare.com/api/v1';
  }

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:4000/api/v1';
}

export class ApiError extends Error {
  code?: string;
  details?: any;
  status: number;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiBase = getApiBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${apiBase}${cleanEndpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    'Bypass-Tunnel-Reminder': 'true',
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sweetmarket_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err: any) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isHttps && url.includes('localhost:4000')) {
      throw new ApiError(
        'Serverga ulanib bo‘lmadi: Vercel sozlamalarida NEXT_PUBLIC_API_URL o‘rnatilmagan.',
        0,
        'MIXED_CONTENT_BLOCKED'
      );
    }
    throw new ApiError(
      err?.message === 'Load failed' || err?.message === 'Failed to fetch'
        ? 'Server bilan aloqa o‘rnatib bo‘lmadi. Internet yoki backend ulanishini tekshiring.'
        : err?.message || 'Serverga ulanishda xatolik',
      0,
      'NETWORK_ERROR'
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sweetmarket_access_token');
      localStorage.removeItem('sweetmarket_login_time');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    const errorMsg = data?.error?.message || response.statusText || 'Request failed';
    throw new ApiError(errorMsg, response.status, data?.error?.code, data?.error?.details);
  }

  return data?.data !== undefined ? data.data : data;
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient<{ url: string }>('/upload', {
    method: 'POST',
    body: formData,
  });
  return res.url;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  if (files.length === 1) {
    const url = await uploadImage(files[0]);
    return [url];
  }
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });
  const res = await apiClient<{ urls: string[] }>('/upload/multiple', {
    method: 'POST',
    body: formData,
  });
  return res.urls || [];
}
