'use client';

// Thin fetch wrapper for calling our own /api routes from client components.
// Always sends/receives cookies (same-origin session).
//
// Admin GETs are retried briefly after transient failures. The request deadline
// covers both response headers and the full response body, which matters for
// slower mobile connections.

export class ApiError extends Error {
  status: number;
  code?: string;
  type?: string;
  operation?: string;

  constructor(
    message: string,
    status: number,
    details?: { code?: string; type?: string; operation?: string }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = details?.code;
    this.type = details?.type;
    this.operation = details?.operation;
  }
}

/** Format an API error for display, including the safe server-side code. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const diagnostics = [
      error.code ? `code: ${error.code}` : null,
      error.operation ? `operation: ${error.operation}` : null,
    ].filter(Boolean);
    return diagnostics.length
      ? `${error.message} (${diagnostics.join(', ')})`
      : error.message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 25_000;
const ADMIN_MAX_ATTEMPTS = 2;
const ADMIN_REQUEST_TIMEOUT_MS = 15_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt: number): number {
  return 250 * 2 ** attempt + Math.floor(Math.random() * 150);
}

async function fetchOnce(
  path: string,
  options: RequestInit
): Promise<{ response: Response; body: any }> {
  const controller = new AbortController();
  const isAdminRequest = path.startsWith('/admin/');
  const timeout = isAdminRequest ? ADMIN_REQUEST_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    let body: any = null;
    try {
      body = await response.json();
    } catch {
      if (controller.signal.aborted) throw new Error('Request timed out while reading the response.');
      // Some platform errors have no JSON body.
    }
    return { response, body };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError(
        'The server took too long to respond. Check your connection and retry.',
        0,
        { type: 'timeout' }
      );
    }
    throw new ApiError(
      'The connection to the server failed. Check your internet connection and retry.',
      0,
      { type: 'network' }
    );
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toString().toUpperCase();
  const isAdminRequest = path.startsWith('/admin/');
  // Retrying GET/HEAD is safe. Retrying a mutation could apply it twice.
  const canRetry = method === 'GET' || method === 'HEAD';
  const attempts = canRetry
    ? isAdminRequest ? ADMIN_MAX_ATTEMPTS : MAX_ATTEMPTS
    : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response: Response;
    let body: any;
    try {
      ({ response, body } = await fetchOnce(path, options));
    } catch (error) {
      lastError = error instanceof ApiError
        ? error
        : new ApiError('The connection to the server failed. Check your internet connection and retry.', 0, {
            type: 'network',
          });
      if (!canRetry || attempt === attempts - 1) {
        throw lastError;
      }
      await delay(retryDelay(attempt));
      continue;
    }

    if (response.ok) return body as T;

    const error = new ApiError(body?.error || 'Something went wrong.', response.status, {
      code: typeof body?.code === 'string' ? body.code : undefined,
      type: typeof body?.type === 'string' ? body.type : undefined,
      operation: typeof body?.operation === 'string' ? body.operation : undefined,
    });

    if (!canRetry || !RETRYABLE_STATUS.has(response.status) || attempt === attempts - 1) {
      throw error;
    }

    lastError = error;
    await delay(retryDelay(attempt));
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError('Something went wrong.', 0);
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
