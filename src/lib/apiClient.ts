export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError(
      'Unable to parse server response',
      response.status,
      'INVALID_RESPONSE',
    );
  }

  if (!response.ok || !payload.success) {
    throw new ApiClientError(
      payload.message || 'Request failed',
      response.status,
      payload.code || 'REQUEST_FAILED',
      payload.details,
    );
  }

  return payload.data as T;
}
