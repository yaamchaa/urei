import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Save, Car, AlertCircle } from "lucide-react";
import { useComplexList } from "../hooks/useComplexList";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { useSearchParams } from "react-router";

export function ParkingManagementPage() {
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
  const [parkingData, setParkingData] = useState<{ [key: string]: { before: string, after: string } }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/parking`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('주차 개선 API 없음 - 기본값 사용');
        const dataMap: { [key: string]: { before: string, after: string } } = {};
        complexes.forEach(complex => {
          dataMap[complex.id] = {
            before: complex.parkingBefore,
            after: complex.parkingAfter
          };
        });
        setParkingData(dataMap);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const dataMap: { [key: string]: { before: string, after: string } } = {};

      // 먼저 모든 단지의 기본값을 로드
      complexes.forEach(complex => {
        dataMap[complex.id] = {
          before: complex.parkingBefore,
          after: complex.parkingAfter
        };
      });

      // 서버 데이터가 있으면 덮어쓰기
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          dataMap[item.complex_id] = {
            before: item.parking_before,
            after: item.parking_after
          };
        });
      }

      setParkingData(dataMap);
    } catch (error) {
      console.log('주차 개선 데이터 로드 중 에러 - 기본값 사용:', error);
      const dataMap: { [key: string]: { before: string, after: string } } = {};
      complexes.forEach(complex => {
        dataMap[complex.id] = {
          before: complex.parkingBefore,
          after: complex.parkingAfter
        };
      });
      setParkingData(dataMap);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (complexId: string, field: 'before' | 'after', value: string) => {
    setParkingData(prev => ({
      ...prev,
      [complexId]: {
        ...prev[complexId],
        [field]: value
      }
    }));
  };

  const handleSave = async (complexId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const parking = parkingData[complexId];
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/parking`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complex_id: complexId,
          parking_before: parking.before,
          parking_after: parking.after,
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
                action: "update_parking",
                target: complexName,
                details: `주차 개선 정보 수정 (재건축 전: ${parking.before}, 재건축 후: ${parking.after})`
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
        <title>{categoryName} 주차 개선 관리 | 성남시 개발 톡톡</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Car className="w-8 h-8" />
            {categoryName} 주차 개선 관리
          </h1>
          <p className="text-gray-600">재건축 전후 주차 대수를 관리합니다</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complexes.map(complex => (
            <Card key={complex.id}>
              <CardHeader>
                <CardTitle>{complex.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      재건축 전 (세대당 대수)
                    </label>
                    <Input
                      value={parkingData[complex.id]?.before || ''}
                      onChange={(e) => handleChange(complex.id, 'before', e.target.value)}
                      placeholder="예: 1.15대"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      재건축 후 (세대당 대수)
                    </label>
                    <Input
                      value={parkingData[complex.id]?.after || ''}
                      onChange={(e) => handleChange(complex.id, 'after', e.target.value)}
                      placeholder="예: 1.45대"
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(complex.id)}
                    disabled={saving}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}