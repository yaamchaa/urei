import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { BookOpen, Save, Plus, Trash2, Home, Building, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { adminFetch } from "../adminApi";

// GuidelinePage에서 가져온 기본 데이터
const DEFAULT_PROJECT_TYPES = [
  {
    title: '재건축',
    icon: 'Home',
    color: 'bg-purple-600',
    description: '노후 아파트를 새로 짓는 사업',
    targetArea: '주로 1980~1990년대 건설된 노후 아파트 단지',
    legalBasis: '도시 및 주거환경정비법 제2조 제3호',
    requirements: [
      '건축물 노후도: 준공 후 20년 이상 경과 (조례로 30년 이상 가능)',
      '안전진단 실시: D등급 또는 E등급 판정 필요',
      '주민 동의: 구분소유자 및 의결권의 각 3/4 이상 동의'
    ]
  },
  {
    title: '재개발',
    icon: 'Building',
    color: 'bg-blue-600',
    description: '낡은 건물을 철거하고 새로운 건물을 짓는 사업',
    targetArea: '노후·불량건축물이 밀집한 지역으로 도시기능 회복이 필요한 구역',
    legalBasis: '도시 및 주거환경정비법 제2조 제2호',
    requirements: [
      '정비구역 지정 요건: 노후·불량건축물 수가 전체 건축물의 2/3 이상',
      '주민 동의: 토지등소유자의 3/4 이상 및 토지면적의 1/2 이상 동의',
      '사업성 검토: 재정 및 사업성 분석을 통한 실현가능성 확인'
    ]
  },
  {
    title: '가로주택정비',
    icon: 'Wrench',
    color: 'bg-green-700',
    description: '기존 도로·마을 형태는 유지하면서 주거환경을 개선하는 소규모 정비',
    targetArea: '정비기반시설이 열악한 저층 주거 밀집 지역',
    legalBasis: '빈집 및 소규모주택정비에 관한 특례법 제3조, 시행령·시·도 조례',
    requirements: [
      '기반시설 미비: 도로, 상하수도 등 정비기반시설이 불량한 지역',
      '주민 참여: 주민협의체 구성 및 주민의견 수렴',
      '공공 주도: 지자체가 주도하여 시행하는 경우 많음'
    ]
  }
];

const DEFAULT_RECONSTRUCTION_STEPS = [
  {
    number: 1,
    title: "기본계획 수립",
    description: "시장·군수가 10년 단위로 정비사업의 기본방향 수립",
    duration: "6개월 ~ 1년",
    legalBasis: "도시정비법 제4조",
    responsibleParty: "성남시(신도시정비과)",
    requirements: [
      "정비예정구역 조사",
      "기초조사 및 분석",
      "공청회 및 지방의회 의견청취",
      "도시계획위원회 심의"
    ]
  },
  {
    number: 2,
    title: "정비구역 지정",
    description: "정비가 필요한 구역을 도시·군 관리계획으로 결정",
    duration: "3 ~ 6개월",
    legalBasis: "도시정비법 제8조",
    responsibleParty: "성남시(신도시정비과)",
    requirements: [
      "정비계획 수립",
      "주민공람 및 의견수렴 (14일 이상)",
      "지방의회 의견청취",
      "도시계획위원회 심의",
      "정비구역 지정 고시"
    ]
  },
  {
    number: 3,
    title: "추진위원회 승인",
    description: "주민대표로 구성된 추진위원회 설립 승인",
    duration: "2 ~ 4개월",
    legalBasis: "도시정비법 제13조",
    responsibleParty: "주민(토지등소유자) → 시 승인",
    requirements: [
      "토지등소유자 과반수 동의서 징구",
      "추진위원회 구성",
      "설립인가 신청",
      "시장·군수 승인"
    ]
  },
  {
    number: 4,
    title: "조합 설립",
    description: "정비사업을 시행하기 위한 조합 설립",
    duration: "6개월 ~ 1년",
    legalBasis: "도시정비법 제16조",
    responsibleParty: "조합(토지등소유자) → 시 인가",
    requirements: [
      "조합설립 동의서 징구 (토지등소유자 3/4 이상)",
      "재건축: 구분소유자 3/4 이상 동의",
      "창립총회 개최",
      "조합설립인가 신청",
      "시장·군수 인가",
      "조합등기"
    ]
  },
  {
    number: 5,
    title: "사업시행계획 인가",
    description: "구체적인 사업계획 수립 및 인가",
    duration: "6개월 ~ 1년",
    legalBasis: "도시정비법 제50조",
    responsibleParty: "조합 → 시 인가",
    requirements: [
      "설계자 선정",
      "사업시행계획서 작성",
      "교통영향평가 등 각종 평가",
      "주민공람 (14일 이상)",
      "인가 신청 및 심의",
      "사업시행인가 고시"
    ]
  },
  {
    number: 6,
    title: "관리처분계획 인가",
    description: "권리관계 정리 및 분양계획 수립",
    duration: "4 ~ 6개월",
    legalBasis: "도시정비법 제72조",
    responsibleParty: "조합 → 시 인가",
    requirements: [
      "감정평가 (3개 기관)",
      "관리처분계획 수립",
      "총회 의결 (조합원 2/3 이상)",
      "인가 신청",
      "관리처분인가 고시",
      "이의신청 접수 및 처리 (30일)"
    ]
  },
  {
    number: 7,
    title: "이주 및 철거",
    description: "기존 건축물 철거 및 주민 이주",
    duration: "6개월 ~ 1년",
    legalBasis: "도시정비법 제81조",
    responsibleParty: "조합(시공사)",
    requirements: [
      "이주비 지급",
      "임시거주시설 안내",
      "명도소송 진행 (미이주자)",
      "철거 착수",
      "안전관리"
    ]
  },
  {
    number: 8,
    title: "착공 및 준공",
    description: "건축공사 시작 및 완료 후 입주",
    duration: "2 ~ 3년",
    legalBasis: "건축법, 주택법",
    responsibleParty: "조합(시공사)",
    requirements: [
      "착공신고",
      "건축공사 진행",
      "준공검사",
      "소유권 이전",
      "입주 및 이사",
      "조합해산"
    ]
  }
];

const DEFAULT_REDEVELOPMENT_STEPS = [
  {
    number: 1,
    title: "기본계획 수립",
    description: "시장·군수가 10년 단위로 정비사업의 기본방향 수립",
    duration: "6개월 ~ 1년",
    legalBasis: "도시 및 주거환경정비법 제4조",
    responsibleParty: "성남시(도시정비·신도시정비과 등)",
    requirements: [
      "정비예정구역 조사",
      "기초조사 및 분석",
      "공청회 및 지방의회 의견청취",
      "도시계획위원회 심의",
      "정비기본계획 수립 및 고시"
    ]
  },
  {
    number: 2,
    title: "정비계획 수립 및 정비구역 지정",
    description: "정비가 필요한 구역을 정비계획으로 정하고 정비구역으로 지정",
    duration: "6개월 ~ 2년",
    legalBasis: "도시정비법 제14조, 제15조",
    responsibleParty: "성남시(도시정비과)",
    requirements: [
      "정비계획(안) 수립",
      "주민공람(14일 이상) 및 의견 수렴",
      "지방의회 의견청취",
      "도시·군계획위원회 심의",
      "정비계획 결정 및 정비구역 고시"
    ]
  },
  {
    number: 3,
    title: "추진위원회 구성·승인",
    description: "주민대표로 구성된 재개발 추진위원회를 구성·승인",
    duration: "6개월 ~ 1년",
    legalBasis: "도시정비법 제13조",
    responsibleParty: "토지등소유자 → 시 승인",
    requirements: [
      "토지등소유자 과반수 동의서 징구",
      "추진위원회 구성(위원, 회장 등)",
      "설립 승인 신청",
      "시장·군수 승인 및 공고"
    ]
  },
  {
    number: 4,
    title: "조합 설립",
    description: "정비사업을 시행할 조합 설립",
    duration: "1 ~ 2년",
    legalBasis: "도시정비법 제16조",
    responsibleParty: "조합(토지등소유자) → 시 인가",
    requirements: [
      "토지등소유자 3/4 이상 동의서 징구",
      "창립총회 개최",
      "조합설립인가 신청",
      "시장·군수 인가",
      "조합등기 및 사업시행자 등록"
    ]
  },
  {
    number: 5,
    title: "사업시행계획 인가",
    description: "건물 배치·세대수·금융·이주계획 등 구체 사업계획 승인",
    duration: "1 ~ 1.5년",
    legalBasis: "도시정비법 제50조, 제51조",
    responsibleParty: "조합 → 시 인가",
    requirements: [
      "설계·용역·시공사 선정",
      "사업시행계획서 작성(용적률, 세대, 이주·보상, 공공기여 등)",
      "각종 평가(교통·환경·안전 등)",
      "주민공람(14일 이상)",
      "사업시행인가 신청 및 심의",
      "사업시행인가 고시"
    ]
  },
  {
    number: 6,
    title: "관리처분계획 인가",
    description: "조합원별 분양·분담금·권리관계를 정리하는 계획 승인",
    duration: "1 ~ 1.5년",
    legalBasis: "도시정비법 제74조",
    responsibleParty: "조합 → 시 인가",
    requirements: [
      "3개 감정평가기관 선정 및 종전·종후 자산감정",
      "관리처분계획(분양구조·분담금·비례율) 수립",
      "조합원 총회 의결 (분담금 통지 후 1개월 이상 전)",
      "관리처분계획 인가 신청",
      "관리처분인가 고시",
      "이의신청 접수 및 처리(30일 이내)"
    ]
  },
  {
    number: 7,
    title: "이주 및 철거",
    description: "기존 건물·주택 철거 및 주민 이주",
    duration: "6개월 ~ 1년 이상",
    legalBasis: "도시정비법 제81조",
    responsibleParty: "조합(시공사)",
    requirements: [
      "이주비 지급, 순환·임시 주거 안내",
      "명도소송 진행(미이주자)",
      "철거 착수 및 공사관리",
      "안전관리 및 환경조치"
    ]
  },
  {
    number: 8,
    title: "착공 및 준공",
    description: "신축 건축공사 착공 후 준공·입주",
    duration: "2 ~ 3년 이상",
    legalBasis: "건축법, 주택법, 도시정비법",
    responsibleParty: "조합(시공사)",
    requirements: [
      "착공신고",
      "건축공사 진행(지하 → 지상 → 외장·마감·조경 등)",
      "준공검사 및 통과",
      "소유권 이전(분합동·분양권 이전 등)",
      "입주 및 이사",
      "조합 해산 및 정산"
    ]
  }
];

const DEFAULT_STREET_HOUSING_STEPS = [
  {
    number: 1,
    title: "사업대상·요건 확인",
    description: "사업이 가능한지(구역·노후도·세대·동의율 등)를 확인",
    duration: "1~3개월",
    legalBasis: "빈집 및 소규모주택정비에 관한 특례법 제3조, 시행령·시·도 조례",
    responsibleParty: "토지·주택소유자, 주민대표, 구청·지자체",
    requirements: [
      "1만㎡ 미만 가로구역 확인",
      "노후·불량건축물 수 60~2/3 이상인지 확인",
      "전체 세대 10호(단독주택) 또는 20세대 이상인지 확인",
      "구역을 둘러싼 도로 6m 이상인지, 통과도로(4m 이하 도로)가 없는지 확인",
      "토지등소유자 80% 이상 동의 가능 여부 사전 검토"
    ]
  },
  {
    number: 2,
    title: "주민대표회의 구성·사업성 검토",
    description: "준비를 위한 '주민대표회의/리더' 구성",
    duration: "1~4개월",
    legalBasis: "특례법 및 지자체 가이드라인",
    responsibleParty: "주민대표, 조합추진단, 구청·LH 등 상담",
    requirements: [
      "주민대표회의 구성(조합 추진단, 주민 리더 등)",
      "초기 사업성·용적률·주택 규모 검토",
      "주민 설명회, 설문조사, 히어링",
      "사업 방식 선정(자율형, 협동조합형, LH·공공참여형 등)"
    ]
  },
  {
    number: 3,
    title: "조합 설립 (또는 조합형 구조 구성)",
    description: "추진위원회 없이 바로 조합(또는 조합형 공동사업체)을 설립",
    duration: "3~8개월",
    legalBasis: "특례법 제17조, 시행령 관련 규정",
    responsibleParty: "토지·주택소유자 → 구청장 인가",
    requirements: [
      "토지등소유자 80% 이상 및 토지면적 2/3 이상 동의서 징구",
      "조합(또는 조합형) 정관·사업계획서 작성",
      "창립총회(또는 설립총회) 개최",
      "구청에 조합설립(인가) 신청",
      "구청장 인가 및 고시"
    ]
  },
  {
    number: 4,
    title: "설계·건축심의 및 공공참여 협의",
    description: "설계안·주택배치·기반시설·임대(공공참여형) 등을 확정",
    duration: "3~8개월",
    legalBasis: "건축법, 주택법, 특례법, 지자체 조례",
    responsibleParty: "조합(또는 사업주체) → 구청·도시계획위원회",
    requirements: [
      "설계사·건축가·환경·조경 설계사 선정",
      "건축·배치·주택규모(공공임대 포함) 설계 수립",
      "건축·도시·교통·환경 등 관련 심의",
      "공공참여형의 경우 LH·지자체와 공공임대·기반시설 협의",
      "소규모 심의 또는 건축심의 통과"
    ]
  },
  {
    number: 5,
    title: "관리처분계획 및 사업시행계획 수립·인가",
    description: "조합원별 분양·분담금을 포함한 관리처분계획과 사업시행계획을 묶어서 인가",
    duration: "4~8개월",
    legalBasis: "도시정비법 및 특례법 관련 규정, 지자체 업무 처리지침",
    responsibleParty: "조합(주체) → 구청·지자체 인가",
    requirements: [
      "감정평가(종전·종후 자산평가)",
      "관리처분계획(분양구조·분담금·비례율) 수립",
      "관리처분계획 통지 및 조합원 총회 의결",
      "사업시행계획인가(관리처분계획 포함) 신청",
      "주민공람·의견수렴",
      "사업시행인가(관리처분포함) 고시"
    ]
  },
  {
    number: 6,
    title: "이주·철거 및 공사 준비",
    description: "기존 건물 철거와 주민 이주, 공사장 정리",
    duration: "3~6개월",
    legalBasis: "도시정비법 관련 정비사업 공통 규정",
    responsibleParty: "조합(주체) + 시공사·이주대행업체",
    requirements: [
      "이주비·임시 주거비 지급",
      "명도·이주 협의",
      "미이주자에 대한 절차(소송·관계법률 활용)",
      "기존 건물 철거 및 공사장 조성",
      "건설사 계약·공사준비 회의"
    ]
  },
  {
    number: 7,
    title: "착공 및 준공",
    description: "신축 주택을 건설·완료한 뒤 입주",
    duration: "1.5~3년",
    legalBasis: "건축법, 주택법, 특례법",
    responsibleParty: "조합(주체) + 시공사",
    requirements: [
      "착공신고",
      "지하·지상 구조·마감·기계·전기·환경·조경 공사 진행",
      "준공검사 및 통과",
      "소유권 이전(분양권·분합동 등)",
      "입주 및 이사",
      "설비·편의시설 운영 준비"
    ]
  },
  {
    number: 8,
    title: "입주·청산 및 조합 해산",
    description: "입주 이후 권리·금전 정산 및 조합 해산",
    duration: "2~6개월",
    legalBasis: "특례법 및 도시정비법 관련 해산 규정",
    responsibleParty: "조합",
    requirements: [
      "분담금·이주비·분양금 정산",
      "조합원 권익 정리",
      "조합 해산 결의 및 해산등기",
      "건축물 및 공공시설 인수인계(필요 시)"
    ]
  }
];

// GuidelinePage의 전체 FAQ 데이터 (8개)
const DEFAULT_FAQS = [
  {
    category: "사업 기본",
    question: "재개발과 재건축의 차이는 무엇인가요?",
    answer: `재개발과 재건축의 주요 차이점은 다음과 같습니다:

【재개발】
• 대상: 정비기반시설(도로, 상하수도 등)이 열악한 지역
• 주요 지역: 단독·다가구 주택 밀집 지역, 노후 상가 지역
• 특징: 기반시설 설치 + 건물 신축
• 사업성: 토지 소유자가 많아 합의가 어려움
• 예시: 수정구 신흥2동, 중원구 금광1동

【재건축】
• 대상: 기반시설은 양호하나 건축물이 노후된 지역
• 주요 지역: 1980~1990년대 아파트 단지
• 특징: 안전진단 필수, 건물만 신축
• 사업성: 아파트 단지라 합의가 상대적으로 용이
• 예시: 분당구 이매동, 서현동, 정자동 아파트

가장 큰 차이는 안전진단 실시 여부와 기반시설 정비 포함 여부입니다.`
  },
  {
    category: "사업 기본",
    question: "우리 지역이 정비사업 대상인지 어떻게 알 수 있나요?",
    answer: `다음 방법으로 확인할 수 있습니다:

1. 【성남시 정비본계획 확인】
   - 성남시 홈페이지 > 도시계획 > 정비사업
   - 10년 단위로 수립된 기본계획에서 정비예정구역 확인

2. 【정비구역 지정 현황 확인】
   - 성남시청 신도시정비과 방문 또는 전화 문의
   - 도시계획정보시스템(UPIS)에서 온라인 조회

3. 【자가 진단】
   재개발 대상 가능성이 높은 경우:
   - 건축물 노후도: 준공 후 20년 이상 경과
   - 정비기반시설: 도로폭 4m 미만, 상하수도 노후
   - 건물 밀집도: 노후·불량 건축물이 전체의 2/3 이상

   재건축 대상 가능성이 높은 경우:
   - 아파트 준공 후 30년 이상 경과
   - 안전진단 D등급 또는 E등급

본 시스템의 대시보드에서도 확인 가능합니다.`
  },
  {
    category: "비용 및 분담금",
    question: "분담금은 어떻게 계산되나요?",
    answer: `분담금은 다음과 같이 계산됩니다:

【분담금 계산 공식】
분담금 = (신규 아파트 분양가) - (종전 자산 평가액)

• 플러스 분담금: 신규 분양가가 더 높은 경우 추가 부담
  예) 종전 자산 2억 원 → 신규 분양가 4억 원 = 2억 원 분담

• 마이너스 분담금: 종전 자산이 더 높은 경우 환급
  예) 종전 자산 5억 원 → 신규 분양가 3억 원 = 2억 원 환급

【평균 분담금 참고】
- 수도권 재개발: 세대당 평균 5,000만 원 ~ 2억 원
- 수도권 재건축: 세대당 평균 1억 원 ~ 3억 원
(지역 및 시점에 따라 큰 차이 발생)

정확한 분담금은 관리처분계획 수립 시 감정평가를 통해 확정됩니다.`
  },
  {
    category: "비용 및 분담금",
    question: "분담금을 낼 여유가 없으면 어떻게 하나요?",
    answer: `분담금 부담을 줄일 수 있는 방법들이 있습니다:

【1. 현금 청산 선택】
- 새 아파트를 받지 않고 현금으로 정산받는 방법
- 종전 자산 평가액을 현금으로 받고 사업에서 제외
- 이사 비용 등은 추가 지급

【2. 소형 평형 선택】
- 보유 평형보다 작은 평형을 선택하여 분담금 절감
- 예) 30평 보유 → 20평 선택 시 분담금 감소

【3. 금융 지원 활용】
- 조합 협약 금융기관의 분담금 대출 (이자 우대)
- 주택도시보증공사(HUG) 보증을 통한 대출
- 대출 한도: 일반적으로 분담금의 80~90%
- 이자율: 연 3~5% (시중은행 대비 우대)

【4. 분할 납부】
- 조합과 협의하여 분담금을 분할 납부
- 일반적으로 2~4회 분할 가능`
  },
  {
    category: "권리 및 동의",
    question: "정비사업에 참여하려면 어떻게 해야 하나요?",
    answer: `정비사업 참여 방법은 귀하의 상황에 따라 다릅니다:

【토지·건물 소유자인 경우】
1. 추진위원회 단계
   - 추진위원회 구성 동의서 제출
   - 토지등소유자 과반수 동의 필요

2. 조합설립 단계
   - 조합설립 동의서 제출
   - 토지등소유자 3/4 이상 동의 필요
   - 창립총회 참석 및 조합원 가입

3. 조합원 자격 유지
   - 조합원은 신규 아파트 우선 분양권 취득
   - 조합 총회 참석 및 의결권 행사
   - 관리처분계획 동의 (조합원 2/3 이상 필요)

【세입자인 경우】
- 직접 조합원이 될 수는 없음
- 다만, 다음 권리는 보장됨:
  1. 이주비 지원 (주거용 건축물의 경우)
  2. 임대주택 우선 입주권 (일정 조건 충족 시)
  3. 손실보상금 청구권`
  },
  {
    category: "권리 및 동의",
    question: "세입자도 보상을 받을 수 있나요?",
    answer: `네, 세입자도 일정 요건을 충족하면 보상을 받을 수 있습니다:

【주거용 건축물 세입자】
1. 이주비 지원
   - 주거이전비: 가구당 약 1,200만 원 (4인 가족 기준)
   - 가재도구 이사비: 실비 (통상 50~100만 원)
   - 지급 시기: 명도 완료 시

2. 요건
   - 사업시행인가 고시일 이전부터 거주
   - 주민등록이 되어 있을 것
   - 실제 거주하고 있을 것

3. 임대주택 공급
   - 공공임대주택 우선 공급 (일정 소득 이하)
   - 조합이 건설하는 임대주택 우선 입주

【상가 세입자】
1. 영업 손실 보상
   - 휴업 기간 동안의 영업 손실
   - 이전 비용
   - 요건: 사업시행인가 고시일 3개월 이전부터 영업

보상 내용은 관리처분계획에서 구체적으로 확정되며, 불만이 있을 경우 이의신청이 가능합니다.`
  },
  {
    category: "이주 및 생활",
    question: "재건축 기간은 총 얼마나 걸리나요?",
    answer: `재건축은 장기간이 소요되며, 단계별 기간은 다음과 같습니다:

【표준 소요 기간】
1. 기본계획 수립: 6개월 ~ 1년
2. 정비구역 지정: 3 ~ 6개월
3. 추진위원회 승인: 2 ~ 4개월
4. 조합 설립: 6개월 ~ 1년
5. 사업시행계획 인가: 6개월 ~ 1년
6. 관리처분계획 인가: 4 ~ 6개월
7. 이주 및 철거: 6개월 ~ 1년
8. 착공 및 준공: 2 ~ 3년

【총 소요 기간】
- 순조로운 경우: 5 ~ 7년
- 평균적인 경우: 7 ~ 10년
- 지연되는 경우: 10년 이상

【지연 요인】
1. 주민 간 갈등 및 소송: +1~3년
2. 경기 침체로 인한 사업성 악화: +1~2년
3. 각종 인허가 지연: +6개월~1년
4. 문화재 발굴 등 예상치 못한 사안: +6개월~1년`
  },
  {
    category: "이주 및 생활",
    question: "정비사업 중 주거는 어떻게 해결하나요?",
    answer: `정비사업으로 인한 이주 시 다음과 같은 주거 지원이 제공됩니다:

【1. 임시거주시설 제공】
조합이 직접 임시거주시설을 마련하는 경우:
- 인근 지역에 임대주택 또는 아파트 단기 임차
- 비용: 조합이 부담 또는 조합원에게 저렴하게 제공
- 기간: 이주 시작 ~ 입주 시까지 (통상 2~3년)

【2. 이주비 지원】
자력으로 임시거처를 마련하는 경우:
- 주거이전비: 세대당 약 1,200만 원 (4인 가족 기준)
- 주택 임차 자금: 별도 대출 지원 (HUG 보증)
- 이사 비용: 실비 지급

【3. 공공임대주택 알선】
- LH공사 또는 성남도시개발공사 임대주택
- 저소득층 우선 공급
- 월 임대료: 시세의 30~50% 수준

【4. 재정착 지원】
- 신규 아파트 우선 입주권
- 입주 전 중도금 대출 지원 (HUG 보증)
- 이사 비용 추가 지원`
  },
  {
    category: "절차 및 제도",
    question: "안전진단은 무엇이고 어떻게 받나요?",
    answer: `안전진단은 재건축사업의 필수 절차입니다:

【안전진단이란?】
노후 건축물의 구조적 안전성과 주거환경을 종합적으로 평가하는 절차입니다.
- 대상: 재건축 추진 아파트 단지
- 목적: 재건축 필요성 판단
- 의무 사항: 재건축은 반드시 안전진단 필요

【안전진단 절차】
1. 추진위원회 구성
2. 시청에 안전진단 신청
3. 안전진단 전문기관 선정 (3개 기관)
4. 1차 안전진단 실시
5. 1차 결과가 D등급 이하인 경우 → 2차 진단
6. 2차 정밀안전진단
7. 최종 등급 판정

【안전진단 등급】
- A등급: 양호 (재건축 불가)
- B등급: 보통 (재건축 불가)
- C등급: 미흡 (조건부 재건축 가능)
- D등급: 불량 (재건축 가능)
- E등급: 불량 (재건축 가능)

【평가 항목】
1. 구조 안전성 (50%)
2. 건축 마감 (20%)
3. 설비 노후도 (20%)
4. 주거환경 (10%)

【비용 및 기간】
- 비용: 세대당 30~50만 원 (조합 부담)
- 기간: 6개월 ~ 1년`
  },
  {
    category: "절차 및 제도",
    question: "관리처분계획이 무엇인가요?",
    answer: `관리처분계획은 정비사업에서 가장 중요한 단계 중 하나입니다:

【관리처분계획이란?】
종전 재산과 신규 아파트를 어떻게 배분할지 결정하는 핵심 계획입니다.
- 시기: 사업시행계획 인가 후, 착공 전
- 목적: 조합원별 권리 및 의무 확정
- 효력: 시장·군수 인가 받으면 법적 효력 발생

【주요 내용】
1. 분양 설계
   - 평형별 분양 계획
   - 동·호수 배치

2. 종전 자산 평가
   - 토지 평가액 (감정평가 3개 평균)
   - 건물 평가액

3. 신규 아파트 분양가
   - 조합원 분양가 (원가 기준)
   - 일반분양가 (시장가 기준)

4. 분담금 산정
   - 조합원별 분담금 또는 청산금
   - 납부 방법 및 일정

【절차】
1. 감정평가 (3개 기관)
2. 관리처분계획(안) 작성
3. 조합원 열람 (14일)
4. 조합 총회 의결 (조합원 2/3 이상 동의)
5. 시장·군수 인가 신청
6. 인가 고시
7. 이의신청 접수 (30일)

관리처분계획이 확정되면 조합원의 권리와 의무가 법적으로 확정되므로, 반드시 내용을 꼼꼼히 확인해야 합니다.`
  },
  {
    category: "분양 및 입주",
    question: "조합원 분양과 일반분양의 차이는 무엇인가요?",
    answer: `조합원 분양과 일반분양은 다음과 같이 구분됩니다:

【조합원 분양】
대상: 종전 토지·건물 소유자로 조합에 가입한 자

가격:
- 원가 기준 (건축비 + 각종 부담금)
- 일반분양보다 저렴
- 분담금 발생 가능 (종전 자산 평가액 차감)

권리:
- 우선 분양권 (법적으로 보장)
- 동·호수 선택 우선권
- 조합 총회 의결권

예시:
- 종전 자산: 1.5억 원
- 신규 30평: 원가 3억 원
- 분담금: 1.5억 원

【일반분양(보류지)】
대상: 외부 일반인

가격:
- 시장가 기준 (주변 시세 반영)
- 조합원 분양보다 높음
- 분담금 없음 (전액 신규 납부)

권리:
- 청약 자격 요건 충족 필요
- 청약 경쟁 (추첨 또는 가점제)
- 당첨 시 분양권 취득

예시:
- 신규 30평: 시장가 4억 원
- 계약금: 4,000만 원 (10%)
- 중도금: 2억 원 (50%, 6회 분납)
- 잔금: 1.6억 원 (40%, 입주 시)

일반분양은 청약 경쟁이 치열할 수 있으며, 조합원 분양은 확정적이라는 차이가 있습니다.`
  },
  {
    category: "기타",
    question: "정비사업 중 분쟁이 발생하면 어떻게 하나요?",
    answer: `정비사업 중 분쟁은 흔히 발생하며, 다음과 같이 해결할 수 있습니다:

【주요 분쟁 유형】
1. 조합 운영 관련
   - 조합장·임원 선출 무효
   - 총회 결의 무효
   - 횡령·배임 의혹

2. 재산 평가 관련
   - 종전 자산 평가액 불만
   - 분담금 산정 이의

3. 분양 관련
   - 동·호수 배정 불만
   - 평형 선택 제한

【분쟁 해결 절차】

1단계: 자체 해결
- 조합 또는 추진위에 이의 제기
- 조합원 간 협의 및 조정
- 기간: 1~2개월

2단계: 시청 민원
- 성남시 신도시정비과에 민원 제기
- 시청의 조사 및 시정 명령
- 기간: 1~3개월

3단계: 조정·중재
- 한국토지주택공사(LH) 분쟁조정위원회
- 대한법률구조공단 무료 상담
- 기간: 2~4개월

4단계: 행정심판
- 시장·군수 처분에 불복 시
- 행정심판위원회 심판 청구
- 기간: 6개월~1년

5단계: 소송
- 민사소송: 손해배상, 계약 해제 등
- 행정소송: 인가 취소, 처분 무효 등
- 기간: 1~3년

분쟁은 초기에 해결하는 것이 중요하며, 소송은 최후의 수단으로 고려해야 합니다.`
  }
];

const DEFAULT_GLOSSARY = [
  { term: "안전진단", definition: "건축물의 구조안전성, 설비노후도 등을 종합적으로 평가하는 절차" },
  { term: "정비계획", definition: "재건축 구역의 범위, 용도, 건축물 배치 등을 정하는 계획" },
  { term: "관리처분계획", definition: "조합원의 분담금, 동호수 배정 등 권리와 의무를 확정하는 계획" },
  { term: "분담금", definition: "신규 주택 취득을 위해 조합원이 추가로 부담해야 하는 금액" },
  { term: "환급금", definition: "기존 주택 평가액이 신규 분양가보다 높을 경우 돌려받는 금액" },
  { term: "이주비", definition: "재건축 기간 동안 임시 거주를 위해 필요한 비용" },
  { term: "DSR", definition: "총부채원리금상환비율. 소득 대비 대출 상환액의 비율을 제한하는 규제" },
  { term: "초과이익환수제", definition: "재건축으로 발생한 이익 중 일정 금액을 초과하는 부분을 환수하는 제도" },
  { term: "추진위원회", definition: "조합 설립 이전 사업 준비 및 타당성 검토를 수행하는 주민대표 조직" },
  { term: "토지등소유자", definition: "정비구역 내 토지 또는 건축물의 소유자 및 그 지상권자" },
  { term: "보류지", definition: "사업비 충당을 위해 일반인에게 분양하는 물량" },
  { term: "HUG", definition: "주택도시보증공사. 재건축 관련 대출 보증 및 분쟁 조정 역할" }
];

export function GuideManagementPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 선도지구 정보 상태
  const [leadZoneData, setLeadZoneData] = useState<any>(null);

  // 사업유형 상태
  const [projectTypes, setProjectTypes] = useState<any[]>([]);

  // 진행단계 상태
  const [reconstructionSteps, setReconstructionSteps] = useState<any[]>([]);
  const [originalReconstructionSteps, setOriginalReconstructionSteps] = useState<any[]>([]);
  const [redevelopmentSteps, setRedevelopmentSteps] = useState<any[]>([]);
  const [streetHousingSteps, setStreetHousingSteps] = useState<any[]>([]);

  // FAQ 상태
  const [faqs, setFaqs] = useState<any[]>([]);

  // 용어사전 상태
  const [glossary, setGlossary] = useState<any[]>([]);

  // 총 소요 기간 상태 (카테고리별)
  const [totalDurations, setTotalDurations] = useState<{
    bundang: string;
    'oldtown-redevelopment': string;
    'oldtown-reconstruction': string;
    garohousing: string;
  }>({
    bundang: '순조로운 경우 5-7년, 평균적으로 7-10년, 지연 시 10년 이상 소요될 수 있습니다.',
    'oldtown-redevelopment': '순조로운 경우 7-9년, 평균적으로 9-12년, 정체·분쟁·금융 문제 시 12년 이상이 소요될 수 있습니다.',
    'oldtown-reconstruction': '순조로운 경우 5-7년, 평균적으로 7-10년, 지연 시 10년 이상 소요될 수 있습니다.',
    garohousing: '일반 가로주택정비사업은 평균 3-5년이 소요되는 것이 많고, 공공참여형·LH 협력형도 4-6년 내외로 보는 경우가 일반적입니다.'
  });

  useEffect(() => {
    loadGuideData();
  }, []);

  const loadGuideData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/guide-content`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLeadZoneData(data.leadZone || null);
        // 서버 데이터가 없으면 GuidelinePage의 기본값 사용
        setProjectTypes(data.projectTypes && data.projectTypes.length > 0 ? data.projectTypes : DEFAULT_PROJECT_TYPES);
        setReconstructionSteps(data.reconstructionSteps && data.reconstructionSteps.length > 0 ? data.reconstructionSteps : DEFAULT_RECONSTRUCTION_STEPS);
        setOriginalReconstructionSteps(data.originalReconstructionSteps && data.originalReconstructionSteps.length > 0 ? data.originalReconstructionSteps : DEFAULT_RECONSTRUCTION_STEPS);
        setRedevelopmentSteps(data.redevelopmentSteps && data.redevelopmentSteps.length > 0 ? data.redevelopmentSteps : DEFAULT_REDEVELOPMENT_STEPS);
        setStreetHousingSteps(data.streetHousingSteps && data.streetHousingSteps.length > 0 ? data.streetHousingSteps : DEFAULT_STREET_HOUSING_STEPS);
        setFaqs(data.faqs && data.faqs.length > 0 ? data.faqs : DEFAULT_FAQS);
        setGlossary(data.glossary && data.glossary.length > 0 ? data.glossary : DEFAULT_GLOSSARY);

        // 총 소요 기간 로드
        if (data.totalDurations) {
          setTotalDurations(data.totalDurations);
        }
      }
    } catch (error) {
      console.error("가이드 데이터 로드 실패:", error);
      // 오류 발생 시에도 기본값 사용
      setProjectTypes(DEFAULT_PROJECT_TYPES);
      setReconstructionSteps(DEFAULT_RECONSTRUCTION_STEPS);
      setOriginalReconstructionSteps(DEFAULT_RECONSTRUCTION_STEPS);
      setRedevelopmentSteps(DEFAULT_REDEVELOPMENT_STEPS);
      setStreetHousingSteps(DEFAULT_STREET_HOUSING_STEPS);
      setFaqs(DEFAULT_FAQS);
      setGlossary(DEFAULT_GLOSSARY);
    } finally {
      setLoading(false);
    }
  };

  const saveGuideData = async (section: string, data: any) => {
    setSaving(true);
    try {
      const response = await adminFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/guide-content`,
        {
          method: "PUT",
          body: JSON.stringify({ section, data }),
        }
      );

      if (response.ok) {
        // 관리자 활동 로그 기록
        if (user?.complexId === "admin" && user?.memberId) {
          await adminFetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/logs`,
            {
              method: 'POST',
              body: JSON.stringify({
                adminId: user.memberId,
                adminName: user.name,
                action: "update_guide",
                target: section,
                details: "가이드 콘텐츠 수정"
              })
            }
          );
        }
        alert("✅ 저장되었습니다!");
        await loadGuideData();
      } else {
        alert("❌ 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert("❌ 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>가이드 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="가이드 콘텐츠를 관리합니다" />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">가이드 관리</h1>
        <p className="text-gray-600 mt-2">선도지구 정보, 사업유형, 진행단계, FAQ, 용어사전을 관리합니다</p>
      </div>

      <Tabs defaultValue="lead-zone" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">

          <TabsTrigger value="project-types">사업유형</TabsTrigger>
          <TabsTrigger value="steps">진행단계</TabsTrigger>
          <TabsTrigger value="duration">총 소요 기간</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="glossary">용어사전</TabsTrigger>
        </TabsList>
        
        {/* 사업유형 관리 */}
        <TabsContent value="project-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>사업유형 관리</span>
                <Button
                  onClick={() => {
                    setProjectTypes([...projectTypes, {
                      title: "",
                      icon: "Home",
                      color: "bg-purple-600",
                      description: "",
                      targetArea: "",
                      legalBasis: "",
                      requirements: []
                    }]);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  사업유형 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectTypes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  등록된 사업유형이 없습니다. '사업유형 추가' 버튼을 클릭하여 새 사업유형을 추가하세요.
                </p>
              ) : (
                <>
                  {projectTypes.map((item: any, index: number) => (
                    <Card key={index} className="bg-gray-50 border-2">
                      <CardContent className="py-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`pt-title-${index}`}>사업유형 제목</Label>
                                <Input
                                  id={`pt-title-${index}`}
                                  value={item.title}
                                  onChange={(e) => {
                                    const updated = [...projectTypes];
                                    updated[index].title = e.target.value;
                                    setProjectTypes(updated);
                                  }}
                                  placeholder="예: 재건축, 재개발, 가로주택정비"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`pt-icon-${index}`}>아이콘</Label>
                                <Select
                                  value={item.icon}
                                  onValueChange={(value) => {
                                    const updated = [...projectTypes];
                                    updated[index].icon = value;
                                    setProjectTypes(updated);
                                  }}
                                >
                                  <SelectTrigger id={`pt-icon-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Home">Home (집)</SelectItem>
                                    <SelectItem value="Building">Building (빌딩)</SelectItem>
                                    <SelectItem value="Wrench">Wrench (렌치)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`pt-color-${index}`}>색상</Label>
                              <Select
                                value={item.color}
                                onValueChange={(value) => {
                                  const updated = [...projectTypes];
                                  updated[index].color = value;
                                  setProjectTypes(updated);
                                }}
                              >
                                <SelectTrigger id={`pt-color-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bg-purple-600">보라색</SelectItem>
                                  <SelectItem value="bg-blue-600">파란색</SelectItem>
                                  <SelectItem value="bg-green-600">초록색</SelectItem>
                                  <SelectItem value="bg-red-600">빨간색</SelectItem>
                                  <SelectItem value="bg-yellow-600">노란색</SelectItem>
                                  <SelectItem value="bg-indigo-600">남색</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`pt-description-${index}`}>설명</Label>
                              <Input
                                id={`pt-description-${index}`}
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...projectTypes];
                                  updated[index].description = e.target.value;
                                  setProjectTypes(updated);
                                }}
                                placeholder="사업유형에 대한 간단한 설명"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`pt-targetArea-${index}`}>대상지역</Label>
                              <Textarea
                                id={`pt-targetArea-${index}`}
                                value={item.targetArea}
                                onChange={(e) => {
                                  const updated = [...projectTypes];
                                  updated[index].targetArea = e.target.value;
                                  setProjectTypes(updated);
                                }}
                                placeholder="사업유형의 대상이 되는 지역"
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`pt-legalBasis-${index}`}>법적 근거</Label>
                              <Input
                                id={`pt-legalBasis-${index}`}
                                value={item.legalBasis}
                                onChange={(e) => {
                                  const updated = [...projectTypes];
                                  updated[index].legalBasis = e.target.value;
                                  setProjectTypes(updated);
                                }}
                                placeholder="예: 도시 및 주거환경정비법 제2조 제3호"
                              />
                            </div>
                            <div>
                              <Label>요건 및 조건</Label>
                              <div className="space-y-2 mt-2">
                                {(item.requirements || []).map((req: string, reqIdx: number) => (
                                  <div key={reqIdx} className="flex gap-2">
                                    <Input
                                      value={req}
                                      onChange={(e) => {
                                        const updated = [...projectTypes];
                                        updated[index].requirements[reqIdx] = e.target.value;
                                        setProjectTypes(updated);
                                      }}
                                      placeholder="요건 입력"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...projectTypes];
                                        updated[index].requirements = updated[index].requirements.filter((_: any, i: number) => i !== reqIdx);
                                        setProjectTypes(updated);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...projectTypes];
                                    if (!updated[index].requirements) {
                                      updated[index].requirements = [];
                                    }
                                    updated[index].requirements.push("");
                                    setProjectTypes(updated);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  요건 추가
                                </Button>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const updated = projectTypes.filter((_: any, i: number) => i !== index);
                              setProjectTypes(updated);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => saveGuideData("projectTypes", projectTypes)}
                      disabled={saving}
                      size="lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 진행단계 관리 */}
        <TabsContent value="steps" className="space-y-6">
          <Tabs defaultValue="bundang-reconstruction" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bundang-reconstruction">분당재건축</TabsTrigger>
              <TabsTrigger value="original-redevelopment">원도심재개발</TabsTrigger>
              <TabsTrigger value="original-reconstruction">원도심 재건축</TabsTrigger>
              <TabsTrigger value="street-housing">가로주택정비</TabsTrigger>
            </TabsList>

            {/* 분당재건축 진행단계 */}
            <TabsContent value="bundang-reconstruction">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>분당재건축 진행단계 관리</span>
                    <Button
                      onClick={() => {
                        const nextNum = reconstructionSteps.length + 1;
                        setReconstructionSteps([...reconstructionSteps, {
                          number: nextNum,
                          title: "",
                          description: "",
                          duration: "",
                          legalBasis: "",
                          responsibleParty: "",
                          requirements: []
                        }]);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      단계 추가
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reconstructionSteps.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      등록된 단계가 없습니다. '단계 추가' 버튼을 클릭하여 새 단계를 추가하세요.
                    </p>
                  ) : (
                    <>
                      {reconstructionSteps.map((step: any, index: number) => (
                        <Card key={index} className="bg-blue-50 border-2">
                          <CardContent className="py-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>단계 번호</Label>
                                    <Input
                                      type="number"
                                      value={step.number}
                                      onChange={(e) => {
                                        const updated = [...reconstructionSteps];
                                        updated[index].number = parseInt(e.target.value);
                                        setReconstructionSteps(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label>단계 제목</Label>
                                    <Input
                                      value={step.title}
                                      onChange={(e) => {
                                        const updated = [...reconstructionSteps];
                                        updated[index].title = e.target.value;
                                        setReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 기본계획 수립"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>설명</Label>
                                  <Textarea
                                    value={step.description}
                                    onChange={(e) => {
                                      const updated = [...reconstructionSteps];
                                      updated[index].description = e.target.value;
                                      setReconstructionSteps(updated);
                                    }}
                                    placeholder="단계에 대한 설명"
                                    rows={2}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label>소요기간</Label>
                                    <Input
                                      value={step.duration}
                                      onChange={(e) => {
                                        const updated = [...reconstructionSteps];
                                        updated[index].duration = e.target.value;
                                        setReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 6개월 ~ 1년"
                                    />
                                  </div>
                                  <div>
                                    <Label>법적 근거</Label>
                                    <Input
                                      value={step.legalBasis}
                                      onChange={(e) => {
                                        const updated = [...reconstructionSteps];
                                        updated[index].legalBasis = e.target.value;
                                        setReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 도시정비법 제4조"
                                    />
                                  </div>
                                  <div>
                                    <Label>담당주체</Label>
                                    <Input
                                      value={step.responsibleParty}
                                      onChange={(e) => {
                                        const updated = [...reconstructionSteps];
                                        updated[index].responsibleParty = e.target.value;
                                        setReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 성남시"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>주요 내용 및 요건</Label>
                                  <div className="space-y-2 mt-2">
                                    {(step.requirements || []).map((req: string, reqIdx: number) => (
                                      <div key={reqIdx} className="flex gap-2">
                                        <Input
                                          value={req}
                                          onChange={(e) => {
                                            const updated = [...reconstructionSteps];
                                            updated[index].requirements[reqIdx] = e.target.value;
                                            setReconstructionSteps(updated);
                                          }}
                                          placeholder="요건 입력"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updated = [...reconstructionSteps];
                                            updated[index].requirements = updated[index].requirements.filter((_: any, i: number) => i !== reqIdx);
                                            setReconstructionSteps(updated);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...reconstructionSteps];
                                        if (!updated[index].requirements) {
                                          updated[index].requirements = [];
                                        }
                                        updated[index].requirements.push("");
                                        setReconstructionSteps(updated);
                                      }}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      요건 추가
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = reconstructionSteps.filter((_: any, i: number) => i !== index);
                                  setReconstructionSteps(updated);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => saveGuideData("reconstructionSteps", reconstructionSteps)}
                          disabled={saving}
                          size="lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 원도심재개발 진행단계 */}
            <TabsContent value="original-redevelopment">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>원도심재개발 진행단계 관리</span>
                    <Button
                      onClick={() => {
                        const nextNum = redevelopmentSteps.length + 1;
                        setRedevelopmentSteps([...redevelopmentSteps, {
                          number: nextNum,
                          title: "",
                          description: "",
                          duration: "",
                          legalBasis: "",
                          responsibleParty: "",
                          requirements: []
                        }]);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      단계 추가
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {redevelopmentSteps.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      등록된 단계가 없습니다. '단계 추가' 버튼을 클릭하여 새 단계를 추가하세요.
                    </p>
                  ) : (
                    <>
                      {redevelopmentSteps.map((step: any, index: number) => (
                        <Card key={index} className="bg-green-50 border-2">
                          <CardContent className="py-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>단계 번호</Label>
                                    <Input
                                      type="number"
                                      value={step.number}
                                      onChange={(e) => {
                                        const updated = [...redevelopmentSteps];
                                        updated[index].number = parseInt(e.target.value);
                                        setRedevelopmentSteps(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label>단계 제목</Label>
                                    <Input
                                      value={step.title}
                                      onChange={(e) => {
                                        const updated = [...redevelopmentSteps];
                                        updated[index].title = e.target.value;
                                        setRedevelopmentSteps(updated);
                                      }}
                                      placeholder="예: 기본계획 수립"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>설명</Label>
                                  <Textarea
                                    value={step.description}
                                    onChange={(e) => {
                                      const updated = [...redevelopmentSteps];
                                      updated[index].description = e.target.value;
                                      setRedevelopmentSteps(updated);
                                    }}
                                    placeholder="단계에 대한 설명"
                                    rows={2}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label>소요기간</Label>
                                    <Input
                                      value={step.duration}
                                      onChange={(e) => {
                                        const updated = [...redevelopmentSteps];
                                        updated[index].duration = e.target.value;
                                        setRedevelopmentSteps(updated);
                                      }}
                                      placeholder="예: 6개월 ~ 1년"
                                    />
                                  </div>
                                  <div>
                                    <Label>법적 근거</Label>
                                    <Input
                                      value={step.legalBasis}
                                      onChange={(e) => {
                                        const updated = [...redevelopmentSteps];
                                        updated[index].legalBasis = e.target.value;
                                        setRedevelopmentSteps(updated);
                                      }}
                                      placeholder="예: 도시정비법 제4조"
                                    />
                                  </div>
                                  <div>
                                    <Label>담당주체</Label>
                                    <Input
                                      value={step.responsibleParty}
                                      onChange={(e) => {
                                        const updated = [...redevelopmentSteps];
                                        updated[index].responsibleParty = e.target.value;
                                        setRedevelopmentSteps(updated);
                                      }}
                                      placeholder="예: 성남시"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>주요 내용 및 요건</Label>
                                  <div className="space-y-2 mt-2">
                                    {(step.requirements || []).map((req: string, reqIdx: number) => (
                                      <div key={reqIdx} className="flex gap-2">
                                        <Input
                                          value={req}
                                          onChange={(e) => {
                                            const updated = [...redevelopmentSteps];
                                            updated[index].requirements[reqIdx] = e.target.value;
                                            setRedevelopmentSteps(updated);
                                          }}
                                          placeholder="요건 입력"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updated = [...redevelopmentSteps];
                                            updated[index].requirements = updated[index].requirements.filter((_: any, i: number) => i !== reqIdx);
                                            setRedevelopmentSteps(updated);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...redevelopmentSteps];
                                        if (!updated[index].requirements) {
                                          updated[index].requirements = [];
                                        }
                                        updated[index].requirements.push("");
                                        setRedevelopmentSteps(updated);
                                      }}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      요건 추가
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = redevelopmentSteps.filter((_: any, i: number) => i !== index);
                                  setRedevelopmentSteps(updated);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => saveGuideData("redevelopmentSteps", redevelopmentSteps)}
                          disabled={saving}
                          size="lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 원도심 재건축 진행단계 */}
            <TabsContent value="original-reconstruction">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>원도심 재건축 진행단계 관리</span>
                    <Button
                      onClick={() => {
                        const nextNum = originalReconstructionSteps.length + 1;
                        setOriginalReconstructionSteps([...originalReconstructionSteps, {
                          number: nextNum,
                          title: "",
                          description: "",
                          duration: "",
                          legalBasis: "",
                          responsibleParty: "",
                          requirements: []
                        }]);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      단계 추가
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {originalReconstructionSteps.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      등록된 단계가 없습니다. '단계 추가' 버튼을 클릭하여 새 단계를 추가하세요.
                    </p>
                  ) : (
                    <>
                      {originalReconstructionSteps.map((step: any, index: number) => (
                        <Card key={index} className="bg-orange-50 border-2">
                          <CardContent className="py-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>단계 번호</Label>
                                    <Input
                                      type="number"
                                      value={step.number}
                                      onChange={(e) => {
                                        const updated = [...originalReconstructionSteps];
                                        updated[index].number = parseInt(e.target.value);
                                        setOriginalReconstructionSteps(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label>단계 제목</Label>
                                    <Input
                                      value={step.title}
                                      onChange={(e) => {
                                        const updated = [...originalReconstructionSteps];
                                        updated[index].title = e.target.value;
                                        setOriginalReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 기본계획 수립"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>설명</Label>
                                  <Textarea
                                    value={step.description}
                                    onChange={(e) => {
                                      const updated = [...originalReconstructionSteps];
                                      updated[index].description = e.target.value;
                                      setOriginalReconstructionSteps(updated);
                                    }}
                                    placeholder="단계에 대한 설명"
                                    rows={2}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label>소요기간</Label>
                                    <Input
                                      value={step.duration}
                                      onChange={(e) => {
                                        const updated = [...originalReconstructionSteps];
                                        updated[index].duration = e.target.value;
                                        setOriginalReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 6개월 ~ 1년"
                                    />
                                  </div>
                                  <div>
                                    <Label>법적 근거</Label>
                                    <Input
                                      value={step.legalBasis}
                                      onChange={(e) => {
                                        const updated = [...originalReconstructionSteps];
                                        updated[index].legalBasis = e.target.value;
                                        setOriginalReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 도시정비법 제4조"
                                    />
                                  </div>
                                  <div>
                                    <Label>담당주체</Label>
                                    <Input
                                      value={step.responsibleParty}
                                      onChange={(e) => {
                                        const updated = [...originalReconstructionSteps];
                                        updated[index].responsibleParty = e.target.value;
                                        setOriginalReconstructionSteps(updated);
                                      }}
                                      placeholder="예: 성남시"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>주요 내용 및 요건</Label>
                                  <div className="space-y-2 mt-2">
                                    {(step.requirements || []).map((req: string, reqIdx: number) => (
                                      <div key={reqIdx} className="flex gap-2">
                                        <Input
                                          value={req}
                                          onChange={(e) => {
                                            const updated = [...originalReconstructionSteps];
                                            updated[index].requirements[reqIdx] = e.target.value;
                                            setOriginalReconstructionSteps(updated);
                                          }}
                                          placeholder="요건 입력"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updated = [...originalReconstructionSteps];
                                            updated[index].requirements = updated[index].requirements.filter((_: any, i: number) => i !== reqIdx);
                                            setOriginalReconstructionSteps(updated);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...originalReconstructionSteps];
                                        if (!updated[index].requirements) {
                                          updated[index].requirements = [];
                                        }
                                        updated[index].requirements.push("");
                                        setOriginalReconstructionSteps(updated);
                                      }}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      요건 추가
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = originalReconstructionSteps.filter((_: any, i: number) => i !== index);
                                  setOriginalReconstructionSteps(updated);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => saveGuideData("originalReconstructionSteps", originalReconstructionSteps)}
                          disabled={saving}
                          size="lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 가로주택정비 진행단계 */}
            <TabsContent value="street-housing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>가로주택정비 진행단계 관리</span>
                    <Button
                      onClick={() => {
                        const nextNum = streetHousingSteps.length + 1;
                        setStreetHousingSteps([...streetHousingSteps, {
                          number: nextNum,
                          title: "",
                          description: "",
                          duration: "",
                          legalBasis: "",
                          responsibleParty: "",
                          requirements: []
                        }]);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      단계 추가
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {streetHousingSteps.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      등록된 단계가 없습니다. '단계 추가' 버튼을 클릭하여 새 단계를 추가하세요.
                    </p>
                  ) : (
                    <>
                      {streetHousingSteps.map((step: any, index: number) => (
                        <Card key={index} className="bg-purple-50 border-2">
                          <CardContent className="py-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>단계 번호</Label>
                                    <Input
                                      type="number"
                                      value={step.number}
                                      onChange={(e) => {
                                        const updated = [...streetHousingSteps];
                                        updated[index].number = parseInt(e.target.value);
                                        setStreetHousingSteps(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label>단계 제목</Label>
                                    <Input
                                      value={step.title}
                                      onChange={(e) => {
                                        const updated = [...streetHousingSteps];
                                        updated[index].title = e.target.value;
                                        setStreetHousingSteps(updated);
                                      }}
                                      placeholder="예: 기본계획 수립"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>설명</Label>
                                  <Textarea
                                    value={step.description}
                                    onChange={(e) => {
                                      const updated = [...streetHousingSteps];
                                      updated[index].description = e.target.value;
                                      setStreetHousingSteps(updated);
                                    }}
                                    placeholder="단계에 대한 설명"
                                    rows={2}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label>소요기간</Label>
                                    <Input
                                      value={step.duration}
                                      onChange={(e) => {
                                        const updated = [...streetHousingSteps];
                                        updated[index].duration = e.target.value;
                                        setStreetHousingSteps(updated);
                                      }}
                                      placeholder="예: 6개월 ~ 1년"
                                    />
                                  </div>
                                  <div>
                                    <Label>법적 근거</Label>
                                    <Input
                                      value={step.legalBasis}
                                      onChange={(e) => {
                                        const updated = [...streetHousingSteps];
                                        updated[index].legalBasis = e.target.value;
                                        setStreetHousingSteps(updated);
                                      }}
                                      placeholder="예: 도시정비법 제4조"
                                    />
                                  </div>
                                  <div>
                                    <Label>담당주체</Label>
                                    <Input
                                      value={step.responsibleParty}
                                      onChange={(e) => {
                                        const updated = [...streetHousingSteps];
                                        updated[index].responsibleParty = e.target.value;
                                        setStreetHousingSteps(updated);
                                      }}
                                      placeholder="예: 성남시"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>주요 내용 및 요건</Label>
                                  <div className="space-y-2 mt-2">
                                    {(step.requirements || []).map((req: string, reqIdx: number) => (
                                      <div key={reqIdx} className="flex gap-2">
                                        <Input
                                          value={req}
                                          onChange={(e) => {
                                            const updated = [...streetHousingSteps];
                                            updated[index].requirements[reqIdx] = e.target.value;
                                            setStreetHousingSteps(updated);
                                          }}
                                          placeholder="요건 입력"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updated = [...streetHousingSteps];
                                            updated[index].requirements = updated[index].requirements.filter((_: any, i: number) => i !== reqIdx);
                                            setStreetHousingSteps(updated);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...streetHousingSteps];
                                        if (!updated[index].requirements) {
                                          updated[index].requirements = [];
                                        }
                                        updated[index].requirements.push("");
                                        setStreetHousingSteps(updated);
                                      }}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      요건 추가
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = streetHousingSteps.filter((_: any, i: number) => i !== index);
                                  setStreetHousingSteps(updated);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => saveGuideData("streetHousingSteps", streetHousingSteps)}
                          disabled={saving}
                          size="lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* FAQ 관리 */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>자주묻는질문 관리</span>
                <Button
                  onClick={() => {
                    setFaqs([...faqs, { category: "사업 기본", question: "", answer: "" }]);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  FAQ 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  등록된 FAQ가 없습니다. 'FAQ 추가' 버튼을 클릭하여 새 FAQ를 추가하세요.
                </p>
              ) : (
                <>
                  {faqs.map((item: any, index: number) => (
                    <Card key={index} className="bg-gray-50">
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label htmlFor={`faq-category-${index}`}>카테고리</Label>
                              <Input
                                id={`faq-category-${index}`}
                                value={item.category}
                                onChange={(e) => {
                                  const updated = [...faqs];
                                  updated[index].category = e.target.value;
                                  setFaqs(updated);
                                }}
                                placeholder="예: 사업 기본, 비용 및 분담금, 권리 및 동의 등"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`faq-question-${index}`}>질문</Label>
                              <Input
                                id={`faq-question-${index}`}
                                value={item.question}
                                onChange={(e) => {
                                  const updated = [...faqs];
                                  updated[index].question = e.target.value;
                                  setFaqs(updated);
                                }}
                                placeholder="자주 묻는 질문을 입력하세요"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`faq-answer-${index}`}>답변</Label>
                              <Textarea
                                id={`faq-answer-${index}`}
                                value={item.answer}
                                onChange={(e) => {
                                  const updated = [...faqs];
                                  updated[index].answer = e.target.value;
                                  setFaqs(updated);
                                }}
                                placeholder="질문에 대한 상세한 답변을 입력하세요"
                                rows={6}
                              />
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const updated = faqs.filter((_: any, i: number) => i !== index);
                              setFaqs(updated);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => saveGuideData("faq", faqs)}
                      disabled={saving}
                      size="lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 총 소요 기간 관리 */}
        <TabsContent value="duration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>총 소요 기간 관리</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                각 사업 유형별 총 소요 기간을 설정합니다. 가이드 페이지의 "진행단계" 탭 하단에 표시됩니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 분당 재건축 */}
              <div className="space-y-3">
                <Label htmlFor="duration-bundang" className="text-base font-semibold">
                  분당 재건축
                </Label>
                <Textarea
                  id="duration-bundang"
                  value={totalDurations.bundang}
                  onChange={(e) => setTotalDurations({ ...totalDurations, bundang: e.target.value })}
                  rows={3}
                  placeholder="예: 순조로운 경우 5-7년, 평균적으로 7-10년, 지연 시 10년 이상 소요될 수 있습니다."
                />
              </div>

              {/* 원도심 재개발 */}
              <div className="space-y-3">
                <Label htmlFor="duration-oldtown-redevelopment" className="text-base font-semibold">
                  원도심 재개발
                </Label>
                <Textarea
                  id="duration-oldtown-redevelopment"
                  value={totalDurations['oldtown-redevelopment']}
                  onChange={(e) => setTotalDurations({ ...totalDurations, 'oldtown-redevelopment': e.target.value })}
                  rows={3}
                  placeholder="예: 순조로운 경우 7-9년, 평균적으로 9-12년, 정체·분쟁·금융 문제 시 12년 이상이 소요될 수 있습니다."
                />
              </div>

              {/* 원도심 재건축 */}
              <div className="space-y-3">
                <Label htmlFor="duration-oldtown-reconstruction" className="text-base font-semibold">
                  원도심 재건축
                </Label>
                <Textarea
                  id="duration-oldtown-reconstruction"
                  value={totalDurations['oldtown-reconstruction']}
                  onChange={(e) => setTotalDurations({ ...totalDurations, 'oldtown-reconstruction': e.target.value })}
                  rows={3}
                  placeholder="예: 순조로운 경우 5-7년, 평균적으로 7-10년, 지연 시 10년 이상 소요될 수 있습니다."
                />
              </div>

              {/* 가로주택정비 */}
              <div className="space-y-3">
                <Label htmlFor="duration-garohousing" className="text-base font-semibold">
                  가로주택정비사업
                </Label>
                <Textarea
                  id="duration-garohousing"
                  value={totalDurations.garohousing}
                  onChange={(e) => setTotalDurations({ ...totalDurations, garohousing: e.target.value })}
                  rows={3}
                  placeholder="예: 일반 가로주택정비사업은 평균 3-5년이 소요되는 것이 많고, 공공참여형·LH 협력형도 4-6년 내외로 보는 경우가 일반적입니다."
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => saveGuideData("totalDurations", totalDurations)}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "저장 중..." : "총 소요 기간 저장"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 용어사전 관리 */}
        <TabsContent value="glossary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>용어사전 관리</span>
                <Button
                  onClick={() => {
                    setGlossary([...glossary, { term: "", definition: "" }]);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  용어 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {glossary.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  등록된 용어가 없습니다. '용어 추가' 버튼을 클릭하여 새 용어를 추가하세요.
                </p>
              ) : (
                <>
                  {glossary.map((item: any, index: number) => (
                    <Card key={index} className="bg-gray-50">
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label htmlFor={`term-${index}`}>용어</Label>
                              <Input
                                id={`term-${index}`}
                                value={item.term}
                                onChange={(e) => {
                                  const updated = [...glossary];
                                  updated[index].term = e.target.value;
                                  setGlossary(updated);
                                }}
                                placeholder="용어를 입력하세요"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`definition-${index}`}>정의</Label>
                              <Textarea
                                id={`definition-${index}`}
                                value={item.definition}
                                onChange={(e) => {
                                  const updated = [...glossary];
                                  updated[index].definition = e.target.value;
                                  setGlossary(updated);
                                }}
                                placeholder="용어 정의를 입력하세요"
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const updated = glossary.filter((_: any, i: number) => i !== index);
                              setGlossary(updated);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => saveGuideData("glossary", glossary)}
                      disabled={saving}
                      size="lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800">
            💡 <strong>안내:</strong> 가이드 관리 기능은 데이터 구조가 매우 복잡하여 브라우저에서 확인하며 수정하는 방식으로 관리해주세요.            
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
