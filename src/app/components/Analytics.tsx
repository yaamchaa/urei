import { useEffect } from 'react';
import { useLocation } from 'react-router';

// GA4 이벤트 추적 함수
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
    console.log('📊 GA4 Event:', eventName, eventParams);
  }
};

// Clarity 이벤트 추적 함수
export const trackClarityEvent = (eventName: string) => {
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('event', eventName);
    console.log('📊 Clarity Event:', eventName);
  }
};

interface AnalyticsProps {
  gaTrackingId?: string;
  clarityProjectId?: string;
}

export function Analytics({ gaTrackingId, clarityProjectId }: AnalyticsProps) {
  const location = useLocation();

  // GA4 스크립트 로드
  useEffect(() => {
    if (!gaTrackingId) return;

    // GA4 스크립트가 이미 로드되었는지 확인
    if (document.getElementById('ga4-script')) return;

    // GA4 gtag.js 스크립트 추가
    const script1 = document.createElement('script');
    script1.id = 'ga4-script';
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
    document.head.appendChild(script1);

    // GA4 초기화 스크립트 추가
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaTrackingId}', {
        send_page_view: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(script2);

    console.log('✅ GA4 초기화 완료:', gaTrackingId);
  }, [gaTrackingId]);

  // Microsoft Clarity 스크립트 로드
  useEffect(() => {
    if (!clarityProjectId) return;

    // Clarity 스크립트가 이미 로드되었는지 확인
    if (document.getElementById('clarity-script')) return;

    const script = document.createElement('script');
    script.id = 'clarity-script';
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityProjectId}");
    `;
    document.head.appendChild(script);

    console.log('✅ Microsoft Clarity 초기화 완료:', clarityProjectId);
  }, [clarityProjectId]);

  // 페이지 변경 추적 (GA4)
  useEffect(() => {
    if (!gaTrackingId) return;

    const pagePath = location.pathname + location.search;
    const pageTitle = document.title;

    // 페이지뷰 이벤트 전송
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.href
      });
      console.log('📊 GA4 Page View:', pagePath);
    }
  }, [location, gaTrackingId]);

  return null;
}
