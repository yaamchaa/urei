import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  User,
  Phone,
  Edit2,
  Check,
  X,
  MessageSquare,
  Shield,
  Clock,
  Settings,
  Building2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useUser } from "../contexts/UserContext";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target?: string;
  details?: string;
  timestamp: string;
  date: string;
  time: string;
}

export function ProfilePage() {
  const { user, setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);

  const isAdmin = user?.complexId === "admin" || user?.role === "admin";

  const [editForm, setEditForm] = useState({
    phone: user?.phone || "",
    password: "",
    passwordConfirm: "",
  });

  const [originalData, setOriginalData] = useState({
    phone: user?.phone || "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) return;

    setEditForm({
      phone: user.phone || "",
      password: "",
      passwordConfirm: "",
    });

    setOriginalData({
      phone: user.phone || "",
    });

    if (isAdmin && user.memberId) {
      loadAdminLogs(user.memberId);
    }
  }, [user, isAdmin]);

  const loadAdminLogs = async (adminId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/logs/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAdminLogs(data.logs || []);
      } else {
        const errorData = await response.json();
        console.error("활동 로그를 불러오는데 실패했습니다:", errorData);
      }
    } catch (error) {
      console.error("활동 로그 로드 오류:", error);
    }
  };

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "비밀번호는 최소 8자 이상이어야 합니다.";
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const validCount = [
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (validCount < 3) {
      return "비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.";
    }

    return "";
  };

  const handleEditClick = () => {
    if (!isAdmin) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      phone: originalData.phone,
      password: "",
      passwordConfirm: "",
    });
  };

  const handleSaveClick = async () => {
    if (!user || !isAdmin) return;

    const trimmedPhone = editForm.phone.trim();
    const trimmedPassword = editForm.password.trim();
    const trimmedPasswordConfirm = editForm.passwordConfirm.trim();

    if (!trimmedPhone) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    if (trimmedPassword || trimmedPasswordConfirm) {
      if (trimmedPassword !== trimmedPasswordConfirm) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      const passwordError = validatePassword(trimmedPassword);
      if (passwordError) {
        alert(passwordError);
        return;
      }
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            adminId: user.memberId,
            phone: trimmedPhone,
            ...(trimmedPassword ? { password: trimmedPassword } : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "내 정보 저장에 실패했습니다.");
        return;
      }

      const admin = data.admin;

      const updatedUser = {
        ...user,
        phone: admin.phone,
      };

      setUser(updatedUser);

      setOriginalData({
        phone: admin.phone,
      });

      setEditForm({
        phone: admin.phone,
        password: "",
        passwordConfirm: "",
      });

      setIsEditing(false);
      alert("✅ 내 정보가 저장되었습니다.");
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      alert("내 정보 저장 중 오류가 발생했습니다.");
    }
  };

  const loginLogs = adminLogs.filter((log) => log.action === "login");
  const settingLogs = adminLogs.filter((log) => log.action !== "login");

  const getActionLabel = (action: string): string => {
    const labels: { [key: string]: string } = {
      update_progress: "진행율 수정",
      update_timeline: "추진일정 수정",
      update_school: "학군정보 수정",
      update_transport: "교통정보 수정",
      update_notes: "비고 수정",
      create_news: "뉴스 생성",
      update_news: "뉴스 수정",
      delete_news: "뉴스 삭제",
      create_poll: "투표 생성",
      update_poll: "투표 수정",
      delete_poll: "투표 삭제",
    };
    return labels[action] || action;
  };

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">로그인이 필요합니다.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/")}>
              홈으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>내 정보 | 성남시 개발 톡톡</title>
        <meta
          name="description"
          content="관리자 프로필 및 활동 내역을 확인하고 관리하세요"
        />
        <link
          rel="canonical"
          href={`${window.location.origin}${window.location.pathname}`}
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 정보</h1>
          <p className="text-gray-600">
            {isAdmin ? "관리자 프로필 및 활동 내역" : "Any-ID 기반 이용 상태"}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              {isAdmin ? "프로필 정보" : "이용 정보"}
            </CardTitle>

            {isAdmin && !isEditing ? (
              <Button onClick={handleEditClick} variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                수정
              </Button>
            ) : isAdmin && isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSaveClick} size="sm">
                  <Check className="w-4 h-4 mr-2" />
                  저장
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
              </div>
            ) : null}
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {isAdmin && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    ⚠️수정 가능 항목 안내
                  </p>
                  <p className="text-sm text-blue-700">
                    ⚠️이름과 부서는 변경할 수 없으며, 전화번호와 비밀번호만 수정할 수 있습니다.
                  </p>
                  <p className="text-sm text-blue-700">
                    ⚠️관계 부서의 최종 관리자 승인 없이 변경 시 법적인 문제가 발생할 수 있습니다.
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isAdmin ? "이름" : "표시 상태"}
                </Label>
                <p className="text-gray-900 py-2">
                  {isAdmin ? user.name || "-" : "Any-ID 인증 완료"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isAdmin ? "부서" : "인증 방식"}
                </Label>
                <div className="flex items-center gap-2 py-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">
                    {isAdmin ? user.address || "-" : "Any-ID 인증 사용자"}
                  </p>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  {isAdmin ? "전화번호" : "개인정보 노출"}
                </Label>
                {isAdmin && isEditing ? (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="010-0000-0000"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">
                      {isAdmin ? user.phone || "-" : "비공개"}
                    </p>
                  </div>
                )}
              </div>

              {isAdmin && isEditing && (
                <>
                  <div>
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      새 비밀번호
                    </Label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={editForm.password}
                        onChange={(e) =>
                          setEditForm({ ...editForm, password: e.target.value })
                        }
                        placeholder="변경 시에만 입력하세요"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      영문 대소문자, 숫자, 특수문자 중 3가지 이상 포함, 최소 8자
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="passwordConfirm"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      새 비밀번호 확인
                    </Label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <Input
                        id="passwordConfirm"
                        type="password"
                        value={editForm.passwordConfirm}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            passwordConfirm: e.target.value,
                          })
                        }
                        placeholder="새 비밀번호를 다시 입력하세요"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isAdmin ? "권한" : "이용 권한"}
                </Label>
                <div className="flex items-center gap-2 py-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <Badge variant="secondary" className="text-sm">
                    {isAdmin ? "최종 관리자" : "시민 사용자"}
                  </Badge>
                </div>
              </div>

              {!isAdmin && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Any-ID 기반 이용 안내
                  </p>
                  <p className="text-sm text-blue-700">
                    시민 사용자는 별도 회원가입 없이 Any-ID 인증으로만 서비스를
                    이용하며, 이 페이지에서는 개인정보를 표시하거나 수정하지
                    않습니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>활동 내역</CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <Tabs defaultValue="logins">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="logins">
                    <Clock className="w-4 h-4 mr-2" />
                    로그인 기록 ({loginLogs.length})
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="w-4 h-4 mr-2" />
                    설정 변경 기록 ({settingLogs.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="logins" className="space-y-3 mt-4">
                  {loginLogs.length > 0 ? (
                    loginLogs.map((log) => (
                      <Card key={log.id} className="border border-gray-200">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">로그인</p>
                                <p className="text-sm text-gray-600">{log.adminName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{log.date}</p>
                              <p className="text-sm text-gray-500">{log.time}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>로그인 기록이 없습니다.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-3 mt-4">
                  {settingLogs.length > 0 ? (
                    settingLogs.map((log) => (
                      <Card key={log.id} className="border border-gray-200">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {getActionLabel(log.action)}
                                </Badge>
                                {log.target && (
                                  <Badge variant="secondary" className="text-xs">
                                    {log.target}
                                  </Badge>
                                )}
                              </div>
                              {log.details && (
                                <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{log.adminName}</span>
                                <span>•</span>
                                <span>
                                  {log.date} {log.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>설정 변경 기록이 없습니다.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>시민 사용자의 활동 내역은 이 페이지에 표시되지 않습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}