import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Save, DollarSign, AlertCircle, BookOpen } from "lucide-react";
import { useComplexList } from "../hooks/useComplexList";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { useSearchParams } from "react-router";

interface ContributionGuideContent {
  basicConcept: string;
  formula: string;
  method1Title: string;
  method1Content: string;
  method1Example: string;
  method2Title: string;
  method2Content: string;
  method2Example: string;
  method2Note: string;
}

export function ContributionManagementPage() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'bundang';
  
  // Category name mapping
  const getCategoryNameLocal = (cat: string): string => {
    const categoryNames: Record<string, string> = {
      'bundang': '분당 재건축',
      'oldtown-redevelopment': '원도심 재개발',
      'oldtown-reconstruction': '원도심 재건축',
      'garohousing': '가로주택정비사업'
    };
    return categoryNames[cat] || cat;
  };
  
  const categoryName = getCategoryNameLocal(category);
  const { complexList: complexes } = useComplexList(category);
  const [contributionValues, setContributionValues] = useState<{ [key: string]: string }>({});
  const [guideContent, setGuideContent] = useState<ContributionGuideContent>({
    basicConcept: '',
    formula: '',
    method1Title: '',
    method1Content: '',
    method1Example: '',
    method2Title: '',
    method2Content: '',
    method2Example: '',
    method2Note: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadContributionData();
    loadGuideContent();
  }, []);

  const loadContributionData = async () => {
    setLoading(true);
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
        console.log('분담금 API 없음 - 기본값 사용');
        const contributionMap: { [key: string]: string } = {};
        complexes.forEach(complex => {
          contributionMap[complex.id] = complex.avgContribution31py;
        });
        setContributionValues(contributionMap);
        setMessage({ 
          type: 'error', 
          text: '⚠️ 서버 연결 실패. Edge Function 배포 후 사용 가능합니다. 현재는 기본값을 표시합니다.' 
        });
        setLoading(false);
        return;
      }

      const data = await response.json();

      // 서버 데이터를 state에 저장
      const contributionMap: { [key: string]: string } = {};
      
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          contributionMap[item.complex_id] = item.contribution;
        });
      } else {
        // 데이터가 없으면 complexes의 기본값 사용
        complexes.forEach(complex => {
          contributionMap[complex.id] = complex.avgContribution31py;
        });
      }

      setContributionValues(contributionMap);
    } catch (error: any) {
      console.log('분담금 데이터 로드 중 에러 - 기본값 사용:', error);
      // 에러 시 complexes의 기본값 사용
      const contributionMap: { [key: string]: string } = {};
      complexes.forEach(complex => {
        contributionMap[complex.id] = complex.avgContribution31py;
      });
      setContributionValues(contributionMap);
      setMessage({ 
        type: 'error', 
        text: '⚠️ 서버 연결 실패. Edge Function 배포 후 사용 가능합니다. 현재는 기본값을 표시합니다.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGuideContent = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/contribution-guide`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setGuideContent(data.content);
        } else {
          // 기본값 설정
          setDefaultGuideContent();
        }
      } else {
        setDefaultGuideContent();
      }
    } catch (error) {
      console.error('분담금 안내 로드 실패:', error);
      setDefaultGuideContent();
    }
  };

  const setDefaultGuideContent = () => {
    setGuideContent({
      basicConcept: '분담금 = "새 아파트(혹은 새 주택)를 받기 위해, 종전자산을 제외하고 직접 더 내야 하는 금액"\n\n예:\n• 종전자산 10억 원\n• 새 분양가 12억 원\n→ 12억 - 10억 = 2억 원 → 이것이 분담금입니다.',
      formula: '분담금 = 조합원 분양가액 - 조합원 권리가액\n\n여기서\n조합원 권리가액 = 종전자산 감정평가액 × 비례율\n비례율 = (종후 총 자산평가액 - 총 사업비) / 종전 총 자산평가액 × 100%',
      method1Title: '① 분담금 = 조합원 분양가액 - 권리가액',
      method1Content: '• 조합원 분양가액: 조합원에게 배정될 세대(평형)에 해당하는 분양가 (예: 12억 원/세대)\n• 조합원 권리가액:\n  - 종전자산 감정평가액 × 비례율\n  - 비례율 = (수입 총액 - 정비사업비 총액) / 종전가격 총액 × 100%',
      method1Example: '종전자산 10억 원\n비례율 110%\n조합원 분양가 12억 원\n\n조합원 권리가액 = 10억 × 110% = 11억\n분담금 = 12억 - 11억 = 1억\n\n→ 분담금 약 1억 원 (11억은 이미 "종전자산+비례율"로 받는 권리, 1억은 추가로 내는 것)',
      method2Title: '② 분담금 = 조합원 건축원가 - 일반분양 기여금',
      method2Content: '조합·설계·사업성 분석 쪽에서 많이 쓰는 방식입니다.\n\n조합원 건축원가:\n• 순수건축비 + 기타사업비\n• 순수건축비 = 평당 건축비 × 계약면적(평수)\n• 기타사업비 = 순수건축비 × 약 30% 정도 (보상·용역·공공기여·금융 등)\n\n일반분양 기여 금액:\n일반분양이 가져가는 대지지분에 해당하는 일반분양 1평당 수익 × 일반분양 기여 대지지분으로 계산',
      method2Example: '조합원 건축원가: 3.5억\n일반분양 기여금: 2억\n\n분담금 = 3.5억 - 2억 = 1.5억',
      method2Note: '도시계획이 잘 되어 건축 설계 시 자재와 세대 공간 구성이 좋아, 분양가가 높고 일반분양이 많으면, 일반분양 기여금이 늘어나, 조합원 분담금이 줄어들 수 있습니다.'
    });
  };

  const handleContributionChange = (complexId: string, value: string) => {
    setContributionValues(prev => ({
      ...prev,
      [complexId]: value
    }));
  };

  const handleGuideChange = (field: keyof ContributionGuideContent, value: string) => {
    setGuideContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveGuide = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/contribution-guide`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: guideContent
        }),
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      setMessage({ type: 'success', text: '✅ 분담금 안내가 성공적으로 저장되었습니다!' });

      // 관리자 활동 로그 기록
      if (user?.complexId === "admin" && user?.memberId) {
        try {
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/logs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                adminId: user.memberId,
                adminName: user.name,
                action: "update_contribution_guide",
                details: "분담금 안내 내용 수정"
              })
            }
          );
        } catch (logError) {
          console.error('로그 기록 실패:', logError);
        }
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('분담금 안내 저장 중 에러:', error);
      setMessage({ type: 'error', text: `❌ 저장 실패: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (complexId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const contribution = contributionValues[complexId];

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/contribution`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complex_id: complexId,
          contribution: contribution,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '저장 실패');
      }

      setMessage({ type: 'success', text: '✅ 분담금이 성공적으로 저장되었습니다!' });
      
      // 전역 이벤트 발생 (다른 컴포넌트에서 업데이트 감지)
      window.dispatchEvent(new Event('contributionUpdated'));

      // 3초 후 메시지 제거
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('분담금 저장 중 에러:', error);
      setMessage({ type: 'error', text: `❌ 저장 실패: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>{categoryName} 분담금 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="단지별 분담금을 조정하고 관리하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            {categoryName} 분담금 관리
          </h1>
          <p className="text-gray-600">단지별 분담금을 관리 합니다.</p>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <Card className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <CardContent className="py-4">
              <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-amber-800'}`}>
                {message.text}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 분담금 안내 편집 섹션 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              분담금 안내 내용 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 개념 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. 기본 개념: 분담금이란?
              </label>
              <Textarea
                value={guideContent.basicConcept}
                onChange={(e) => handleGuideChange('basicConcept', e.target.value)}
                placeholder="기본 개념 설명..."
                className="min-h-[120px]"
              />
            </div>

            {/* 수식 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수식 정리
              </label>
              <Textarea
                value={guideContent.formula}
                onChange={(e) => handleGuideChange('formula', e.target.value)}
                placeholder="수식..."
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            {/* 계산 방식 1 */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계산 방식 1 - 제목
              </label>
              <Input
                value={guideContent.method1Title}
                onChange={(e) => handleGuideChange('method1Title', e.target.value)}
                placeholder="예: ① 분담금 = 조합원 분양가액 - 권리가액"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계산 방식 1 - 설명
              </label>
              <Textarea
                value={guideContent.method1Content}
                onChange={(e) => handleGuideChange('method1Content', e.target.value)}
                placeholder="방식 설명..."
                className="min-h-[120px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계산 방식 1 - 예시
              </label>
              <Textarea
                value={guideContent.method1Example}
                onChange={(e) => handleGuideChange('method1Example', e.target.value)}
                placeholder="구체적인 예시..."
                className="min-h-[150px]"
              />
            </div>

            {/* 계산 방식 2 */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계산 방식 2 - 제목
              </label>
              <Input
                value={guideContent.method2Title}
                onChange={(e) => handleGuideChange('method2Title', e.target.value)}
                placeholder="예: ② 분담금 = 조합원 건축원가 - 일반분양 기여금"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계산 방식 2 - 설명
              </label>
              <Textarea
                value={guideContent.method2Content}
                onChange={(e) => handleGuideChange('method2Content', e.target.value)}
                placeholder="방식 설명..."
                className="min-h-[180px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계산 방식 2 - 예시
              </label>
              <Textarea
                value={guideContent.method2Example}
                onChange={(e) => handleGuideChange('method2Example', e.target.value)}
                placeholder="구체적인 예시..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계산 방식 2 - 참고사항
              </label>
              <Textarea
                value={guideContent.method2Note}
                onChange={(e) => handleGuideChange('method2Note', e.target.value)}
                placeholder="참고사항..."
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleSaveGuide}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? '저장 중...' : '분담금 안내 저장'}
            </Button>
          </CardContent>
        </Card>

        {/* 분담금 입력 카드 */}
        <div className="space-y-4">
          {complexes.map((complex) => (
            <Card key={complex.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{complex.name}</span>
                  <span className="text-sm font-normal text-gray-500">31평형 기준</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      분담금
                    </label>
                    <Input
                      type="text"
                      value={contributionValues[complex.id] || ''}
                      onChange={(e) => handleContributionChange(complex.id, e.target.value)}
                      placeholder="예: 4~5억 원"
                      className="w-full"
                      disabled={loading || saving}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(complex.id)}
                    disabled={loading || saving}
                    className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  현재 표시: {contributionValues[complex.id] || complex.avgContribution31py}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 하단 안내 */}
        <Card className="mt-8 bg-gray-100">
          <CardContent className="py-4">
            <p className="text-sm text-gray-700">
              ⚠️ <strong>주의:</strong> 진행율 변경은 즉시 모든 사용자에게 반영됩니다. <code className="bg-white px-2 py-0.5 rounded text-xs">정확한 정보만 입력해주세요.</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}