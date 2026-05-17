/**
 * Web Vitals 측정 유틸리티
 * Core Web Vitals (LCP, FID, CLS) 및 기타 성능 지표 측정
 */

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Web Vitals 측정 및 콘솔 로깅
 */
export function reportWebVitals(onPerfEntry?: (metric: WebVitalsMetric) => void) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // 동적으로 web-vitals 라이브러리 로드 (있는 경우)
    import('web-vitals')
      .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(onPerfEntry);
        onFCP(onPerfEntry);
        onLCP(onPerfEntry);
        onTTFB(onPerfEntry);
        onINP(onPerfEntry);
    }).catch(() => {
      // web-vitals가 설치되지 않은 경우 Performance API 사용
      measurePerformanceWithAPI();
    });
  } else {
    measurePerformanceWithAPI();
  }
}

/**
 * Performance API를 사용한 기본 성능 측정
 */
function measurePerformanceWithAPI() {
  if (typeof window === 'undefined' || !window.performance || typeof PerformanceObserver === 'undefined') {
    return;
  }

  // Performance Observer로 성능 메트릭 관찰
  try {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.log('[성능] LCP:', Math.round(lastEntry.startTime), 'ms');
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay (FID) / Interaction to Next Paint (INP)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as Array<PerformanceEntry & { processingStart?: number }>;
      entries.forEach((entry) => {
        if (typeof entry.processingStart === 'number') {
        console.log('[성능] First Input Delay:', Math.round(entry.processingStart - entry.startTime), 'ms');
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>;
      entries.forEach((entry) => {
        if (!entry.hadRecentInput && typeof entry.value === 'number') {
          clsValue += entry.value;
        }
      });
      console.log('[성능] CLS:', clsValue.toFixed(4));
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Navigation Timing (페이지 로드 시간)
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (perfData) {
          console.log('[성능] 페이지 로드 완료:', {
            'DNS 조회': Math.round(perfData.domainLookupEnd - perfData.domainLookupStart) + 'ms',
            'TCP 연결': Math.round(perfData.connectEnd - perfData.connectStart) + 'ms',
            '서버 응답': Math.round(perfData.responseEnd - perfData.requestStart) + 'ms',
            'DOM 구성': Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart) + 'ms',
            '전체 로드': Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
          });
        }
      }, 0);
    });
  } catch (error) {
    console.warn('[성능] Performance Observer를 지원하지 않는 브라우저입니다.');
  }
}

/**
 * 성능 마크 생성
 */
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && window.performance && typeof window.performance.mark === 'function') {
    window.performance.mark(name);
  }
}

/**
 * 성능 측정 (두 마크 사이의 시간)
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && window.performance && typeof window.performance.measure === 'function') {
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      if (measure) {
        console.log(`[성능] ${name}:`, Math.round(measure.duration), 'ms');
      }
    } catch (error) {
      // 마크가 없는 경우 무시
    }
  }
}

/**
 * 리소스 타이밍 분석
 */
export function analyzeResourceTiming() {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const byType: Record<string, { count: number; totalSize: number; totalDuration: number }> = {};

  resources.forEach((resource) => {
    const type = resource.initiatorType || 'other';
    if (!byType[type]) {
      byType[type] = { count: 0, totalSize: 0, totalDuration: 0 };
    }
    byType[type].count++;
    byType[type].totalSize += resource.transferSize || 0;
    byType[type].totalDuration += resource.duration;
  });

  console.log('[성능] 리소스 타이밍 분석:', byType);
}

/**
 * 메모리 사용량 체크 (Chrome only)
 */
export function checkMemoryUsage() {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  const perf = window.performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (perf.memory) {
    console.log('[성능] 메모리 사용량:', {
      'JS Heap 크기': Math.round(perf.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      'JS Heap 한계': Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
    });
  }
}
