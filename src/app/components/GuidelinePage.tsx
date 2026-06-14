import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { BookOpen, CheckCircle, HelpCircle, FileText, Download, MessageSquare, Building, Home, Wrench, ExternalLink, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export function GuidelinePage() {
  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 선택된 사업 유형 상태
  const [selectedProjectType, setSelectedProjectType] = useState<'분당재건축' | '원도심재개발' | '원도심 재건축' | '가로주택정비'>('분당재건축');

  // 서버에서 로드한 데이터 상태
  const [loading, setLoading] = useState(true);
  const [serverProjectTypes, setServerProjectTypes] = useState<any[]>([]);
  const [serverReconstructionSteps, setServerReconstructionSteps] = useState<any[]>([]);
  const [serverOriginalReconstructionSteps, setServerOriginalReconstructionSteps] = useState<any[]>([]);
  const [serverRedevelopmentSteps, setServerRedevelopmentSteps] = useState<any[]>([]);
  const [serverStreetHousingSteps, setServerStreetHousingSteps] = useState<any[]>([]);
  const [serverFaqs, setServerFaqs] = useState<any[]>([]);
  const [serverGlossary, setServerGlossary] = useState<any[]>([]);
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

  // 아이콘 매핑 헬퍼
  const iconMap: Record<string, any> = {
    Home: Home,
    Building: Building,
    Wrench: Wrench
  };

  // 서버에서 가이드 데이터 로드
  useEffect(() => {
    const loadGuideData = async () => {
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
          if (data.projectTypes && data.projectTypes.length > 0) {
            setServerProjectTypes(data.projectTypes);
          }
          if (data.reconstructionSteps && data.reconstructionSteps.length > 0) {
            setServerReconstructionSteps(data.reconstructionSteps);
          }
          if (data.originalReconstructionSteps && data.originalReconstructionSteps.length > 0) {
            setServerOriginalReconstructionSteps(data.originalReconstructionSteps);
          }
          if (data.redevelopmentSteps && data.redevelopmentSteps.length > 0) {
            setServerRedevelopmentSteps(data.redevelopmentSteps);
          }
          if (data.streetHousingSteps && data.streetHousingSteps.length > 0) {
            setServerStreetHousingSteps(data.streetHousingSteps);
          }
          if (data.faqs && data.faqs.length > 0) {
            setServerFaqs(data.faqs);
          }
          if (data.glossary && data.glossary.length > 0) {
            setServerGlossary(data.glossary);
          }
          if (data.totalDurations) {
            setTotalDurations(data.totalDurations);
          }
        }
      } catch (error) {
        console.error("가이드 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGuideData();
  }, []);

  // 재건축/재개발/가로주택정비 유형별 정보 (기본값)
  const defaultProjectTypes = [
    {
      title: '재건축',
      icon: Home,
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
      icon: Building,
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
      icon: Wrench,
      color: 'bg-green-600',
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

  // 서버 데이터가 있으면 사용, 없으면 기본값 사용 (아이콘은 문자열을 컴포넌트로 변환)
  const projectTypes = serverProjectTypes.length > 0
    ? serverProjectTypes.map((pt: any) => ({
        ...pt,
        icon: iconMap[pt.icon] || Home
      }))
    : defaultProjectTypes;

  const defaultSteps = [
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

  // 서버 데이터가 있으면 사용, 없으면 기본값 사용
  const steps = serverReconstructionSteps.length > 0 ? serverReconstructionSteps : defaultSteps;
  const originalSteps = serverOriginalReconstructionSteps.length > 0 ? serverOriginalReconstructionSteps : defaultSteps;

  const defaultRedevelopmentSteps = [
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

  // 서버 데이터가 있으면 사용, 없으면 기본값 사용
  const redevelopmentSteps = serverRedevelopmentSteps.length > 0 ? serverRedevelopmentSteps : defaultRedevelopmentSteps;

  const defaultStreetHousingSteps = [
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

  // 서버 데이터가 있으면 사용, 없으면 기본값 사용
  const streetHousingSteps = serverStreetHousingSteps.length > 0 ? serverStreetHousingSteps : defaultStreetHousingSteps;

  const defaultFaqs = [
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

  // 서버 데이터가 있으면 사용, 없으면 기본값 사용
  const faqs = serverFaqs.length > 0 ? serverFaqs : defaultFaqs;

  const defaultGlossary = [
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

  // 서버 데이터가 있으면 사용, 없으면 기본값 사용
  const glossary = serverGlossary.length > 0 ? serverGlossary : defaultGlossary;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>가이드 | 성남시 개발 톡톡</title>
        <meta name="description" content="재건축 절차부터 용어까지, 재건축에 필요한 모든 정보를 확인하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
            정비사업 가이드
          </h1>
          <p className="text-gray-600">도시정비에 필요한 모든 정보를 확인하세요</p>
        </div>

        <Tabs defaultValue="types" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="types">사업유형</TabsTrigger>
            <TabsTrigger value="steps">진행단계</TabsTrigger>
            <TabsTrigger value="faq">자주묻는질문</TabsTrigger>
            <TabsTrigger value="glossary">용어사전</TabsTrigger>
          </TabsList>

          {/* Project Types Tab */}
          <TabsContent value="types" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  정비사업 유형별 안내
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  재건축, 재개발, 가로주택정비사업의 차이점과 각 사업의 특징을 확인하세요.
                </p>
                
                <div className="space-y-6">
                  {projectTypes.map((type, idx) => {
                    const Icon = type.icon;
                    return (
                      <Card key={idx} className="overflow-hidden">
                        <div className={`${type.color} p-4 text-white`}>
                          <div className="flex items-center gap-3">
                            <Icon className="w-8 h-8" />
                            <div>
                              <h3 className="text-xl font-bold">{type.title}</h3>
                              <p className="text-sm opacity-90">{type.description}</p>
                            </div>
                          </div>
                        </div>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">대상 지역</h4>
                              <p className="text-sm text-gray-600">{type.targetArea}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">법적 근거</h4>
                              <Badge variant="outline" className="text-xs">
                                {type.legalBasis}
                              </Badge>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">주요 요건</h4>
                              <ul className="space-y-2">
                                {type.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps" className="space-y-6">
            {/* 사업 유형 선택 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  사업 유형 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  확인하고 싶은 사업 유형을 선택하세요. 각 사업별 추진 단계를 상세하게 안내합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 분당재건축 카드 */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg rounded-t-none ${
                      selectedProjectType === '분당재건축' ? 'ring-2 ring-purple-600 shadow-lg' : ''
                    }`}
                    onClick={() => setSelectedProjectType('분당재건축')}
                  >
                    <div className="bg-purple-600 p-4 text-white rounded-t-none">
                      <div className="flex items-center gap-3">
                        <Home className="w-8 h-8" />
                        <div>
                          <h3 className="text-lg font-bold">분당재건축</h3>
                          <p className="text-sm opacity-90">추진 단계</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">
                        분당 신도시 노후 아파트 재건축
                      </p>
                    </CardContent>
                  </Card>

                  {/* 원도심재개발 카드 */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg rounded-t-none ${
                      selectedProjectType === '원도심재개발' ? 'ring-2 ring-blue-600 shadow-lg' : ''
                    }`}
                    onClick={() => setSelectedProjectType('원도심재개발')}
                  >
                    <div className="bg-blue-600 p-4 text-white rounded-t-none">
                      <div className="flex items-center gap-3">
                        <Building className="w-8 h-8" />
                        <div>
                          <h3 className="text-lg font-bold">원도심재개발</h3>
                          <p className="text-sm opacity-90">추진 단계</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">
                        원도심 낡은 건물 철거 및 신축
                      </p>
                    </CardContent>
                  </Card>

                  {/* 원도심 재건축 카드 */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg rounded-t-none ${
                      selectedProjectType === '원도심 재건축' ? 'ring-2 ring-orange-600 shadow-lg' : ''
                    }`}
                    onClick={() => setSelectedProjectType('원도심 재건축')}
                  >
                    <div className="bg-orange-600 p-4 text-white rounded-t-none">
                      <div className="flex items-center gap-3">
                        <Home className="w-8 h-8" />
                        <div>
                          <h3 className="text-lg font-bold">원도심 재건축</h3>
                          <p className="text-sm opacity-90">추진 단계</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">
                        원도심 노후 아파트 재건축
                      </p>
                    </CardContent>
                  </Card>

                  {/* 가로주택정비 카드 */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg rounded-t-none ${
                      selectedProjectType === '가로주택정비' ? 'ring-2 ring-green-600 shadow-lg' : ''
                    }`}
                    onClick={() => setSelectedProjectType('가로주택정비')}
                  >
                    <div className="bg-green-700 p-4 text-white rounded-t-none">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-8 h-8" />
                        <div>
                          <h3 className="text-lg font-bold">가로주택정비</h3>
                          <p className="text-sm opacity-90">추진 단계</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">
                        기존 도로·마을 형태 유지하며 주거환경 개선
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* 선택된 사업 유형의 진행 단계 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {selectedProjectType} 추진 단계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  {selectedProjectType === '분당재건축' && '분당 재건축은 여러 단계를 거쳐 진행됩니다. 각 단계별 소요 기간과 필수 요건, 법적 근거를 확인하세요.'}
                  {selectedProjectType === '원도심재개발' && '원도심 재개발은 여러 단계를 거쳐 진행됩니다. 각 단계별 소요 기간과 필수 요건, 법적 근거를 확인하세요.'}
                  {selectedProjectType === '원도심 재건축' && '원도심 재건축은 여러 단계를 거쳐 진행됩니다. 각 단계별 소요 기간과 필수 요건, 법적 근거를 확인하세요.'}
                  {selectedProjectType === '가로주택정비' && '일반 재개발·재건축보다 절차가 간단합니다. 각 단계별 소요 기간과 필수 요건, 법적 근거를 확인하세요.'}
                </p>

                <div className="space-y-6">
                  {(selectedProjectType === '분당재건축' ? steps :
                    selectedProjectType === '원도심재개발' ? redevelopmentSteps :
                    selectedProjectType === '원도심 재건축' ? originalSteps :
                    streetHousingSteps).map((step, idx) => (
                    <div key={step.number} className="relative">
                      {idx < steps.length - 1 && (
                        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg relative z-10">
                            {step.number}
                          </div>
                        </div>
                        
                        <Card className="flex-1">
                          <CardHeader>
                            <div className="flex justify-between items-start gap-4 flex-wrap">
                              <CardTitle className="text-lg">{step.title}</CardTitle>
                              <Badge variant="outline">{step.duration}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">{step.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">법적 근거</p>
                                <Badge variant="secondary" className="text-xs">
                                  {step.legalBasis}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">담당 주체</p>
                                <p className="text-sm text-gray-700">{step.responsibleParty}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">주요 활동:</p>
                              <ul className="space-y-1">
                                {step.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ℹ️ <strong>총 소요 기간:</strong>{' '}
                    {selectedProjectType === '분당재건축' && totalDurations.bundang}
                    {selectedProjectType === '원도심재개발' && totalDurations['oldtown-redevelopment']}
                    {selectedProjectType === '원도심 재건축' && totalDurations['oldtown-reconstruction']}
                    {selectedProjectType === '가로주택정비' && totalDurations.garohousing}
                  </p>
                </div>
              </CardContent>
            </Card>                  
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {["사업 기본", "비용 및 분담금", "권리 및 동의", "이주 및 생활", "절차 및 제도", "분양 및 입주", "기타"].map((category) => {
              const categoryFaqs = faqs.filter(faq => faq.category === category);
              if (categoryFaqs.length === 0) return null;
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-600" />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {categoryFaqs.map((faq, idx) => (
                        <AccordionItem key={idx} value={`faq-${category}-${idx}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-6">
                <h3 className="font-semibold text-blue-900 mb-2">더 궁금하신가요?</h3>
                <p className="text-sm text-blue-800 mb-4">
                  시민광장에서 질문을 남기시면 재개발, 재건축 지원 센터에서 답변해드립니다.
                </p>
                <Link to="/community" aria-label="시민광장으로 이동">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-100">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  질문하러 가기
                </Button>
                </Link>  
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glossary Tab */}
          <TabsContent value="glossary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  도시정비 용어사전
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  도시정비 관련 주요 용어를 쉽게 설명합니다.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {glossary.map((item, idx) => (
                    <Card key={idx} className="bg-gray-50">
                      <CardContent className="py-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full" />
                          {item.term}
                        </h4>
                        <p className="text-sm text-gray-600 pl-4">{item.definition}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>    
      </div>
    </div>
  );
}
