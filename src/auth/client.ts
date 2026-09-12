let csrfToken = '';
export const setCsrfToken = (value: string) => { csrfToken = value; };
export async function authFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('X-Coach-Request', '1');
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(url, { ...init, headers, credentials: 'same-origin' });
  if (response.status === 401 && url !== '/api/auth/login' && url !== '/api/auth/me') window.dispatchEvent(new Event('coach-session-expired'));
  return response;
}
export async function api<T = any>(url: string, body?: unknown, method?: string): Promise<T> {
  const response = await authFetch(url, { method: method || (body === undefined ? 'GET' : 'POST'),
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}
