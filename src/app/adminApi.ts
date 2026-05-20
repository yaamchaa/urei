import { getCsrfToken } from "./utils/csrf";

export function getAdminApiToken() {
  return localStorage.getItem("adminApiToken");
}

export function setAdminApiToken(token: string) {
  localStorage.setItem("adminApiToken", token);
}

export function clearAdminApiToken() {
  localStorage.removeItem("adminApiToken");
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getAdminApiToken();
  const method = init.method?.toUpperCase() || 'GET';
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  // Add CSRF token for state-changing requests
  if (isStateChanging) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}