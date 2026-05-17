import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Key, Copy, Check, Trash2, RefreshCw, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { projectId } from "../../../utils/supabase/info";
import { adminFetch } from "../adminApi";

interface AuthCode {
  id: string;
  code: string;
  createdAt: string;
  status: "active" | "used" | "inactive";
  usedBy?: string;
  usedAt?: string;
}

interface AdminAccount {
  id: string;
  name: string;
  phone: string;
  department?: string;
  isPrimaryAdmin: boolean;
  isActive: boolean;
  createdAt?: string;
}

export function LoginManagementPage() {
  const navigate = useNavigate();
  const [authCodes, setAuthCodes] = useState<AuthCode[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadAuthCodes();
    loadAdmins();
  }, []);

  const loadAuthCodes = async () => {
    try {
      setLoading(true);

      const response = await adminFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/auth-codes`
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "인증번호를 불러오는데 실패했습니다.");
        return;
      }

      setAuthCodes(data.authCodes || []);
    } catch (error) {
      console.error("인증번호 로드 오류:", error);
      toast.error("인증번호를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true);

      const response = await adminFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/accounts`
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "관리자 계정 목록을 불러오는데 실패했습니다.");
        return;
      }

      setAdmins(data.admins || []);
    } catch (error) {
      console.error("관리자 계정 목록 로드 오류:", error);
      toast.error("관리자 계정 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const generateAuthCode = async () => {
    try {
      setCreating(true);

      const response = await adminFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/auth-codes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ count: 1 }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "인증번호 생성에 실패했습니다.");
        return;
      }

      toast.success("인증번호가 생성되었습니다!");
      await loadAuthCodes();
    } catch (error) {
      console.error("인증번호 생성 오류:", error);
      toast.error("인증번호 생성 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("인증번호가 복사되었습니다!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("복사 오류:", error);
      toast.error("복사에 실패했습니다.");
    }
  };

  const toggleStatus = (_id: string) => {
    toast.error("상태 변경 기능은 현재 사용할 수 없습니다.");
  };

  const deleteAuthCode = async (code: string) => {
    const confirmed = window.confirm(`인증번호 "${code}"를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      setDeletingCode(code);

      const response = await adminFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/auth-codes/${encodeURIComponent(code)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "인증번호 삭제에 실패했습니다.");
        return;
      }

      setAuthCodes((prev) => prev.filter((item) => item.code !== code));
      toast.success("인증번호가 삭제되었습니다.");
    } catch (error) {
      console.error("인증번호 삭제 오류:", error);
      toast.error("인증번호 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingCode(null);
    }
  };

  const deleteAdminAccount = async (admin: AdminAccount) => {
    const confirmed = window.confirm(
      `"${admin.name}" 관리자 계정을 삭제하시겠습니까?\n삭제 후에는 해당 계정으로 로그인할 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeletingAdmin(admin.id);

      const response = await adminFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/accounts/${admin.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "관리자 계정 삭제에 실패했습니다.");
        return;
      }

      setAdmins((prev) => prev.filter((item) => item.id !== admin.id));
      toast.success("관리자 계정이 삭제되었습니다.");
    } catch (error) {
      console.error("관리자 계정 삭제 오류:", error);
      toast.error("관리자 계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingAdmin(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            활성
          </span>
        );
      case "used":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            사용됨
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            비활성
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">로그인 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            신규 관리자 계정 등록에 필요한 인증번호를 생성하고 관리합니다.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              인증번호 생성
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              새로운 관리자를 등록하려면 인증번호를 생성하여 전달해주세요.
              생성된 인증번호는 한 번만 사용할 수 있으며, 회원가입 시 입력해야 합니다.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={generateAuthCode}
                disabled={creating}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${creating ? "animate-spin" : ""}`} />
                {creating ? "생성 중..." : "인증번호 생성"}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/admin/register")}
              >
                관리자 계정 추가
              </Button>

              <Button
                variant="outline"
                onClick={loadAuthCodes}
                disabled={loading}
              >
                인증번호 목록 새로고침
              </Button>

              <Button
                variant="outline"
                onClick={loadAdmins}
                disabled={loadingAdmins}
              >
                관리자 계정 목록 새로고침
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                등록된 관리자 계정 목록
              </span>
              <span className="text-sm font-normal text-gray-500">
                총 {admins.length}개
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAdmins ? (
              <div className="text-center py-8">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">등록된 관리자 계정이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리자명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        전화번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        부서
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        권한
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등록일시
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {admin.name}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {admin.phone}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {admin.department || "-"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {admin.isPrimaryAdmin ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              기본 관리자
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              추가 관리자
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {admin.createdAt ? formatDate(admin.createdAt) : "-"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {admin.isPrimaryAdmin ? (
                            <span className="text-xs text-gray-400">
                              삭제 불가
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAdminAccount(admin)}
                              disabled={deletingAdmin === admin.id}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              {deletingAdmin === admin.id ? "삭제 중..." : "계정 삭제"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>생성된 인증번호 목록</span>
              <span className="text-sm font-normal text-gray-500">
                총 {authCodes.length}개
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : authCodes.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">생성된 인증번호가 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">
                  위의 "인증번호 생성" 버튼을 클릭하여 새로운 인증번호를 만드세요.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        인증번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일시
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용 정보
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {authCodes.map((ac) => (
                      <tr key={ac.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-semibold text-gray-900">
                              {ac.code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(ac.code)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="복사"
                              type="button"
                            >
                              {copiedCode === ac.code ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(ac.createdAt)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(ac.status)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ac.status === "used" && ac.usedBy ? (
                            <div>
                              <div>{ac.usedBy}</div>
                              {ac.usedAt && (
                                <div className="text-xs text-gray-400">
                                  {formatDate(ac.usedAt)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {ac.status !== "used" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleStatus(ac.id)}
                                className="flex items-center gap-1"
                              >
                                {ac.status === "active" ? "비활성화" : "활성화"}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAuthCode(ac.code)}
                              disabled={deletingCode === ac.code}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              {deletingCode === ac.code ? "삭제 중..." : "삭제"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              💡 사용 방법
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. "인증번호 생성" 버튼을 클릭하여 새로운 인증번호를 만듭니다.</li>
              <li>2. 생성된 인증번호를 복사하여 신규 관리자에게 전달합니다.</li>
              <li>3. 신규 관리자는 회원가입 시 전달받은 인증번호를 입력합니다.</li>
              <li>4. 신규 관리자 계정이 등록되면 "등록된 관리자 계정 목록"에서 확인할 수 있습니다.</li>
              <li>5. 더 이상 사용하지 않는 추가 관리자 계정은 "계정 삭제" 버튼으로 삭제할 수 있습니다.</li>
              <li>6. 기본 관리자 계정은 삭제할 수 없습니다.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}