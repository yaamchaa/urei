import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { FileText, ArrowLeft, Save } from "lucide-react";
import { useComplexList } from "../hooks/useComplexList";
import { useSearchParams, Link } from "react-router";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export function NotesManagementPage() {
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
  const [notes, setNotes] = useState("");
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
      loadNotesData(selectedComplex);
    }
  }, [selectedComplex]);

  const loadNotesData = async (complexId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/notes?complex_id=${complexId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("비고 정보 로드 실패");
      }

      const data = await response.json();
      
      if (data.notes) {
        setNotes(data.notes);
      } else {
        // 기본 데이터 로드
        const complex = complexes.find(c => c.id === complexId);
        if (complex) {
          setNotes(complex.notes);
        }
      }
    } catch (error) {
      console.error("비고 정보 로드 오류:", error);
      // 에러 시 기본 데이터 사용
      const complex = complexes.find(c => c.id === complexId);
      if (complex) {
        setNotes(complex.notes);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/notes`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            complex_id: selectedComplex,
            notes: notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("비고 정보 저장 실패");
      }
      
      alert("비고 정보가 저장되었습니다.");
    } catch (error) {
      console.error("비고 정보 저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedComplexData = complexes.find(c => c.id === selectedComplex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>{categoryName} 비고 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="단지별 특이사항 및 주요 알림을 관리하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-100 rounded-lg">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoryName} 비고 관리</h1>
              <p className="text-gray-600 mt-1">단지별 특이사항 및 주요 알림을 관리합니다</p>
            </div>
          </div>
        </div>

        {/* Complex Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>단지 선택</CardTitle>
            <CardDescription>비고를 수정할 단지를 선택하세요</CardDescription>
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

        {/* Notes Editor */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedComplexData?.name} - 비고</CardTitle>
            <CardDescription>
              특이사항, 주의사항, 최신 소식 등 주민에게 알릴 중요한 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">비고</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="예: 조합설립 추진위원회 설명회가 3월 30일 오후 7시에 진행됩니다. 많은 참석 부탁드립니다."
                  rows={10}
                  className="mt-1 resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  입력 예시: 주민설명회 일정, 중 공지사항, 진행 상황 업데이트 등
                </p>
              </div>

              {/* Character Count */}
              <div className="text-right text-sm text-gray-500">
                {notes.length} 자
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" asChild>
                  <Link to="/">취소</Link>
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !notes.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
              <CardDescription>대시보드에 표시될 형태입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">비고 관리 안내</p>
                <ul className="space-y-1 text-amber-800">
                  <li>• 각 단지별로 중요한 공지사항과 특이사항을 관리할 수 있습니다</li>
                  <li>• 주민설명회 일정, 조합 소식, 진행 상황 등을 입력하세요</li>
                  <li>• 주민들이 주목해야 할 중요한 정보를 우선적으로 작성하세요</li>
                  <li>• 입력한 정보는 대시보드 페이지 하단에 강조 표시됩니다</li>
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