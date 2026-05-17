// ⚠️ 주의: 모든 데이터는 예시입니다. 실제 운영 시 정확한 공식 데이터로 교체해야 합니다.

import { oldtownRedevelopmentComplexes, oldtownReconstructionComplexes, garohousingComplexes } from './newComplexes';

export interface Complex {
  id: string;
  name: string;
  district: string;
  category: 'bundang' | 'oldtown-redevelopment' | 'oldtown-reconstruction' | 'garohousing'; // 카테고리 추가
  status: string;
  progress: number;
  householdsBefore: string;
  householdsAfter: string;
  maxFloors: string;
  floorAreaRatio: string;
  buildingCoverageRatio?: string; // 건폐율
  avgContribution31py: string;
  parkingBefore: string;
  parkingAfter: string;
  nearbySchools: string[];
  transportInfo: string;
  studentProjection: string;
  notes: string;
  timeline: {
    date: string;
    event: string;
    status: 'completed' | 'ongoing' | 'planned';
  }[];
  // 추가: 상세 진행 현황
  detailedProgress?: {
    currentStatus: string;
    nextMilestone: string;
    expectedConstruction: string;
    expectedMoveIn: string;
  };
  // 추가: 세부 구역 정보
  subDistricts?: {
    largeName: string;
    subName: string;
    location: string;
    area: string; // 면적
    zoning: string; // 용도지역
    totalBudget: string; // 총 사업비
    projectMethod: string; // 사업방식
    constructor: string; // 시공사
    beforeHouseholds: string;
    afterHouseholds: string;
  }[];
}

