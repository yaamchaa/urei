import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { complexes } from '../data/complexes';

interface ProgressContextType {
  progressData: { [key: string]: number };
  loading: boolean;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// 기본값 생성 함수
const getDefaultProgressData = () => {
  const initialProgress: { [key: string]: number } = {};
  complexes.forEach(complex => {
    initialProgress[complex.id] = complex.progress;
  });
  return initialProgress;
};

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progressData, setProgressData] = useState<{ [key: string]: number }>(() => {
    // 초기값으로 complexes의 기본 진행율 설정
    return getDefaultProgressData();
  });
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/progress`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      // API가 없거나 테이블이 없을 경우 기본값 사용
      if (!response.ok) {
        const progressMap: { [key: string]: number } = {};
        complexes.forEach(complex => {
          progressMap[complex.id] = complex.progress;
        });
        setProgressData(progressMap);
        setLoading(false);
        return;
      }

      const data = await response.json();

      const progressMap: { [key: string]: number } = {};

      if (data && data.length > 0) {
        // 서버 데이터 사용
        data.forEach((item: any) => {
          progressMap[item.complex_id] = item.progress;
        });
      } else {
        // 데이터가 없으면 complexes의 기본값 사용
        complexes.forEach(complex => {
          progressMap[complex.id] = complex.progress;
        });
      }

      setProgressData(progressMap);
    } catch (error) {
      // 에러 시 complexes의 기본값 사용
      const progressMap: { [key: string]: number } = {};
      complexes.forEach(complex => {
        progressMap[complex.id] = complex.progress;
      });
      setProgressData(progressMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();

    // progressUpdated 이벤트 리스 등록
    const handleProgressUpdate = () => {
      loadProgress();
    };

    window.addEventListener('progressUpdated', handleProgressUpdate);

    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate);
    };
  }, []);

  const refreshProgress = async () => {
    setLoading(true);
    await loadProgress();
  };

  return (
    <ProgressContext.Provider value={{ progressData, loading, refreshProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    // Provider가 없을 때 기본값 반환 (개발 중 hot reload 대응)
    console.warn('useProgress used outside ProgressProvider - using default values');
    return {
      progressData: getDefaultProgressData(),
      loading: false,
      refreshProgress: async () => {},
    };
  }
  return context;
}