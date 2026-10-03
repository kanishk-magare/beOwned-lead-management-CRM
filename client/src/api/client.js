export const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/** Error thrown for any non-2xx response; carries field-level details when the API sends them. */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || null;
  }
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
  let url = `${BASE_URL}${path}`;

  if (params) {

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {

      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  let headers;
  let requestBody;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (isFormData) {

    requestBody = body;
  } else if (body) {
    
    headers = { 'Content-Type': 'application/json' };
    requestBody = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      headers,
      body: requestBody,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Is the API running?', 0);
  }

  if (res.status === 204) return null;

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response (e.g. proxy error page)
  }

  if (!res.ok) {
    throw new ApiError(
      payload?.error?.message || `Request failed (${res.status})`,
      res.status,
      payload?.error?.details
    );
  }
  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
