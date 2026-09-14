let csrfToken = '';
export const setCsrfToken = (value: string) => { csrfToken = value; };

async function refreshCsrfToken(): Promise<boolean> {
  const response = await fetch('/api/auth/me', {
    headers: { 'X-Coach-Request': '1' },
    credentials: 'same-origin',
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event('coach-session-expired'));
    return false;
  }
  if (!response.ok) return false;
  const body = await response.json() as { user?: { csrf_token?: unknown } };
  if (typeof body.user?.csrf_token !== 'string' || !body.user.csrf_token) return false;
  setCsrfToken(body.user.csrf_token);
  return true;
}

async function hasInvalidCsrfToken(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;
  try {
    const body = await response.clone().json() as { error?: unknown };
    return body.error === 'Invalid CSRF token.';
  } catch {
    return false;
  }
}

export async function authFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('X-Coach-Request', '1');
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  const send = () => fetch(url, { ...init, headers, credentials: 'same-origin' });
  let response = await send();
  if (await hasInvalidCsrfToken(response) && await refreshCsrfToken()) {
    headers.set('X-CSRF-Token', csrfToken);
    response = await send();
  }
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