export const complexes: Complex[] = [
  {
    id: 'sibeom2',
    name: '시범단지2',
    district: '분당구',
    category: 'bundang',
    status: '특별정비구역 지정 완료',
    progress: 60,
    householdsBefore: '3,569가구',
    householdsAfter: '6,049가구',
    maxFloors: '최대 49층',
    floorAreaRatio: '325~365%',
    avgContribution31py: '4~5억 원',
    parkingBefore: '1.15대',
    parkingAfter: '1.45대',
    nearbySchools: ['분당초', '서현중', '분당고'],
    transportInfo: '8호선 연장 15분 거리 (계획)',
    studentProjection: '+25% 예상',
    notes: '스카이라인 변화 예상',
    timeline: [
      { date: '2025.08', event: '특별정비구역 지정 완료', status: 'completed' },
      { date: '2026.03', event: '조합설립 준비', status: 'ongoing' },
      { date: '2027.06', event: '사업시행인가 목표', status: 'planned' },
    ],
    detailedProgress: {
      currentStatus: '✅ 특별정비구역 고시(1.19) 🔄 조합 설립인가 접수',
      nextMilestone: '2026.9 조합인가',
      expectedConstruction: '2027.6',
      expectedMoveIn: '2030.6'
    },
    subDistricts: [
      {
        largeName: '시범단지',
        subName: '23구역 (현대아파트 등)',
        location: '이매1동',
        area: '184,500㎡',
        zoning: '제2종일반주거지역',
        totalBudget: '약 2조 1,000억원',
        projectMethod: '관리처분방식',
        constructor: '현대건설(예정)',
        beforeHouseholds: '3,569가구',
        afterHouseholds: '6,049가구'
      },
      {
        largeName: '시범단지',
        subName: 'S6구역 (장안타운4)',
        location: '이매1동',
        area: '15,200㎡',
        zoning: '제2종일반주거지역',
        totalBudget: '약 800억원',
        projectMethod: '관리처분방식',
        constructor: '미정',
        beforeHouseholds: '235가구',
        afterHouseholds: '포함'
      }
    ]
  },
  {
    id: 'saetbyeol',
    name: '샛별마을',
    district: '분당구',
    category: 'bundang',
    status: '특별정비구역 지정 완료',
    progress: 55,
    householdsBefore: '2,777가구',
    householdsAfter: '4,800가구',
    maxFloors: '최대 49층',
    floorAreaRatio: '365%',
    avgContribution31py: '3.5~4.5억 원',
    parkingBefore: '1.05대',
    parkingAfter: '1.4대',
    nearbySchools: ['샛별초', '야탑중'],
    transportInfo: '분당선 야탑역 10분 거리',
    studentProjection: '+22% 예상',
    notes: '대규모 공급 확대',
    timeline: [
      { date: '2025.07', event: '특별정비구역 지정 완료', status: 'completed' },
      { date: '2026.03', event: '사업성 검토', status: 'ongoing' },
      { date: '2027.03', event: '조합설립인가 목표', status: 'planned' },
    ],
    detailedProgress: {
      currentStatus: '✅ 특별정비구역 고시(1.19) 🔄 주민총회 준비',
      nextMilestone: '2026.10 관리처분인가',
      expectedConstruction: '2027.9',
      expectedMoveIn: '2030.9'
    },
    subDistricts: [
      {
        largeName: '샛별마을',
        subName: '31구역 (동성 등)',
        location: '수내1동',
        area: '168,900㎡',
        zoning: '제2종일반주거지역',
        totalBudget: '약 1조 7,500억원',
        projectMethod: '관리처분방식',
        constructor: 'GS건설(예정)',
        beforeHouseholds: '2,777가구',
        afterHouseholds: '4,800가구'
      },
      {
        largeName: '샛별마을',
        subName: 'S4구역 (분당동5)',
        location: '수내1동',
        area: '12,800㎡',
        zoning: '제2종일반주거지역',
        totalBudget: '약 650억원',
        projectMethod: '관리처분방식',
        constructor: '미정',
        beforeHouseholds: '167가구',
        afterHouseholds: '포함'
      }
    ]
  },
  {
    id: 'mokyeon1',
    name: '목련마을1',
    district: '분당구',
    category: 'bundang',
    status: '특별정비구역 지정 완료',
    progress: 50,
    householdsBefore: '1,032가구',
    householdsAfter: '2,475가구',
    maxFloors: '최대 27층',
    floorAreaRatio: '280%',
    avgContribution31py: '2~3억 원',
    parkingBefore: '0.9대',
    parkingAfter: '1.5대',
    nearbySchools: ['목련초', '분당중'],
    transportInfo: 'GTX-C 접근성 양호',
    studentProjection: '+18% 예상',
    notes: '연립주택 특화',
    timeline: [
      { date: '2025.09', event: '특별정비구역 지정 완료', status: 'completed' },
      { date: '2026.03', event: '추진위원회 운영', status: 'ongoing' },
      { date: '2027.01', event: '안전진단 실시 예정', status: 'planned' },
    ],
    detailedProgress: {
      currentStatus: '✅ 특별정비구역 고시(1.19) 🔄 신탁 방식 협의',
      nextMilestone: '2026.11 사업시행인가',
      expectedConstruction: '2027.12',
      expectedMoveIn: '2030.12'
    },
    subDistricts: [
      {
        largeName: '목련마을',
        subName: '6구역 (대원빌라 등)',
        location: '수내2동',
        area: '68,500㎡',
        zoning: '제2종일반주거지역',
        totalBudget: '약 9,800억원',
        projectMethod: '관리처분방식',
        constructor: '대우건설(예정)',
        beforeHouseholds: '1,032가구',
        afterHouseholds: '2,475가구'
      },
      {
        largeName: '목련마을',
        subName: 'S3구역 (목련5)',
        location: '수내2동',
        area: '8,200㎡',
        zoning: '제2종일반주거지역',
        totalBudget: '약 380억원',
        projectMethod: '관리처분방식',
        constructor: '미정',
        beforeHouseholds: '75가구',
        afterHouseholds: '포함'
      }
    ]
  },
  {
    id: 'yangji',
    name: '양지마을',
    district: '분당구',
    category: 'bundang',
    status: '도시계획위 조건부 의결',
    progress: 65,
    householdsBefore: '4,392가구',
    householdsAfter: '6,839가구',
    maxFloors: '최대 37층',
    floorAreaRatio: '360% 이하',
    avgContribution31py: '최대 7억 원',
    parkingBefore: '1.0대',
    parkingAfter: '1.3대',
    nearbySchools: ['양지초', '양지중', '분당고'],
    transportInfo: '분당선 5분 거리',
    studentProjection: '+28% 예상',
    notes: '대형 단지 통합 사업',
    timeline: [
      { date: '2025.11', event: '도시계획위 조건부 의결', status: 'completed' },
      { date: '2026.03', event: '특별정비구역 지정 추진', status: 'ongoing' },
      { date: '2027.09', event: '조합설립인가 목표', status: 'planned' },
    ],
    detailedProgress: {
      currentStatus: '✅ 특별정비구역 고시(1.26) 🔄 내부 조율 (대형 단지 특성)',
      nextMilestone: '2027.3 조합인가',
      expectedConstruction: '2028.3',
      expectedMoveIn: '2031.3'
    },
    subDistricts: [
      {
        largeName: '양지마을',
        subName: '32구역 (금호 등)',
        location: '수내동',
        area: '245,600㎡',
        zoning: '제2종일반주거지역',
        totalBudget: '약 2조 5,200억원',
        projectMethod: '관리처분방식',
        constructor: '삼성물산(예정)',
        beforeHouseholds: '4,392가구',
        afterHouseholds: '6,839가구'
      }
    ]
  },  
];

// 모든 카테고리의 단지를 하나로 합침
export const allComplexes: Complex[] = [...complexes, ...oldtownRedevelopmentComplexes, ...oldtownReconstructionComplexes, ...garohousingComplexes];

export const getComplexById = (id: string): Complex | undefined => {
  return allComplexes.find(c => c.id === id);
};

export const getComplexesByDistrict = (district: string): Complex[] => {
  return allComplexes.filter(c => c.district === district);
};

export const getComplexesByCategory = (category: string): Complex[] => {
  return allComplexes.filter(c => c.category === category);
};

export const getCategoryName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    'bundang': '분당 재건축',
    'oldtown-redevelopment': '원도심 재개발',
    'oldtown-reconstruction': '원도심 재건축',
    'garohousing': '가로주택정비사업'
  };
  return categoryNames[category] || category;
};