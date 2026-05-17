import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Save, Home, AlertCircle, Plus, Trash2 } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { useComplexList } from "../hooks/useComplexList";
import { useSearchParams } from "react-router";

interface SubDistrict {
  largeName: string;
  subName: string;
  location: string;
  area: string;
  zoning: string;
  totalBudget: string;
  projectMethod: string;
  constructor: string;
  beforeHouseholds: string;
  afterHouseholds: string;
}

export function BasicInfoManagementPage() {
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
  const [subDistrictsData, setSubDistrictsData] = useState<{ [key: string]: SubDistrict[] }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/basic-info`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('기본정보 API 없음 - 기본값 사용');
        const dataMap: { [key: string]: SubDistrict[] } = {};
        complexes.forEach(complex => {
          if (complex.subDistricts) {
            dataMap[complex.id] = complex.subDistricts;
          }
        });
        setSubDistrictsData(dataMap);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const dataMap: { [key: string]: SubDistrict[] } = {};

      // 먼저 모든 단지의 기본값을 로드
      complexes.forEach(complex => {
        if (complex.subDistricts) {
          dataMap[complex.id] = complex.subDistricts;
        }
      });

      // 서버 데이터가 있으면 덮어쓰기
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          dataMap[item.complex_id] = item.subDistricts;
        });
      }

      setSubDistrictsData(dataMap);
    } catch (error) {
      console.log('기본정보 데이터 로드 중 에러 - 기본값 사용:', error);
      const dataMap: { [key: string]: SubDistrict[] } = {};
      complexes.forEach(complex => {
        if (complex.subDistricts) {
          dataMap[complex.id] = complex.subDistricts;
        }
      });
      setSubDistrictsData(dataMap);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (complexId: string, index: number, field: keyof SubDistrict, value: string) => {
    setSubDistrictsData(prev => ({
      ...prev,
      [complexId]: prev[complexId].map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddDistrict = (complexId: string) => {
    setSubDistrictsData(prev => ({
      ...prev,
      [complexId]: [
        ...(prev[complexId] || []),
        {
          largeName: '',
          subName: '',
          location: '',
          area: '',
          zoning: '',
          totalBudget: '',
          projectMethod: '',
          constructor: '',
          beforeHouseholds: '',
          afterHouseholds: ''
        }
      ]
    }));
  };

  const handleRemoveDistrict = (complexId: string, index: number) => {
    if (window.confirm('이 구역 정보를 삭제하시겠습니까?')) {
      setSubDistrictsData(prev => ({
        ...prev,
        [complexId]: prev[complexId].filter((_, idx) => idx !== index)
      }));
    }
  };

  const calculateTotalHouseholds = (districts: SubDistrict[], field: 'beforeHouseholds' | 'afterHouseholds'): string => {
    if (!districts || districts.length === 0) return '0가구';

    let total = 0;
    districts.forEach(district => {
      const value = district[field];
      if (value) {
        // "3,569가구" 또는 "포함" 같은 형식 처리
        if (value === '포함' || value === '-') {
          return; // 계산에서 제외
        }
        // 숫자만 추출 (쉼표 제거)
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers) {
          total += parseInt(numbers, 10);
        }
      }
    });

    // 1000단위 쉼표 추가
    return total.toLocaleString() + '가구';
  };

  const handleSave = async (complexId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const subDistricts = subDistrictsData[complexId] || [];

      // 총 세대수 계산
      const totalHouseholdsBefore = calculateTotalHouseholds(subDistricts, 'beforeHouseholds');
      const totalHouseholdsAfter = calculateTotalHouseholds(subDistricts, 'afterHouseholds');

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/basic-info`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complex_id: complexId,
          subDistricts: subDistricts,
          total_households_before: totalHouseholdsBefore,
          total_households_after: totalHouseholdsAfter,
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류 (${response.status})`);
      }

      setMessage({ type: 'success', text: '✅ 저장되었습니다.' });

      // 관리자 활동 로그 기록
      if (user?.complexId === "admin" && user?.memberId) {
        const complexName = getComplexName(complexId);
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
                action: "update_basic_info",
                target: complexName,
                details: `기본정보 수정`
              })
            }
          );
        } catch (logError) {
          console.error('로그 기록 실패:', logError);
        }
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('저장 실패:', error);
      setMessage({ type: 'error', text: `❌ 저장 실패: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const getComplexName = (complexId: string) => {
    return complexes.find(c => c.id === complexId)?.name || complexId;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>{categoryName} 기본정보 관리 | 성남시 개발 톡톡</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Home className="w-8 h-8" />
            {categoryName} 기본정보 관리
          </h1>
          <p className="text-gray-600">세부 구역 정보를 관리합니다</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {complexes.map(complex => (
            <Card key={complex.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{complex.name}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddDistrict(complex.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      구역 추가
                    </Button>
                    <Button
                      onClick={() => handleSave(complex.id)}
                      disabled={saving}
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(subDistrictsData[complex.id] || []).map((district, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white relative">
                      <Button
                        onClick={() => handleRemoveDistrict(complex.id, index)}
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">대형 구역</label>
                          <Input
                            value={district.largeName}
                            onChange={(e) => handleFieldChange(complex.id, index, 'largeName', e.target.value)}
                            placeholder="예: 시범단지"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">세부 구역</label>
                          <Input
                            value={district.subName}
                            onChange={(e) => handleFieldChange(complex.id, index, 'subName', e.target.value)}
                            placeholder="예: 23구역"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                          <Input
                            value={district.location}
                            onChange={(e) => handleFieldChange(complex.id, index, 'location', e.target.value)}
                            placeholder="예: 이매1동"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">면적</label>
                          <Input
                            value={district.area}
                            onChange={(e) => handleFieldChange(complex.id, index, 'area', e.target.value)}
                            placeholder="예: 184,500㎡"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">용도지역</label>
                          <Input
                            value={district.zoning}
                            onChange={(e) => handleFieldChange(complex.id, index, 'zoning', e.target.value)}
                            placeholder="예: 제2종일반주거지역"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">총 사업비</label>
                          <Input
                            value={district.totalBudget}
                            onChange={(e) => handleFieldChange(complex.id, index, 'totalBudget', e.target.value)}
                            placeholder="예: 약 2조 1,000억원"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">사업방식</label>
                          <Input
                            value={district.projectMethod}
                            onChange={(e) => handleFieldChange(complex.id, index, 'projectMethod', e.target.value)}
                            placeholder="예: 관리처분방식"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">시공사</label>
                          <Input
                            value={district.constructor}
                            onChange={(e) => handleFieldChange(complex.id, index, 'constructor', e.target.value)}
                            placeholder="예: 현대건설(예정)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">기존 세대</label>
                          <Input
                            value={district.beforeHouseholds}
                            onChange={(e) => handleFieldChange(complex.id, index, 'beforeHouseholds', e.target.value)}
                            placeholder="예: 3,569가구"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">재건축 후</label>
                          <Input
                            value={district.afterHouseholds}
                            onChange={(e) => handleFieldChange(complex.id, index, 'afterHouseholds', e.target.value)}
                            placeholder="예: 6,049가구"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!subDistrictsData[complex.id] || subDistrictsData[complex.id].length === 0) && (
                    <div className="text-center text-gray-500 py-8">
                      구역 정보가 없습니다. "구역 추가" 버튼을 클릭하여 추가하세요.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}