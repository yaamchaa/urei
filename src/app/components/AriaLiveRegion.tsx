/**
 * ARIA 라이브 리전 컴포넌트
 * 스크린 리더가 동적 콘텐츠 변경을 감지할 수 있도록 함
 */

export function AriaLiveRegion() {
  return (
    <>
      {/* 일반 알림용 (polite) */}
      <div
        id="aria-live-region"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* 긴급 알림용 (assertive) */}
      <div
        id="aria-live-region-assertive"
        className="sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      />
    </>
  );
}
