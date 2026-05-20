// CSRF 토큰 관리 유틸리티

const CSRF_TOKEN_KEY = 'bundang360_csrf_token';

/**
 * CSRF 토큰 저장
 */
export function setCsrfToken(token: string): void {
  localStorage.setItem(CSRF_TOKEN_KEY, token);
}

/**
 * CSRF 토큰 가져오기
 */
export function getCsrfToken(): string | null {
  return localStorage.getItem(CSRF_TOKEN_KEY);
}

/**
 * CSRF 토큰 삭제
 */
export function clearCsrfToken(): void {
  localStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * fetch 요청에 CSRF 토큰 헤더 추가
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const csrfToken = getCsrfToken();

  if (!csrfToken) {
    return headers;
  }

  return {
    ...headers,
    'X-CSRF-Token': csrfToken,
  };
}
