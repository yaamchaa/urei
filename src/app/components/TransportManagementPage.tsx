import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Bus, ArrowLeft, Save } from "lucide-react";
import { useComplexList } from "../hooks/useComplexList";
import { useSearchParams, Link } from "react-router";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export function TransportManagementPage() {
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
  const [selectedComplex, setSelectedComplex] = useState(complexes[0]?.id || '');
  const [transportInfo, setTransportInfo] = useState("");
  const [improvementNote, setImprovementNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // complexes가 로드된 후 첫 번째 단지 자동 선택
  useEffect(() => {
    if (complexes.length > 0 && !selectedComplex) {
      setSelectedComplex(complexes[0].id);
    }
  }, [complexes, selectedComplex]);

  // 선택된 단지가 변경될 때마다 데이터 로드
  useEffect(() => {
    if (selectedComplex) {
      loadTransportData(selectedComplex);
    }
  }, [selectedComplex]);

  const loadTransportData = async (complexId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/transport-info?complex_id=${complexId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("교통 정보 로드 실패");
      }

      const data = await response.json();
      
      if (data.transport_info) {
        // transport_info가 객체인 경우와 문자열인 경우 모두 처리
        if (typeof data.transport_info === 'object') {
          setTransportInfo(data.transport_info.info || data.transport_info.transportInfo || "");
          setImprovementNote(data.transport_info.improvementNote || "");
        } else {
          setTransportInfo(data.transport_info);
          setImprovementNote("");
        }
      } else {
        // 기본 데이터 로드
        const complex = complexes.find(c => c.id === complexId);
        if (complex) {
          setTransportInfo(complex.transportInfo);
          setImprovementNote("");
        }
      }
    } catch (error) {
      console.error("교통 정보 로드 오류:", error);
      // 에러 시 기본 데이터 사용
      const complex = complexes.find(c => c.id === complexId);
      if (complex) {
        setTransportInfo(complex.transportInfo);
        setImprovementNote("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/transport-info`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            complex_id: selectedComplex,
            transport_info: transportInfo,
            improvement_note: improvementNote,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("교통 정보 저장 실패");
      }
      
      alert("교통 정보가 저장되었습니다.");
    } catch (error) {
      console.error("교통 정보 저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedComplexData = complexes.find(c => c.id === selectedComplex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>{categoryName} 교통 정보 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="단지별 대중교통 및 도로 접근성 정보를 관리하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <Bus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoryName} 교통 정보 관리</h1>
              <p className="text-gray-600 mt-1">단지별 대중교통 및 도로 접근성 정보를 관리합니다</p>
            </div>
          </div>
        </div>

        {/* Complex Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>단지 선택</CardTitle>
            <CardDescription>교통 정보를 수정할 단지를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedComplex} onValueChange={setSelectedComplex}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {complexes.map((complex) => (
                  <SelectItem key={complex.id} value={complex.id}>
                    {complex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Transport Info Editor */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedComplexData?.name} - 교통 정보</CardTitle>
            <CardDescription>
              버스 노선, 지하철역, 주요 도로 접근성 등 교통 관련 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="transport-info">교통 정보</Label>
                <Textarea
                  id="transport-info"
                  value={transportInfo}
                  onChange={(e) => setTransportInfo(e.target.value)}
                  placeholder="예: 정자역(신분당선) 도보 10분, 버스 102, 350 이용 가능"
                  rows={8}
                  className="mt-1 resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  입력 예시: 정자역(신분당선) 도보 10분 거리, 마을버스 및 간선버스 이용 가능
                </p>
              </div>

              {/* Character Count */}
              <div className="text-right text-sm text-gray-500">
                {transportInfo.length} 자
              </div>

              {/* 교통 여건 개선 노트 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label htmlFor="improvement-note" className="text-gray-900 font-medium">
                  교통 여건 개선 안내 텍스트
                </Label>
                <Textarea
                  id="improvement-note"
                  value={improvementNote}
                  onChange={(e) => setImprovementNote(e.target.value)}
                  placeholder="예: 정비사업 완료 시 교통 여건이 크게 개선될 것으로 예상됩니다."
                  rows={3}
                  className="mt-2 resize-none"
                />
                <p className="text-xs text-blue-700 mt-2">
                  대시보드의 "교통 정보" 카드 하단 파란색 박스에 표시됩니다.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" asChild>
                  <Link to="/">취소</Link>
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !transportInfo.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {transportInfo && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
              <CardDescription>대시보드에 표시될 형태입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{transportInfo}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Bus className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold mb-1">교통 정보 관리 안내</p>
                <ul className="space-y-1 text-green-800">
                  <li>• 각 단지별로 대중교통 및 도로 접근성 정보를 관리할 수 있습니다</li>
                  <li>• 지하철역, 버스 노선, 주요 도로 등의 정보를 포함하세요</li>
                  <li>• 거리와 소요 시간을 함께 명시하면 더 유용합니다</li>
                  <li>• 입력한 정보는 대시보드 페이지에 표시됩니다</li>
                  <li>• 저장 버튼을 클릭해야 변경사항이 적용됩니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
