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

  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}