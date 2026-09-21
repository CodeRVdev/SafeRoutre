export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const isProd = import.meta.env.PROD;
const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

const CANDIDATE_API_URLS: string[] = configuredApiUrl
  ? [configuredApiUrl]
  : isProd
  ? ['/api']
  : [
      'http://localhost:5002/api',
      'http://localhost:5001/api',
      'http://localhost:5000/api',
    ];

async function doFetch(url: string, options: RequestInit) {
  return fetch(url, options);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('saferoute_jwt_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response | null = null;
  let lastError: any = null;

  if (endpoint.startsWith('http')) {
    response = await doFetch(endpoint, { ...options, headers });
  } else {
    for (const baseUrl of CANDIDATE_API_URLS) {
      try {
        const url = `${baseUrl}${endpoint}`;
        response = await doFetch(url, { ...options, headers });
        if (response) break;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (!response) {
    throw lastError || new Error('Failed to connect to SafeRoute API.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('saferoute_jwt_token');
      localStorage.removeItem('saferoute_user_profile');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('saferoute:auth_expired'));
      }
    }
    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}
