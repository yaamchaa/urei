import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { complexes } from '../data/complexes';

interface ContributionContextType {
  contributionData: { [key: string]: string };
  loading: boolean;
  refreshContribution: () => Promise<void>;
}

const ContributionContext = createContext<ContributionContextType | undefined>(undefined);

// 기본값 생성 함수
const getDefaultContributionData = () => {
  const initialContribution: { [key: string]: string } = {};
  complexes.forEach(complex => {
    initialContribution[complex.id] = complex.avgContribution31py;
  });
  return initialContribution;
};

export function ContributionProvider({ children }: { children: ReactNode }) {
  const [contributionData, setContributionData] = useState<{ [key: string]: string }>(() => {
    // 초기값으로 complexes의 기본 분담금 설정
    return getDefaultContributionData();
  });
  const [loading, setLoading] = useState(true);

  const loadContribution = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/contribution`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      // API가 없거나 테이블이 없을 경우 기본값 사용
      if (!response.ok) {
        const contributionMap: { [key: string]: string } = {};
        complexes.forEach(complex => {
          contributionMap[complex.id] = complex.avgContribution31py;
        });
        setContributionData(contributionMap);
        setLoading(false);
        return;
      }

      const data = await response.json();

      const contributionMap: { [key: string]: string } = {};

      if (data && data.length > 0) {
        // 서버 데이터 사용
        data.forEach((item: any) => {
          contributionMap[item.complex_id] = item.contribution;
        });
      } else {
        // 데이터가 없으면 complexes의 기본값 사용
        complexes.forEach(complex => {
          contributionMap[complex.id] = complex.avgContribution31py;
        });
      }

      setContributionData(contributionMap);
    } catch (error) {
      // 에러 시 complexes의 기본값 사용
      const contributionMap: { [key: string]: string } = {};
      complexes.forEach(complex => {
        contributionMap[complex.id] = complex.avgContribution31py;
      });
      setContributionData(contributionMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContribution();

    // contributionUpdated 이벤트 리스너 등록
    const handleContributionUpdate = () => {
      loadContribution();
    };

    window.addEventListener('contributionUpdated', handleContributionUpdate);

    return () => {
      window.removeEventListener('contributionUpdated', handleContributionUpdate);
    };
  }, []);

  const refreshContribution = async () => {
    setLoading(true);
    await loadContribution();
  };

  return (
    <ContributionContext.Provider value={{ contributionData, loading, refreshContribution }}>
      {children}
    </ContributionContext.Provider>
  );
}

export function useContribution() {
  const context = useContext(ContributionContext);
  if (context === undefined) {
    // Provider가 없을 때 기본값 반환 (개발 중 hot reload 대응)
    console.warn('useContribution used outside ContributionProvider - using default values');
    return {
      contributionData: getDefaultContributionData(),
      loading: false,
      refreshContribution: async () => {},
    };
  }
  return context;
}
