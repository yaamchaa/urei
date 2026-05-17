import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { complexes } from '../data/complexes';

interface TimelineItem {
  event: string;
  date: string;
  status: 'completed' | 'ongoing' | 'planned';
}

interface TimelineContextType {
  getTimeline: (complexId: string) => TimelineItem[];
  loading: boolean;
  refreshTimeline: () => Promise<void>;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

// 기본값 생성 함수
const getDefaultTimeline = (complexId: string): TimelineItem[] => {
  const complex = complexes.find(c => c.id === complexId);
  return complex?.timeline || [];
};

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [timelineData, setTimelineData] = useState<{ [key: string]: TimelineItem[] }>(() => {
    // 초기값으로 complexes의 기본 timeline 설정
    const initialTimeline: { [key: string]: TimelineItem[] } = {};
    complexes.forEach(complex => {
      initialTimeline[complex.id] = complex.timeline;
    });
    return initialTimeline;
  });
  const [loading, setLoading] = useState(true);

  const loadAllTimelines = async () => {
    try {
      const timelineMap: { [key: string]: TimelineItem[] } = {};

      // 각 단지의 timeline을 병렬로 가져오기
      await Promise.all(
        complexes.map(async (complex) => {
          try {
            const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/timeline?complex_id=${complex.id}`;
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data && data.timeline) {
                timelineMap[complex.id] = data.timeline;
              } else {
                // 서버에 데이터 없으면 기본값 사용
                timelineMap[complex.id] = complex.timeline;
              }
            } else {
              // API 호출 실패 시 기본값 사용
              timelineMap[complex.id] = complex.timeline;
            }
          } catch (error) {
            // 에러 시 기본값 사용
            timelineMap[complex.id] = complex.timeline;
          }
        })
      );

      setTimelineData(timelineMap);
    } catch (error) {
      console.log('타임라인 데이터 로드 중 에러 - 기본값 사용:', error);
      // 에러 시 complexes의 기본값 사용
      const defaultTimeline: { [key: string]: TimelineItem[] } = {};
      complexes.forEach(complex => {
        defaultTimeline[complex.id] = complex.timeline;
      });
      setTimelineData(defaultTimeline);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTimelines();

    // timelineUpdated 이벤트 리스너 등록
    const handleTimelineUpdate = () => {
      loadAllTimelines();
    };

    window.addEventListener('timelineUpdated', handleTimelineUpdate);

    return () => {
      window.removeEventListener('timelineUpdated', handleTimelineUpdate);
    };
  }, []);

  const getTimeline = (complexId: string): TimelineItem[] => {
    return timelineData[complexId] || getDefaultTimeline(complexId);
  };

  const refreshTimeline = async () => {
    setLoading(true);
    await loadAllTimelines();
  };

  return (
    <TimelineContext.Provider value={{ getTimeline, loading, refreshTimeline }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    // Provider가 없을 때 기본값 반환 (개발 중 hot reload 대응)
    console.warn('useTimeline used outside TimelineProvider - using default values');
    return {
      getTimeline: getDefaultTimeline,
      loading: false,
      refreshTimeline: async () => {},
    };
  }
  return context;
}
