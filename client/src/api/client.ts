let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Transmit HttpOnly cookies
  };

  const response = await fetch(url, config);

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newToken = data.data.accessToken;
          setAccessToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);

          // Retry initial request
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, { ...config, headers });
          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            throw new ApiError(
              retryData.error?.message || 'Request failed after refresh',
              retryResponse.status,
              retryData.error?.code
            );
          }
          return retryData.data;
        } else {
          isRefreshing = false;
          setAccessToken(null);
          window.dispatchEvent(new Event('auth:unauthorized'));
          throw new ApiError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
        }
      } catch (err) {
        isRefreshing = false;
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
        throw err;
      }
    } else {
      // Wait for ongoing refresh
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken: string) => {
          try {
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, { ...config, headers });
            const retryData = await retryResponse.json();
            if (!retryResponse.ok) {
              reject(
                new ApiError(
                  retryData.error?.message || 'Request failed',
                  retryResponse.status,
                  retryData.error?.code
                )
              );
            } else {
              resolve(retryData.data);
            }
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error?.message || `HTTP ${response.status} error`,
      response.status,
      data.error?.code,
      data.error?.details
    );
  }

  return data.data !== undefined ? data.data : data;
};
