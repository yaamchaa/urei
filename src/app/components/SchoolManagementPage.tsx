import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { School, Plus, Save, Trash2, AlertCircle } from "lucide-react";
import { useComplexList } from "../hooks/useComplexList";
import { useSearchParams, Link } from "react-router";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

interface SchoolInfo {
  name: string;
  distance: string;
  type: "초등학교" | "중학교" | "고등학교";
}

export function SchoolManagementPage() {
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
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [studentProjection, setStudentProjection] = useState("");
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
      loadSchoolData(selectedComplex);
    }
  }, [selectedComplex]);

  const loadSchoolData = async (complexId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/school-info?complex_id=${complexId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("학군 정보 로드 실패");
      }

      const data = await response.json();
      
      if (data.schools) {
        setSchools(data.schools.schools || data.schools);
        setStudentProjection(data.schools.studentProjection || "");
      } else {
        // 기본 데이터 로드
        const complex = complexes.find(c => c.id === complexId);
        if (complex) {
          setSchools(complex.nearbySchools.map(school => ({
            name: school,
            distance: "도보 10분",
            type: school.includes("초") ? "초등학교" : school.includes("중") ? "중학교" : "고등학교"
          })));
          setStudentProjection(complex.studentProjection || "");
        }
      }
    } catch (error) {
      console.error("학군 정보 로드 오류:", error);
      // 에러 시 기본 데이터 사용
      const complex = complexes.find(c => c.id === complexId);
      if (complex) {
        setSchools(complex.nearbySchools.map(school => ({
          name: school,
          distance: "도보 10분",
          type: school.includes("초") ? "초등학교" : school.includes("중") ? "중학교" : "고등학교"
        })));
        setStudentProjection(complex.studentProjection || "");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchool = () => {
    setSchools([...schools, { name: "", distance: "", type: "초등학교" }]);
  };

  const handleRemoveSchool = (index: number) => {
    setSchools(schools.filter((_, i) => i !== index));
  };

  const handleSchoolChange = (index: number, field: keyof SchoolInfo, value: string) => {
    const newSchools = [...schools];
    newSchools[index] = { ...newSchools[index], [field]: value };
    setSchools(newSchools);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/school-info`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            complex_id: selectedComplex,
            schools: {
              schools,
              studentProjection,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("학군 정보 저장 실패");
      }
      
      alert("학군 정보가 저장되었습니다.");
    } catch (error) {
      console.error("학군 정보 저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedComplexData = complexes.find(c => c.id === selectedComplex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>{categoryName} 학군 정보 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="단지별 주변 학교 정보를 관리하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <School className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoryName} 학군 정보 관리</h1>
              <p className="text-gray-600 mt-1">단지별 주변 학교 정보를 관리합니다</p>
            </div>
          </div>
        </div>

        {/* Complex Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>단지 선택</CardTitle>
            <CardDescription>학군 정보를 수정할 단지를 선택하세요</CardDescription>
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

        {/* School List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedComplexData?.name} - 주변 학군 정보</CardTitle>
                <CardDescription>학교명, 거리, 구분을 입력하세요</CardDescription>
              </div>
              <Button onClick={handleAddSchool} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                학교 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schools.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <School className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>등록된 학교가 없습니다.</p>
                  <p className="text-sm">학교 추가 버튼을 클릭하여 시작하세요.</p>
                </div>
              ) : (
                schools.map((school, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="md:col-span-5">
                      <Label htmlFor={`school-name-${index}`}>학교명</Label>
                      <Input
                        id={`school-name-${index}`}
                        value={school.name}
                        onChange={(e) => handleSchoolChange(index, "name", e.target.value)}
                        placeholder="예: 분당초등학교"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor={`school-distance-${index}`}>거리</Label>
                      <Input
                        id={`school-distance-${index}`}
                        value={school.distance}
                        onChange={(e) => handleSchoolChange(index, "distance", e.target.value)}
                        placeholder="예: 도보 10분"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor={`school-type-${index}`}>구분</Label>
                      <Select 
                        value={school.type} 
                        onValueChange={(value) => handleSchoolChange(index, "type", value as SchoolInfo["type"])}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="초등학교">초등학교</SelectItem>
                          <SelectItem value="중학교">중학교</SelectItem>
                          <SelectItem value="고등학교">고등학교</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSchool(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 학령인구 예상 입력 */}
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <Label htmlFor="student-projection" className="text-gray-900 font-medium">
                학령인구 예상
              </Label>
              <Input
                id="student-projection"
                value={studentProjection}
                onChange={(e) => setStudentProjection(e.target.value)}
                placeholder="예: +25% 예상"
                className="mt-2"
              />
              <p className="text-xs text-purple-700 mt-2">
                대시보드의 "주변 학군 정보" 카드 하단에 표시됩니다.
              </p>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" asChild>
                <Link to="/">취소</Link>
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <School className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">학군 정보 관리 안내</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• 각 단지별로 주변 학교 정보를 관리할 수 있습니다</li>
                  <li>• 학교명, 거리, 구분(초/중/고)을 입력하세요</li>
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