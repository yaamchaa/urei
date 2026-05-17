/**
 * 웹 접근성 유틸리티 함수 모음
 * KWCAG 2.1 (한국형 웹 콘텐츠 접근성 지침 2.1) 준수
 */

/**
 * 포커스를 특정 요소로 이동
 * @param selector - CSS 선택자 또는 HTMLElement
 */
export function moveFocusTo(selector: string | HTMLElement): void {
  const element = typeof selector === 'string'
    ? document.querySelector<HTMLElement>(selector)
    : selector;

  if (element) {
    element.focus();
  }
}

/**
 * 포커스 트랩 관리 (모달/드롭다운용)
 * @param container - 포커스를 가둘 컨테이너 요소
 * @returns cleanup 함수
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }

  function handleEscapeKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      // ESC 키로 모달/드롭다운 닫기는 컴포넌트에서 처리
      container.dispatchEvent(new CustomEvent('escapePressed'));
    }
  }

  container.addEventListener('keydown', handleTabKey);
  container.addEventListener('keydown', handleEscapeKey);

  // 첫 번째 요소에 포커스
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
    container.removeEventListener('keydown', handleEscapeKey);
  };
}

/**
 * 스크린 리더 전용 텍스트를 읽기 위한 라이브 리전 업데이트
 * @param message - 스크린 리더가 읽을 메시지
 * @param priority - 'polite' (기본) 또는 'assertive'
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const liveRegion = document.getElementById('aria-live-region');

  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    // 메시지를 짧게 유지한 후 지우기
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

/**
 * 키보드 네비게이션 헬퍼 - 화살표 키로 목록 탐색
 * @param currentIndex - 현재 인덱스
 * @param listLength - 목록 길이
 * @param key - 눌린 키
 * @returns 새로운 인덱스
 */
export function handleArrowKeyNavigation(
  currentIndex: number,
  listLength: number,
  key: string
): number {
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return (currentIndex + 1) % listLength;
    case 'ArrowUp':
    case 'ArrowLeft':
      return (currentIndex - 1 + listLength) % listLength;
    case 'Home':
      return 0;
    case 'End':
      return listLength - 1;
    default:
      return currentIndex;
  }
}

/**
 * 색상 대비 검증 (WCAG 2.1 AA 기준 4.5:1)
 * @param foreground - 전경색 (hex)
 * @param background - 배경색 (hex)
 * @returns 대비가 충분한지 여부
 */
export function hasEnoughContrast(foreground: string, background: string): boolean {
  const luminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return ratio >= 4.5; // WCAG AA 기준
}
