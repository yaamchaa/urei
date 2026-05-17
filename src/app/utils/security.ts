// 🔒 프론트엔드 보안 유틸리티

/**
 * XSS 방지: HTML 태그 제거
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

/**
 * 금지어 검증 (클라이언트 측 사전 검증)
 */
const BANNED_WORDS = [
  '씨발', '개새끼', '병신', '좆', '지랄', '미친', '닥쳐', '꺼져',
  '바보', '멍청이', '등신', '호로', '창녀', '년', '놈'
];

export function containsBannedWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word));
}

/**
 * 텍스트 길이 검증
 */
export function validateTextLength(text: string, minLength: number, maxLength: number): boolean {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * 전화번호 검증
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 안전한 API 호출 (에러 처리 포함)
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return response;
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw new Error('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const validCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  if (validCount < 3) {
    return {
      valid: false,
      message: '비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.',
    };
  }

  return { valid: true, message: '안전한 비밀번호입니다.' };
}

/**
 * 입력값 Escape (추가 보호)
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * URL 검증
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * CSRF 토큰 생성 (세션 스토리지 사용)
 */
export function generateCsrfToken(): string {
  const token = crypto.randomUUID();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * CSRF 토큰 검증
 */
export function verifyCsrfToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token;
}

/**
 * 세션 토큰 초기화
 */
export function initializeCsrfToken(): string {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = generateCsrfToken();
  }
  return token;
}
