/**
 * 스킵 네비게이션 컴포넌트
 * KWCAG 2.1 - 2.4.1 (반복 영역 건너뛰기) 준수
 */

export function SkipNav() {
  return (
    <div className="skip-nav">
      <a href="#main-content" className="skip-link">
        본문 바로가기
      </a>
      <a href="#navigation" className="skip-link">
        주메뉴 바로가기
      </a>
      <a href="#footer" className="skip-link">
        푸터 바로가기
      </a>
    </div>
  );
}
