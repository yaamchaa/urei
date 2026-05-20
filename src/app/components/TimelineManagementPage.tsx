import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Plus, Save, Trash2, AlertCircle, Clock } from "lucide-react";
import { useComplexList } from "../hooks/useComplexList";
import { useSearchParams } from "react-router";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

interface TimelineItem {
  event: string;
  date: string;
  status: 'completed' | 'ongoing' | 'planned';
}

export function TimelineManagementPage() {
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
  const [selectedComplexId, setSelectedComplexId] = useState(complexes[0]?.id || '');
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 선택된 단지 정보
  const selectedComplex = complexes.find(c => c.id === selectedComplexId) || complexes[0];

  // complexes가 로드된 후 첫 번째 단지 자동 선택
  useEffect(() => {
    if (complexes.length > 0 && !selectedComplexId) {
      setSelectedComplexId(complexes[0].id);
    }
  }, [complexes, selectedComplexId]);

  // 초기 데이터 로드
  useEffect(() => {
    loadTimelineData();
  }, [selectedComplexId]);

  const loadTimelineData = async () => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/timeline?complex_id=${selectedComplexId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('타임라인 API 없음 - 기본값 사용');
        setTimelineItems(selectedComplex.timeline);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data && data.timeline) {
        setTimelineItems(data.timeline);
      } else {
        setTimelineItems(selectedComplex.timeline);
      }
    } catch (error: any) {
      console.log('타임라인 데이터 로드 중 에러 - 기본값 사용:', error);
      setTimelineItems(selectedComplex.timeline);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: keyof TimelineItem, value: string) => {
    const newItems = [...timelineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setTimelineItems(newItems);
  };

  const handleAddItem = () => {
    setTimelineItems([
      ...timelineItems,
      { event: '', date: '', status: 'planned' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (window.confirm('이 항목을 삭제하시겠습니까?')) {
      setTimelineItems(timelineItems.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // 빈 항목 검증
      const hasEmpty = timelineItems.some(item => !item.event.trim() || !item.date.trim());
      if (hasEmpty) {
        throw new Error('모든 항목의 이벤트명과 날짜를 입력해주세요.');
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/timeline`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complex_id: selectedComplexId,
          timeline: timelineItems,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('저장 실패 - 서버 응답:', errorData);
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const result = await response.json();
      console.log('저장 성공:', result);

      setMessage({ type: 'success', text: '✅ 추진 일정이 성공적으로 저장되었습니다.' });
      await loadTimelineData();
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => setMessage(null), 3000);

      // 페이지 새로고침하여 변경사항 반영
      window.dispatchEvent(new CustomEvent('timelineUpdated'));
      
    } catch (error: any) {
      console.error('저장 실패:', error);
      setMessage({ type: 'error', text: `❌ ${error.message || '저장 중 오류가 발생했습니다.'}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>{categoryName} 추진 일정 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="각 단지의 재건축 추진 일정을 관리하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            {categoryName} 추진 일정 관리
          </h1>
          <p className="text-gray-600">
            각 단지의 재건축 추진 일정을 관리할 수 있습니다.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">관리자 안내</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 단지를 선택하여 해당 단지의 추진 일정을 수정할 수 있습니다.</li>
                  <li>• 상태는 완료(completed), 진행중(ongoing), 예정(planned) 중 선택하세요.</li>
                  <li>• 항목은 자유롭게 추가하거나 삭제할 수 있습니다.</li>
                  <li>• 저장 후 대시보드 페이지에 즉시 반영됩니다.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complex Selector */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관리할 단지 선택
            </label>
            <Select value={selectedComplexId} onValueChange={setSelectedComplexId}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {complexes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Message Display */}
        {message && (
          <Card className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="py-4">
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Timeline Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">추진 일정 항목</CardTitle>
              <Button onClick={handleAddItem} variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                항목 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                데이터를 불러오는 중...
              </div>
            ) : (
              <div className="space-y-4">
                {timelineItems.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        {/* 이벤트명 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            이벤트명 *
                          </label>
                          <Input
                            value={item.event}
                            onChange={(e) => handleItemChange(index, 'event', e.target.value)}
                            placeholder="예: 조합설립인가"
                            className="w-full"
                          />
                        </div>

                        {/* 날짜 및 상태 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              날짜 *
                            </label>
                            <Input
                              value={item.date}
                              onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                              placeholder="예: 2027년 3월"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              상태 *
                            </label>
                            <Select
                              value={item.status}
                              onValueChange={(value) => handleItemChange(index, 'status', value as 'completed' | 'ongoing' | 'planned')}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="completed">✓ 완료</SelectItem>
                                <SelectItem value="ongoing">🔄 진행중</SelectItem>
                                <SelectItem value="planned">⏱ 예정</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* 삭제 버튼 */}
                      <Button
                        onClick={() => handleRemoveItem(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {timelineItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    추진 일정이 없습니다. "항목 추가" 버튼을 클릭하여 추가하세요.
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || loading || timelineItems.length === 0}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timelineItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'ongoing' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900">{item.event || '(이벤트명 없음)'}</h4>
                      <span className="text-sm text-gray-600">{item.date || '(날짜 없음)'}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.status === 'completed' ? '✓ 완료' :
                       item.status === 'ongoing' ? '🔄 진행중' :
                       '⏱ 예정'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}