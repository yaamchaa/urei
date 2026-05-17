import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Building2, Plus, Trash2, Save, AlertCircle, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { allComplexes, getCategoryName } from "../data/complexes";

interface SimpleComplex {
  id: string;
  name: string;
  status: string;
  progress: number;
  householdsBefore: string;
  householdsAfter: string;
}

export function ComplexSelectionManagementPage() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'bundang';
  const categoryName = getCategoryName(category);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complexList, setComplexList] = useState<SimpleComplex[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newComplex, setNewComplex] = useState<Partial<SimpleComplex>>({
    name: '',
    status: '',
    progress: 0,
    householdsBefore: '',
    householdsAfter: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // 삭제 확인 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complexToDelete, setComplexToDelete] = useState<SimpleComplex | null>(null);

  useEffect(() => {
    loadComplexList();
  }, [category]);

  const loadComplexList = async () => {
    setLoading(true);
    try {
      // category에 따라 다른 엔드포인트 호출
      const endpoint = category !== 'bundang' ? `complex-list-${category}` : 'complex-list';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.complexList && data.complexList.length > 0) {
          setComplexList(data.complexList);
        } else {
          // category별 기본값
          const defaultList = getDefaultComplexes();
          setComplexList(defaultList);
        }
      } else {
        const defaultList = getDefaultComplexes();
        setComplexList(defaultList);
      }
    } catch (error) {
      console.error("단지 목록 로드 실패:", error);
      const defaultList = getDefaultComplexes();
      setComplexList(defaultList);
    } finally {
      setLoading(false);
    }
  };
  
  const getDefaultComplexes = () => {
    if (category === 'bundang') {
      // 분당 재건축: 기본 4개
      return allComplexes
        .filter(c => ['sibeom2', 'saetbyeol', 'mokyeon1', 'yangji'].includes(c.id))
        .map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          progress: c.progress,
          householdsBefore: c.householdsBefore,
          householdsAfter: c.householdsAfter
        }));
    } else {
      // 다른 카테고리: 해당 카테고리의 모든 단지
      return allComplexes
        .filter(c => c.category === category)
        .map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          progress: c.progress,
          householdsBefore: c.householdsBefore,
          householdsAfter: c.householdsAfter
        }));
    }
  };

  const handleAddComplex = () => {
    if (!newComplex.name || !newComplex.status) {
      setMessage({ type: 'error', text: '❌ 단지명과 상태는 필수입니다.' });
      return;
    }

    const id = `complex_${Date.now()}`;
    const complex: SimpleComplex = {
      id,
      name: newComplex.name,
      status: newComplex.status,
      progress: newComplex.progress || 0,
      householdsBefore: newComplex.householdsBefore || '-',
      householdsAfter: newComplex.householdsAfter || '-'
    };

    setComplexList([...complexList, complex]);
    setNewComplex({
      name: '',
      status: '',
      progress: 0,
      householdsBefore: '',
      householdsAfter: ''
    });
    setMessage({ type: 'success', text: '✅ 단지가 추가되었습니다. 저장 버튼을 클릭하세요.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteComplex = (id: string) => {
    setComplexList(complexList.filter(c => c.id !== id));
    setMessage({ type: 'success', text: '✅ 단지가 삭제되었습니다. 저장 버튼을 클릭하세요.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateComplex = (id: string, field: keyof SimpleComplex, value: string | number) => {
    setComplexList(complexList.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // category에 따라 다른 엔드포인트 호출
      const endpoint = category !== 'bundang' ? `complex-list-${category}` : 'complex-list';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/${endpoint}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ complexList }),
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
                action: "update_complex_list",
                target: "선도지구 단지목록",
                details: `${complexList.length}개 단지 관리`
              })
            }
          );
        } catch (logError) {
          console.error('활동 로그 저장 실패:', logError);
        }
      }

      setMessage({ type: 'success', text: '✅ 단지목록이 저장되었습니다.' });
      setTimeout(() => setMessage(null), 3000);

      // 페이지 새로고침 이벤트 발생
      window.dispatchEvent(new CustomEvent('complexListUpdated'));
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
        <title>{categoryName} - 단지선택 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content={`${categoryName} 정비사업 현황 페이지에 표시할 단지를 선택합니다`} />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            {categoryName} - 단지선택 관리
          </h1>
          <p className="text-gray-600">{categoryName} 정비사업 현황 페이지의 단지 선택 드롭다운에 표시할 단지를 관리하세요</p>
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
              💡 <strong>안내:</strong> 여기서 등록한 단지만 정비사업 현황 페이지의 단지 선택 드롭다운에 표시됩니다.
            </p>
          </CardContent>
        </Card>

        {/* Add New Complex */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              새 단지 추가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name">단지명 *</Label>
                <Input
                  id="new-name"
                  value={newComplex.name || ''}
                  onChange={(e) => setNewComplex({ ...newComplex, name: e.target.value })}
                  placeholder="예: 시범단지2"
                />
              </div>
              <div>
                <Label htmlFor="new-status">상태 *</Label>
                <Input
                  id="new-status"
                  value={newComplex.status || ''}
                  onChange={(e) => setNewComplex({ ...newComplex, status: e.target.value })}
                  placeholder="예: 특별정비구역 지정 완료"
                />
              </div>
              <div>
                <Label htmlFor="new-progress">진행율 (%)</Label>
                <Input
                  id="new-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={newComplex.progress || 0}
                  onChange={(e) => setNewComplex({ ...newComplex, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="new-before">기존 세대수</Label>
                <Input
                  id="new-before"
                  value={newComplex.householdsBefore || ''}
                  onChange={(e) => setNewComplex({ ...newComplex, householdsBefore: e.target.value })}
                  placeholder="예: 3,569가구"
                />
              </div>
              <div>
                <Label htmlFor="new-after">예정 세대수</Label>
                <Input
                  id="new-after"
                  value={newComplex.householdsAfter || ''}
                  onChange={(e) => setNewComplex({ ...newComplex, householdsAfter: e.target.value })}
                  placeholder="예: 6,049가구"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleAddComplex}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                단지 추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Complex List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>등록된 단지 목록 ({complexList.length}개)</span>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "저장 중..." : "저장"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complexList.length === 0 ? (
              <p className="text-center text-gray-500 py-8">등록된 단지가 없습니다. 위에서 새 단지를 추가하세요.</p>
            ) : (
              <div className="space-y-3">
                {complexList.map((complex) => (
                  <div
                    key={complex.id}
                    className="p-4 rounded-lg border-2 border-gray-200 bg-white"
                  >
                    {editingId === complex.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">단지명</Label>
                            <Input
                              value={complex.name}
                              onChange={(e) => handleUpdateComplex(complex.id, 'name', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">상태</Label>
                            <Input
                              value={complex.status}
                              onChange={(e) => handleUpdateComplex(complex.id, 'status', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">진행율 (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={complex.progress}
                              onChange={(e) => handleUpdateComplex(complex.id, 'progress', parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">기존 세대수</Label>
                            <Input
                              value={complex.householdsBefore}
                              onChange={(e) => handleUpdateComplex(complex.id, 'householdsBefore', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">예정 세대수</Label>
                            <Input
                              value={complex.householdsAfter}
                              onChange={(e) => handleUpdateComplex(complex.id, 'householdsAfter', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setEditingId(null)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            완료
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{complex.name}</h3>
                          <p className="text-sm text-gray-600">{complex.status}</p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-500">진행율: {complex.progress}%</span>
                            <span className="text-xs text-gray-500">{complex.householdsBefore} → {complex.householdsAfter}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(complex.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDeleteDialogOpen(true);
                              setComplexToDelete(complex);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                단지 삭제 확인
              </DialogTitle>
              <DialogDescription>
                이 작업은 되돌릴 수 없습니다. 정말로 이 단지를 삭제하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            
            {complexToDelete && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{complexToDelete.name}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>상태: {complexToDelete.status}</p>
                  <p>진행율: {complexToDelete.progress}%</p>
                  <p>세대수: {complexToDelete.householdsBefore} → {complexToDelete.householdsAfter}</p>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setComplexToDelete(null);
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (complexToDelete) {
                    handleDeleteComplex(complexToDelete.id);
                  }
                  setDeleteDialogOpen(false);
                  setComplexToDelete(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제 확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}