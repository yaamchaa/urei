import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Info, CheckCircle, AlertCircle, TrendingUp, DollarSign, Calendar, Home, Shield } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export function LeadZoneGuidePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadLeadZoneData();
  }, []);

  const loadLeadZoneData = async () => {
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
        const guideData = await response.json();
        if (guideData.leadZone) {
          setData(guideData.leadZone);
        }
      }
    } catch (error) {
      console.error("선도지구 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = data?.title || "분당 1기 신도시 선도지구 완벽 가이드";
  const pageSubtitle = data?.subtitle || "재건축 패스트트랙의 모든 것 - 혜택부터 리스크까지";

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>선도지구 가이드 | 성남시 개발 톡톡</title>
        <meta name="description" content="분당 1기 신도시 선도지구 혜택 및 장단점을 확인하세요" />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{pageTitle}</h1>
          <p className="text-gray-600">{pageSubtitle}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              선도지구란?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">정의</h4>
              <p className="text-gray-800">
                분당·일산·평촌 등 1기 신도시 중 재건축 추진이 빠르고 사업성이 우수한 구역을 우선 지원하는 패스트트랙.
                2024년 특별법 제정 후 분당에서 <strong>7개 구역(시범단지2, 샛별마을, 목련마을1 등)</strong>이 지정됐습니다.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2">목적</h4>
              <p className="text-gray-800">
                행정 절차 단축, 공급 확대(2030년까지 7,855가구)로 노후화 해결과 수도권 주택 공급 촉진.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              혜택 (장점)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">1. 행정 절차 단축</h4>
                    <p className="text-gray-700 text-sm">안전진단 면제, 인허가 우선 처리로 <strong>1~2년 단축</strong></p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">2. 규제 완화</h4>
                    <p className="text-gray-700 text-sm">용적률 상향(184% → 280~500%), 최고층 허용(최대 49층)</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">3. 금융 지원</h4>
                    <p className="text-gray-700 text-sm">이주비 대출 예외 적용 (최대 10억 원)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              단점 및 리스크
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-gray-900 mb-2">1. 분담금 부담</h4>
                <p className="text-gray-800 text-sm">31평 기준 4~7억 원</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-gray-900 mb-2">2. 선정 경쟁 치열</h4>
                <p className="text-gray-800 text-sm">47개 구역 중 7개만 선정</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="py-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">📌 핵심 요약</h3>
            <div className="space-y-2 text-gray-800">
              <p>분당 선도지구는 재건축 속도·프리미엄 기대감으로 호재이나, 분담금과 통합 갈등이 최대 리스크입니다.</p>
              <p className="pt-2 border-t border-blue-200">✅ <strong>최대 혜택:</strong> 행정 절차 1~2년 단축</p>
              <p>⚠️ <strong>최대 리스크:</strong> 31평 기준 4~7억 원 분담금</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
