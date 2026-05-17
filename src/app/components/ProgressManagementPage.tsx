import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Save, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Plus, Trash2, Calendar } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { useComplexList } from "../hooks/useComplexList";
import { Badge } from "./ui/badge";
import { useSearchParams } from "react-router";

interface TimelineItem {
  date: string;
  event: string;
  status: 'completed' | 'ongoing' | 'planned';
}

interface DetailedProgress {
  currentStatus: string;
  nextMilestone: string;
  expectedConstruction: string;
  expectedMoveIn: string;
}

interface ComplexDetails {
  progress: number;
  detailedProgress: DetailedProgress;
  timeline: TimelineItem[];
}

export function ProgressManagementPage() {
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
  const { complexList: complexes, isLoading: isLoadingComplexes } = useComplexList(category);
  const [progressValues, setProgressValues] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [expandedComplex, setExpandedComplex] = useState<string | null>(null);
  const [complexDetails, setComplexDetails] = useState<{ [key: string]: ComplexDetails }>({});

  // 초기 데이터 로드 - complexes가 로드된 후에만 실행
  useEffect(() => {
    if (!isLoadingComplexes && complexes.length > 0) {
      loadProgressData();
      loadComplexDetails();
    }
  }, [isLoadingComplexes, complexes]);

  // complexes가 변경되면 새로운 단지의 기본값 설정
  useEffect(() => {
    if (complexes.length > 0) {
      setProgressValues(prev => {
        const newValues = { ...prev };
        complexes.forEach(complex => {
          if (newValues[complex.id] === undefined) {
            newValues[complex.id] = complex.progress || 0;
          }
        });
        return newValues;
      });
    }
  }, [complexes]);

  const loadComplexDetails = async () => {
    const details: { [key: string]: ComplexDetails } = {};

    // 모든 단지의 상세 정보를 병렬로 로드
    await Promise.all(
      complexes.map(async (complex) => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/progress/details/${complex.id}`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            details[complex.id] = {
              progress: complex.progress,
              detailedProgress: data.detailed_progress || complex.detailedProgress || {
                currentStatus: '',
                nextMilestone: '',
                expectedConstruction: '',
                expectedMoveIn: ''
              },
              timeline: data.timeline || complex.timeline || []
            };
          } else {
            // 서버에 데이터가 없으면 기본값 사용
            details[complex.id] = {
              progress: complex.progress,
              detailedProgress: complex.detailedProgress || {
                currentStatus: '',
                nextMilestone: '',
                expectedConstruction: '',
                expectedMoveIn: ''
              },
              timeline: complex.timeline || []
            };
          }
        } catch (error) {
          console.error(`${complex.id} 상세 정보 로드 실패:`, error);
          // 오류 시 기본값 사용
          details[complex.id] = {
            progress: complex.progress,
            detailedProgress: complex.detailedProgress || {
              currentStatus: '',
              nextMilestone: '',
              expectedConstruction: '',
              expectedMoveIn: ''
            },
            timeline: complex.timeline || []
          };
        }
      })
    );

    setComplexDetails(details);
  };

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/progress`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      // API가 없거나 테이블이 없을 경우 기본값 사용
      if (!response.ok) {
        console.log('진행율 API 없음 - 기본값 사용');
        const progressMap: { [key: string]: number } = {};
        complexes.forEach(complex => {
          progressMap[complex.id] = complex.progress;
        });
        setProgressValues(progressMap);
        setMessage({ 
          type: 'error', 
          text: '⚠️ 서버 연결 실패. Edge Function 배포 후 사용 가능합니다. 현재는 기본값을 표시합니다.' 
        });
        setLoading(false);
        return;
      }

      const data = await response.json();

      // 서버 데이터를 state에 저장
      const progressMap: { [key: string]: number } = {};
      
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          progressMap[item.complex_id] = item.progress;
        });
      } else {
        // 데이터가 없으면 complexes의 기본값 사용
        complexes.forEach(complex => {
          progressMap[complex.id] = complex.progress;
        });
      }

      setProgressValues(progressMap);
    } catch (error: any) {
      console.log('진행율 데이터 로드 중 에러 - 기본값 사용:', error);
      // 에러 시 complexes의 기본값 사용
      const progressMap: { [key: string]: number } = {};
      complexes.forEach(complex => {
        progressMap[complex.id] = complex.progress;
      });
      setProgressValues(progressMap);
      setMessage({ 
        type: 'error', 
        text: '⚠️ 서버 연결 실패. Edge Function 배포 후 사용 가능합니다. 현재는 기본값을 표시합니다.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProgressChange = (complexId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue)); // 0-100 사이로 제한
    
    setProgressValues(prev => ({
      ...prev,
      [complexId]: clampedValue
    }));
  };

  const handleSave = async (complexId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const progress = progressValues[complexId];

      // progress 값 검증
      if (progress === undefined || progress === null) {
        setMessage({ type: 'error', text: '❌ 진행율 값을 입력해주세요.' });
        setSaving(false);
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/progress`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complex_id: complexId,
          progress: progress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('저장 실패 - 서버 응답:', errorData);

        // 테이블이 없는 경우 친절한 메시지 표시
        if (errorData.error && errorData.error.includes('complex_progress')) {
          throw new Error('Edge Function이 아직 배포되지 않았습니다. Supabase 대시보드에서 Edge Function을 배포해주세요.');
        }

        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const result = await response.json();
      console.log('저장 성공:', result);

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
                action: "update_progress",
                target: complexName,
                details: `진행율을 ${progress}%로 수정`
              })
            }
          );
          console.log('✅ 활동 로그 저장 완료');
        } catch (logError) {
          console.error('활동 로그 저장 실패:', logError);
        }
      }

      setMessage({ type: 'success', text: '✅ 진행율이 성공적으로 저장되었습니다.' });

      // 3초 후 메시지 자동 제거
      setTimeout(() => setMessage(null), 3000);

      // 페이지 새로고침하여 변경사항 반영
      window.dispatchEvent(new CustomEvent('progressUpdated'));

    } catch (error: any) {
      console.error('저장 실패:', error);
      setMessage({ type: 'error', text: `❌ ${error.message || '저장 중 오류가 발생했습니다.'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetails = async (complexId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const details = complexDetails[complexId];
      if (!details) {
        throw new Error('상세 정보가 없습니다.');
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/progress/details`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complex_id: complexId,
          detailed_progress: details.detailedProgress,
          timeline: details.timeline,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('상세 정보 저장 실패 - 서버 응답:', errorData);
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const result = await response.json();
      console.log('상세 정보 저장 성공:', result);

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
                action: "update_progress_details",
                target: complexName,
                details: `진행율 상세 정보 수정 (현황, 일정 등)`
              })
            }
          );
          console.log('✅ 활동 로그 저장 완료');
        } catch (logError) {
          console.error('활동 로그 저장 실패:', logError);
        }
      }

      setMessage({ type: 'success', text: '✅ 상세 정보가 성공적으로 저장되었습니다.' });

      // 3초 후 메시지 자동 제거
      setTimeout(() => setMessage(null), 3000);

      // 페이지 새로고침하여 변경사항 반영
      window.dispatchEvent(new CustomEvent('progressUpdated'));
      window.dispatchEvent(new CustomEvent('timelineUpdated'));

    } catch (error: any) {
      console.error('상세 정보 저장 실패:', error);
      setMessage({ type: 'error', text: `❌ ${error.message || '상세 정보 저장 중 오류가 발생했습니다.'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // 모든 단지의 진행율을 배치로 저장
      const updates = complexes.map(complex => ({
        complex_id: complex.id,
        progress: progressValues[complex.id] || complex.progress,
      }));

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/progress/batch`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save all progress');
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
                action: "update_progress",
                target: "전체 단지",
                details: `${complexes.length}개 단지의 진행율 일괄 수정`
              })
            }
          );
          console.log('✅ 활동 로그 저장 완료');
        } catch (logError) {
          console.error('활동 로그 저장 실패:', logError);
        }
      }

      setMessage({ type: 'success', text: '✅ 모든 진행율이 성공적으로 저장되었습니다.' });

      // 페이지 새로고침하여 변경사항 반영
      window.dispatchEvent(new CustomEvent('progressUpdated'));

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('일괄 저장 실패:', error);
      setMessage({ type: 'error', text: '❌ 일괄 저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const getComplexName = (complexId: string) => {
    const complex = complexes.find(c => c.id === complexId);
    return complex?.name || complexId;
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
        <title>{categoryName} 진행율 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="각 단지의 재건축 진행율을 업데이트하고 관리하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            {categoryName} 진행율 관리
          </h1>
          <p className="text-gray-600">각 단지의 재건축 진행율을 업데이트하세요</p>
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
            <p className="text-sm text-blue-800">
              💡 <strong>안내:</strong> 진행율을 수정하면 홈페이지와 대시보드의 모든 진행율 표시가 자동으로 업데이트됩니다.
            </p>
          </CardContent>
        </Card>

        {/* Deployment Guide - Edge Function이 배포되지 않은 경우에만 표시 */}
        {message?.type === 'error' && message.text.includes('서버 연결 실패') && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900 text-lg">📋 Edge Function 배포 가이드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-amber-900">
                <p className="font-medium">진행율 저장 기능을 사용하려면 Supabase Edge Function을 배포해야 합니다:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong>Supabase 대시보드</strong> 접속 (
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      https://supabase.com/dashboard
                    </a>
                    )
                  </li>
                  <li>프로젝트 선택 → <strong>Edge Functions</strong> 메뉴 클릭</li>
                  <li>
                    <code className="bg-amber-100 px-2 py-1 rounded">/supabase/functions/server/index.tsx</code> 파일을{' '}
                    <strong>"make-server-66444bd0"</strong> 이름으로 배포
                  </li>
                  <li>배포 완료 후 이 페이지를 새로고침하세요</li>
                </ol>
                <div className="mt-4 p-3 bg-amber-100 rounded border border-amber-300">
                  <p className="font-medium mb-1">💡 <strong>Supabase CLI 사용 (권장)</strong></p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto mt-2">
                    <div>supabase functions deploy make-server-66444bd0</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Management Cards */}
        <div className="space-y-4 mb-6">
          {complexes.map((complex, index) => {
            const gradientColors = [
              'bg-gradient-to-r from-orange-500 to-amber-500',
              'bg-gradient-to-r from-pink-500 to-rose-500',
              'bg-gradient-to-r from-blue-500 to-cyan-500',
              'bg-gradient-to-r from-teal-500 to-emerald-500',
              'bg-gradient-to-r from-purple-500 to-fuchsia-500',
              'bg-gradient-to-r from-indigo-500 to-blue-500',
            ];

            const isExpanded = expandedComplex === complex.id;
            const details = complexDetails[complex.id] || {
              progress: complex.progress,
              detailedProgress: {
                currentStatus: '',
                nextMilestone: '',
                expectedConstruction: '',
                expectedMoveIn: ''
              },
              timeline: []
            };

            return (
              <Card key={complex.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* 단지 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${gradientColors[index]}`}></div>
                        <h3 className="text-lg font-bold text-gray-900">{complex.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{complex.status}</p>
                    </div>

                    {/* 진행율 입력 */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          진행율:
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={progressValues[complex.id] ?? complex.progress}
                          onChange={(e) => handleProgressChange(complex.id, e.target.value)}
                          className="w-20 text-center font-bold text-blue-600"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>

                      {/* 저장 버튼 */}
                      <Button
                        onClick={() => handleSave(complex.id)}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        저장
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 ml-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${gradientColors[index]} transition-all duration-300`}
                        style={{ width: `${progressValues[complex.id] ?? complex.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 상세 정보 토글 버튼 */}
                  <div className="mt-4 ml-6">
                    <Button
                      variant="outline"
                      onClick={() => setExpandedComplex(isExpanded ? null : complex.id)}
                      className="w-full text-sm"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          상세 정보 숨기기
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          상세 정보 관리 (현재 진행 상황, 마일스톤, 일정 등)
                        </>
                      )}
                    </Button>
                  </div>

                  {/* 상세 정보 입력 영역 */}
                  {isExpanded && (
                    <div className="mt-6 ml-6 p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        진행율 현황 및 일정 관리
                      </h4>

                      {/* 현재 진행 상황 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          현재 진행 상황
                        </label>
                        <Input
                          placeholder="예: ✅ 특별정비구역 고시(1.19) 🔄 조합 설립인가 접수"
                          value={details.detailedProgress.currentStatus}
                          onChange={(e) => {
                            setComplexDetails(prev => ({
                              ...prev,
                              [complex.id]: {
                                ...prev[complex.id],
                                detailedProgress: {
                                  ...prev[complex.id].detailedProgress,
                                  currentStatus: e.target.value
                                }
                              }
                            }));
                          }}
                          className="w-full"
                        />
                      </div>

                      {/* 다음 마일스톤, 예상 착공, 입주 예상 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            다음 마일스톤
                          </label>
                          <Input
                            placeholder="예: 2026.9 조합인가"
                            value={details.detailedProgress.nextMilestone}
                            onChange={(e) => {
                              setComplexDetails(prev => ({
                                ...prev,
                                [complex.id]: {
                                  ...prev[complex.id],
                                  detailedProgress: {
                                    ...prev[complex.id].detailedProgress,
                                    nextMilestone: e.target.value
                                  }
                                }
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            예상 착공
                          </label>
                          <Input
                            placeholder="예: 2027.6"
                            value={details.detailedProgress.expectedConstruction}
                            onChange={(e) => {
                              setComplexDetails(prev => ({
                                ...prev,
                                [complex.id]: {
                                  ...prev[complex.id],
                                  detailedProgress: {
                                    ...prev[complex.id].detailedProgress,
                                    expectedConstruction: e.target.value
                                  }
                                }
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            입주 예상
                          </label>
                          <Input
                            placeholder="예: 2030.6"
                            value={details.detailedProgress.expectedMoveIn}
                            onChange={(e) => {
                              setComplexDetails(prev => ({
                                ...prev,
                                [complex.id]: {
                                  ...prev[complex.id],
                                  detailedProgress: {
                                    ...prev[complex.id].detailedProgress,
                                    expectedMoveIn: e.target.value
                                  }
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>

                      {/* 타임라인 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            상세 일정 (타임라인)
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setComplexDetails(prev => ({
                                ...prev,
                                [complex.id]: {
                                  ...prev[complex.id],
                                  timeline: [
                                    ...prev[complex.id].timeline,
                                    { date: '', event: '', status: 'planned' as const }
                                  ]
                                }
                              }));
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            일정 추가
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {details.timeline.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start p-3 bg-white rounded border border-gray-200">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                                <div className="md:col-span-2">
                                  <Input
                                    placeholder="날짜"
                                    value={item.date}
                                    onChange={(e) => {
                                      const newTimeline = [...details.timeline];
                                      newTimeline[idx] = { ...item, date: e.target.value };
                                      setComplexDetails(prev => ({
                                        ...prev,
                                        [complex.id]: {
                                          ...prev[complex.id],
                                          timeline: newTimeline
                                        }
                                      }));
                                    }}
                                    className="text-sm"
                                  />
                                </div>
                                <div className="md:col-span-7">
                                  <Input
                                    placeholder="이벤트 내용"
                                    value={item.event}
                                    onChange={(e) => {
                                      const newTimeline = [...details.timeline];
                                      newTimeline[idx] = { ...item, event: e.target.value };
                                      setComplexDetails(prev => ({
                                        ...prev,
                                        [complex.id]: {
                                          ...prev[complex.id],
                                          timeline: newTimeline
                                        }
                                      }));
                                    }}
                                    className="text-sm"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <select
                                    value={item.status}
                                    onChange={(e) => {
                                      const newTimeline = [...details.timeline];
                                      newTimeline[idx] = {
                                        ...item,
                                        status: e.target.value as 'completed' | 'ongoing' | 'planned'
                                      };
                                      setComplexDetails(prev => ({
                                        ...prev,
                                        [complex.id]: {
                                          ...prev[complex.id],
                                          timeline: newTimeline
                                        }
                                      }));
                                    }}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="completed">완료</option>
                                    <option value="ongoing">진행중</option>
                                    <option value="planned">예정</option>
                                  </select>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newTimeline = details.timeline.filter((_, i) => i !== idx);
                                  setComplexDetails(prev => ({
                                    ...prev,
                                    [complex.id]: {
                                      ...prev[complex.id],
                                      timeline: newTimeline
                                    }
                                  }));
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {details.timeline.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              일정이 없습니다. "일정 추가" 버튼을 클릭하여 추가하세요.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 상세 정보 저장 버튼 */}
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => handleSaveDetails(complex.id)}
                          disabled={saving}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          상세 정보 저장
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Save All Button */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">모든 변경사항 일괄 저장</h3>
                <p className="text-sm text-blue-100">
                  위에서 수정한 모든 진행율을 한 번에 저장합니다
                </p>
              </div>
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? '저장 중...' : '일괄 저장'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning Note */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              ⚠️ <strong>주의:</strong> 진행율 변경은 즉시 모든 사용자에게 반영됩니다. 정확한 정보만 입력해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}