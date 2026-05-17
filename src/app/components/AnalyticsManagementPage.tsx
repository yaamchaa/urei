import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Save, BarChart3, AlertCircle, ExternalLink, Eye, MousePointerClick, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";

export function AnalyticsManagementPage() {
  const { user } = useUser();
  const [gaTrackingId, setGaTrackingId] = useState("");
  const [clarityProjectId, setClarityProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadAnalyticsConfig();
  }, []);

  const loadAnalyticsConfig = async () => {
    setLoading(true);
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
        setGaTrackingId(data.ga_tracking_id || "");
        setClarityProjectId(data.clarity_project_id || "");
      }
    } catch (error) {
      console.error('통계 설정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/analytics/config`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ga_tracking_id: gaTrackingId,
            clarity_project_id: clarityProjectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('저장 실패');
      }

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
                action: "update_analytics",
                target: "통계 설정",
                details: `GA4: ${gaTrackingId ? '설정됨' : '미설정'}, Clarity: ${clarityProjectId ? '설정됨' : '미설정'}`
              })
            }
          );
        } catch (logError) {
          console.error('활동 로그 저장 실패:', logError);
        }
      }

      setMessage({ type: 'success', text: '✅ 통계 설정이 저장되었습니다. 페이지를 새로고침하면 적용됩니다.' });

      // 설정 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('analyticsConfigUpdated'));

      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('저장 실패:', error);
      setMessage({ type: 'error', text: '❌ 저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>통계 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="Google Analytics 4 및 Microsoft Clarity 통계 설정" />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            홈페이지 통계 관리
          </h1>
          <p className="text-gray-600">Google Analytics 4 및 Microsoft Clarity 설치 및 관리</p>
        </div>

        {/* Alert Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 통계 분석 도구 안내</p>
                <p className="mb-2">성남시 요구사항에 따라 다음 통계를 수집합니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>GA4:</strong> 페이지별 방문수, 유입경로, 체류시간, 이탈률, 이벤트 추적</li>
                  <li><strong>Clarity:</strong> 히트맵, 세션 녹화, 클릭 위치, 스크롤 깊이</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* GA4 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Google Analytics 4 (GA4)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GA4 측정 ID (Measurement ID)
                </label>
                <Input
                  placeholder="G-XXXXXXXXXX"
                  value={gaTrackingId}
                  onChange={(e) => setGaTrackingId(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  예: G-1234567890
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">📋 GA4 설정 가이드</p>
                <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://analytics.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Google Analytics
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    에 접속
                  </li>
                  <li>관리 → 속성 만들기 → 속성 이름 입력</li>
                  <li>데이터 스트림 → 웹 → URL 입력</li>
                  <li>측정 ID (G-로 시작)를 복사하여 위 입력창에 붙여넣기</li>
                </ol>
              </div>

              {gaTrackingId && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>GA4가 설정되었습니다</span>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://analytics.google.com/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                GA4 대시보드 열기
              </Button>
            </CardContent>
          </Card>

          {/* Clarity 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                Microsoft Clarity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clarity 프로젝트 ID
                </label>
                <Input
                  placeholder="abcdefghij"
                  value={clarityProjectId}
                  onChange={(e) => setClarityProjectId(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  10자리 영문/숫자 조합
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">📋 Clarity 설정 가이드</p>
                <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://clarity.microsoft.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Microsoft Clarity
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    에 접속 (무료)
                  </li>
                  <li>새 프로젝트 만들기 → 웹사이트 URL 입력</li>
                  <li>설정 → 설정 태그 → 프로젝트 ID 확인</li>
                  <li>프로젝트 ID를 복사하여 위 입력창에 붙여넣기</li>
                </ol>
              </div>

              {clarityProjectId && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Clarity가 설정되었습니다</span>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://clarity.microsoft.com/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Clarity 대시보드 열기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 추적 이벤트 목록 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-green-600" />
              자동 추적 이벤트 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">📊 페이지 추적</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>모든 페이지 방문 (자동)</li>
                  <li>페이지 체류 시간 (자동)</li>
                  <li>이탈률 및 종료율 (자동)</li>
                  <li>유입 경로 (자동)</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-2">🖱️ 클릭 이벤트</p>
                <ul className="text-xs text-green-800 space-y-1 list-disc list-inside">
                  <li>"센터톡톡" 질문 작성 버튼</li>
                  <li>"바로문자" 전화번호 클릭</li>
                  <li>단지별 대시보드 카드 클릭</li>
                  <li>진행율 상세 정보 클릭</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-900 mb-2">💬 소통 이벤트</p>
                <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
                  <li>단지별 소통방 메시지 전송</li>
                  <li>댓글 작성</li>
                  <li>질문 게시판 작성</li>
                  <li>답변 작성</li>
                </ul>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-orange-900 mb-2">🎯 기타 이벤트</p>
                <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
                  <li>로그인/로그아웃</li>
                  <li>파일 다운로드</li>
                  <li>외부 링크 클릭</li>
                  <li>이미지 확대</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">통계 설정 저장</h3>
                <p className="text-sm text-blue-100">
                  GA4 및 Clarity 설정을 저장하고 통계 수집을 시작합니다
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || (!gaTrackingId && !clarityProjectId)}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? '저장 중...' : '설정 저장'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-2">⚠️ 중요 안내</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>설정 저장 후 <strong>페이지를 새로고침</strong>해야 통계 수집이 시작됩니다</li>
                  <li>GA4는 데이터 수집 후 24~48시간 뒤부터 대시보드에서 확인 가능합니다</li>
                  <li>Clarity는 설정 즉시 세션 녹화 및 히트맵 수집이 시작됩니다</li>
                  <li>모든 디바이스(PC, 모바일, 태블릿)에서 자동으로 데이터가 수집됩니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
