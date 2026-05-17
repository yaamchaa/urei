import { useState, useEffect, useMemo, useCallback } from "react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { allComplexes, Complex } from "../data/complexes";

interface SimpleComplex {
  id: string;
  name: string;
  status: string;
  progress: number;
  householdsBefore: string;
  householdsAfter: string;
}

export function useComplexList(category: string = 'bundang') {
  // category에 따라 기본값 설정 (useMemo로 메모이제이션)
  const getInitialComplexList = useCallback(() => {
    if (category === 'bundang') {
      // 분당 재건축: 기본 4개 단지
      return allComplexes.filter(c =>
        ['sibeom2', 'saetbyeol', 'mokyeon1', 'yangji'].includes(c.id)
      );
    } else if (category === 'oldtown-redevelopment') {
      // 원도심 재개발: 해당 카테고리의 모든 단지
      return allComplexes.filter(c => c.category === 'oldtown-redevelopment');
    } else if (category === 'oldtown-reconstruction') {
      // 원도심 재건축: 해당 카테고리의 모든 단지
      return allComplexes.filter(c => c.category === 'oldtown-reconstruction');
    } else if (category === 'garohousing') {
      // 가로주택정비사업: 해당 카테고리의 모든 단지
      return allComplexes.filter(c => c.category === 'garohousing');
    }
    return [];
  }, [category]);

  const initialList = useMemo(() => getInitialComplexList(), [getInitialComplexList]);
  const [complexList, setComplexList] = useState<Complex[]>(initialList);
  const [isLoading, setIsLoading] = useState(true);

  const loadComplexList = useCallback(async () => {
    setIsLoading(true);
    try {
      // category에 따라 다른 엔드포인트 호출
      const endpoint = category !== 'bundang' 
        ? `complex-list-${category}` 
        : 'complex-list';
          
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.complexList && data.complexList.length > 0) {
          // complexList 데이터를 Complex 타입으로 변환
          const fullComplexList = data.complexList.map((item: SimpleComplex) => {
            const fullData = allComplexes.find(c => c.id === item.id);
            if (fullData) {
              return fullData;
            }
            // allComplexes에 없는 경우, 간단한 데이터로 Complex 객체 생성
            return {
              id: item.id,
              name: item.name,
              district: '분당구',
              category: category || 'bundang',
              status: item.status,
              progress: item.progress,
              householdsBefore: item.householdsBefore,
              householdsAfter: item.householdsAfter,
              maxFloors: '-',
              floorAreaRatio: '-',
              avgContribution31py: '-',
              parkingBefore: '-',
              parkingAfter: '-',
              nearbySchools: [],
              transportInfo: '-',
              studentProjection: '-',
              notes: '-',
              timeline: []
            } as Complex;
          });
          setComplexList(fullComplexList);
        } else {
          // 기본값으로 fallback
          setComplexList(getInitialComplexList());
        }
      } else {
        setComplexList(getInitialComplexList());
      }
    } catch (error) {
      console.error("단지 목록 로드 실패:", error);
      setComplexList(getInitialComplexList());
    } finally {
      setIsLoading(false);
    }
  }, [category, getInitialComplexList]);

  // category가 변경될 때 데이터 로드
  useEffect(() => {
    loadComplexList();
  }, [loadComplexList]);

  // complexListUpdated 이벤트 리스너
  useEffect(() => {
    const handleComplexListUpdate = () => {
      loadComplexList();
    };

    window.addEventListener('complexListUpdated', handleComplexListUpdate);
    return () => {
      window.removeEventListener('complexListUpdated', handleComplexListUpdate);
    };
  }, [loadComplexList]);

  return { complexList, isLoading };
}
