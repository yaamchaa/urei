import { useState, useEffect } from "react";
import { Shield, RefreshCw, Search, AlertCircle, CheckCircle2, LogIn, UserPlus, Upload, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

interface SecurityLog {
  id: string;
  adminId: string;
  action: string;
  details: any;
  ipAddress: string;
  timestamp: string;
}

export function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/security-logs`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs || []);
      } else {
        toast.error("로그를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Logs fetch error:", error);
      toast.error("로그를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // 액션 필터
    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter((log) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          log.adminId.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN_SUCCESS":
        return <LogIn className="w-4 h-4 text-green-600" />;
      case "LOGIN_FAILED":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "ADMIN_REGISTER":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "IMAGE_UPLOAD":
        return <Upload className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN_SUCCESS":
        return <Badge className="bg-green-100 text-green-800">로그인 성공</Badge>;
      case "LOGIN_FAILED":
        return <Badge className="bg-red-100 text-red-800">로그인 실패</Badge>;
      case "ADMIN_REGISTER":
        return <Badge className="bg-blue-100 text-blue-800">관리자 등록</Badge>;
      case "IMAGE_UPLOAD":
        return <Badge className="bg-purple-100 text-purple-800">이미지 업로드</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const actionTypes = [
    { value: "all", label: "전체" },
    { value: "LOGIN_SUCCESS", label: "로그인 성공" },
    { value: "LOGIN_FAILED", label: "로그인 실패" },
    { value: "ADMIN_REGISTER", label: "관리자 등록" },
    { value: "IMAGE_UPLOAD", label: "이미지 업로드" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            보안 활동 로그
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            관리자의 모든 활동이 기록됩니다
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                검색
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="관리자 ID, 액션, 상세정보 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                액션 필터
              </label>
              <div className="flex flex-wrap gap-2">
                {actionTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={filterAction === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterAction(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">전체 로그</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">로그인 성공</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {logs.filter((l) => l.action === "LOGIN_SUCCESS").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">로그인 실패</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {logs.filter((l) => l.action === "LOGIN_FAILED").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">필터링된 로그</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {filteredLogs.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>활동 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">로그를 불러오는 중...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-500 mt-2">로그가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getActionIcon(log.action)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(log.action)}
                          <span className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">관리자:</span> {log.adminId}
                        </p>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">IP:</span> {log.ipAddress}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <p className="font-medium text-gray-700 mb-1">상세정보:</p>
                            <pre className="text-gray-600 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
