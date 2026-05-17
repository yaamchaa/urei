import { useState, useEffect } from 'react';
import { Analytics } from './Analytics';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function AnalyticsWrapper() {
  const [config, setConfig] = useState<{
    gaTrackingId?: string;
    clarityProjectId?: string;
  }>({});

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/analytics/config`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setConfig({
            gaTrackingId: data.ga_tracking_id,
            clarityProjectId: data.clarity_project_id,
          });
        }
      } catch (error) {
        console.error('Analytics 설정 로드 실패:', error);
      }
    };

    loadConfig();

    // 설정 업데이트 이벤트 리스너
    const handleConfigUpdate = () => {
      loadConfig();
    };
    window.addEventListener('analyticsConfigUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('analyticsConfigUpdated', handleConfigUpdate);
    };
  }, []);

  return <Analytics gaTrackingId={config.gaTrackingId} clarityProjectId={config.clarityProjectId} />;
}
