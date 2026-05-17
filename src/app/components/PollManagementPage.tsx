import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { BarChart3, Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { useComplexList } from "../hooks/useComplexList";
import { useSearchParams } from "react-router";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";

interface Poll {
  id: string;
  title: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  endDate: string;
  isActive: boolean;
  complexId: string;
  category: string; // category 필드 추가
}

export function PollManagementPage() {
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
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newPoll, setNewPoll] = useState({
    title: "",
    options: ["", "", ""],
    endDate: "",
    complexId: ""
  });

  useEffect(() => {
    loadPolls();
  }, [category]); // category가 변경될 때마다 투표 목록 다시 로드

  const loadPolls = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/polls?category=${category}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPolls(data);
      }
    } catch (error) {
      console.error("투표 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async () => {
    if (!newPoll.complexId) {
      alert("단지를 선택해주세요.");
      return;
    }

    if (!newPoll.title || !newPoll.endDate) {
      alert("제목과 마감일을 입력해주세요.");
      return;
    }

    const validOptions = newPoll.options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      alert("최소 2개의 선택지를 입력해주세요.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/polls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newPoll.title,
            options: validOptions.map(text => ({ text, votes: 0 })),
            endDate: newPoll.endDate,
            complexId: newPoll.complexId,
            category: category // category 필드 추가
          }),
        }
      );

      if (response.ok) {
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
                  action: "create_poll",
                  target: "투표",
                  details: newPoll.title
                })
              }
            );
            console.log('✅ 활동 로그 저장 완료');
          } catch (logError) {
            console.error('활동 로그 저장 실패:', logError);
          }
        }

        alert("✅ 투표가 생성되었습니다.");
        setIsCreateDialogOpen(false);
        setNewPoll({ title: "", options: ["", "", ""], endDate: "", complexId: "" });
        loadPolls();
      } else {
        alert("❌ 투표 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("투표 생성 오류:", error);
      alert("❌ 투표 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePoll = async () => {
    if (!editingPoll) return;

    if (!editingPoll.title || !editingPoll.endDate) {
      alert("제목과 마감일을 입력해주세요.");
      return;
    }

    const validOptions = editingPoll.options.filter(opt => opt.text.trim() !== "");
    if (validOptions.length < 2) {
      alert("최소 2개의 선택지를 입력해주세요.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/polls/${editingPoll.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editingPoll.title,
            options: validOptions,
            endDate: editingPoll.endDate,
            isActive: editingPoll.isActive,
            complexId: editingPoll.complexId,
            category: category // category 필드 추가
          }),
        }
      );

      if (response.ok) {
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
                  action: "update_poll",
                  target: "투표",
                  details: editingPoll.title
                })
              }
            );
            console.log('✅ 활동 로그 저장 완료');
          } catch (logError) {
            console.error('활동 로그 저장 실패:', logError);
          }
        }

        alert("✅ 투표가 수정되었습니다.");
        setIsEditDialogOpen(false);
        setEditingPoll(null);
        loadPolls();
      } else {
        alert("❌ 투표 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("투표 수정 오류:", error);
      alert("❌ 투표 수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("정말 이 투표를 삭제하시겠습니까?")) return;

    const poll = polls.find(p => p.id === pollId);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/polls/${pollId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        // 관리자 활동 로그 기록
        if (user?.complexId === "admin" && user?.memberId && poll) {
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
                  action: "delete_poll",
                  target: "투표",
                  details: poll.title
                })
              }
            );
            console.log('✅ 활동 로그 저장 완료');
          } catch (logError) {
            console.error('활동 로그 저장 실패:', logError);
          }
        }

        alert("✅ 투표가 삭제되었습니다.");
        loadPolls();
      } else {
        alert("❌ 투표 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("투표 삭제 오류:", error);
      alert("❌ 투표 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEditClick = (poll: Poll) => {
    setEditingPoll(poll);
    setIsEditDialogOpen(true);
  };

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const addEditOption = () => {
    if (!editingPoll) return;
    setEditingPoll({
      ...editingPoll,
      options: [...editingPoll.options, { text: "", votes: 0 }]
    });
  };

  const removeOption = (index: number) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const removeEditOption = (index: number) => {
    if (!editingPoll) return;
    setEditingPoll({
      ...editingPoll,
      options: editingPoll.options.filter((_, i) => i !== index)
    });
  };

  const updateOption = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const updateEditOption = (index: number, value: string) => {
    if (!editingPoll) return;
    setEditingPoll({
      ...editingPoll,
      options: editingPoll.options.map((opt, i) => 
        i === index ? { ...opt, text: value } : opt
      )
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>{categoryName} 투표 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="시민광장 투표를 생성하고 관리하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{categoryName} 투표 관리</h1>
          <p className="text-gray-600 mt-2">시민광장 투표를 생성하고 관리합니다.</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          새 투표 만들기
        </Button>
      </div>

      {/* Polls List */}
      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">등록된 투표가 없습니다.</p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-4"
            >
              첫 투표 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {polls.map((poll) => (
            <Card key={poll.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{poll.title}</CardTitle>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {complexes.find(c => c.id === poll.complexId)?.name || "단지 미지정"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>마감일: {poll.endDate}</span>
                    <span className="flex items-center gap-1">
                      {poll.isActive ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">진행중</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 font-medium">마감됨</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(poll)}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePoll(poll.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {poll.options.map((option, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{option.text}</span>
                      <span className="text-gray-600 font-medium">{option.votes} 표</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">총 투표수: <span className="font-semibold">{poll.totalVotes}</span>표</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Poll Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 투표 만들기</DialogTitle>
            <DialogDescription>
              시민광장에 시될 투표를 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="complexId">단지 선택 *</Label>
              <Select
                value={newPoll.complexId}
                onValueChange={(value) => setNewPoll(prev => ({ ...prev, complexId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="투표를 생성할 단지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {complexes.map((complex) => (
                    <SelectItem key={complex.id} value={complex.id}>
                      {complex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">투표 제목 *</Label>
              <Input
                id="title"
                value={newPoll.title}
                onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
                placeholder="예: 시범단지 학교 신설 vs 기존 학교 증축"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="endDate">마감일 *</Label>
              <Input
                id="endDate"
                type="date"
                value={newPoll.endDate}
                onChange={(e) => setNewPoll(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>선택지 (최소 2개) *</Label>
              <div className="space-y-2 mt-2">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`선택지 ${index + 1}`}
                    />
                    {newPoll.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  선택지 추가
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreatePoll} className="flex items-center gap-2" disabled={isCreating}>
              <Save className="w-4 h-4" />
              {isCreating ? "생성 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Poll Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>투표 수정</DialogTitle>
            <DialogDescription>
              투표 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          {editingPoll && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-complexId">단지 선택 *</Label>
                <Select
                  value={editingPoll.complexId}
                  onValueChange={(value) => setEditingPoll({ ...editingPoll, complexId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="투표가 표시될 단지를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {complexes.map((complex) => (
                      <SelectItem key={complex.id} value={complex.id}>
                        {complex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-title">투표 제목 *</Label>
                <Input
                  id="edit-title"
                  value={editingPoll.title}
                  onChange={(e) => setEditingPoll({ ...editingPoll, title: e.target.value })}
                  placeholder="투표 제목"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-endDate">마감일 *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editingPoll.endDate}
                  onChange={(e) => setEditingPoll({ ...editingPoll, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>선택지 (최소 2개) *</Label>
                <div className="space-y-2 mt-2">
                  {editingPoll.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updateEditOption(index, e.target.value)}
                        placeholder={`선택지 ${index + 1}`}
                      />
                      <Input
                        type="number"
                        value={option.votes}
                        onChange={(e) => {
                          const votes = parseInt(e.target.value) || 0;
                          setEditingPoll({
                            ...editingPoll,
                            options: editingPoll.options.map((opt, i) => 
                              i === index ? { ...opt, votes } : opt
                            )
                          });
                        }}
                        placeholder="투표수"
                        className="w-24"
                      />
                      {editingPoll.options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEditOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEditOption}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    선택지 추가
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingPoll.isActive}
                  onChange={(e) => setEditingPoll({ ...editingPoll, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  진행중 (체크 해제 시 마감됨으로 표시)
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdatePoll} className="flex items-center gap-2" disabled={isUpdating}>
              <Save className="w-4 h-4" />
              {isUpdating ? "수정 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}