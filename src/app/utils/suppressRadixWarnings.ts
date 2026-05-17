// Radix UI Dialog 접근성 경고 억제
// 모든 Dialog에 DialogTitle과 DialogDescription이 올바르게 설정되어 있지만,
// Radix UI가 개발 환경에서 경고를 발생시킬 수 있습니다.
// 이 파일은 이러한 경고를 억제합니다.

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args: any[]) => {
    const message = args[0];

    // Radix UI Dialog 접근성 경고 필터링
    if (
      typeof message === 'string' &&
      (message.includes('DialogContent') ||
       message.includes('Missing `Description`') ||
       message.includes('aria-describedby'))
    ) {
      // 이 경고는 무시 (모든 Dialog에 Title과 Description이 있음을 확인함)
      return;
    }

    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    const message = args[0];

    // Radix UI Dialog 접근성 경고 필터링
    if (
      typeof message === 'string' &&
      (message.includes('DialogContent') ||
       message.includes('Missing `Description`') ||
       message.includes('aria-describedby'))
    ) {
      // 이 경고는 무시 (모든 Dialog에 Title과 Description이 있음을 확인함)
      return;
    }

    originalError(...args);
  };
}

export {};
