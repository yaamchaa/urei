import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Shield, Settings, Building2, MessageSquare, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { complexes } from "../data/complexes";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { getAdminApiToken } from "../adminApi";
import { getCsrfToken } from "../utils/csrf";

interface Settings {
  selectedComplexId?: string;
}

// 알리고 SMS 설정 타입
interface AligoConfig {
  apiKey: string;
  userId: string;
  sender: string;
}

// 저장된 설정 상태 (마스킹된 값)
interface AligoConfigStatus {
  isConfigured: boolean;
  apiKeyMasked: string;   // 저장된 Key 마지막 4자리만 표시
  userId: string;
  sender: string;
}

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0`;

export function SettingsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [settings] = useState<Settings>({});
  const [selectedComplex, setSelectedComplex] = useState(
    settings.selectedComplexId || "sibeom2"
  );

  const [aligoForm, setAligoForm] = useState<AligoConfig>({
    apiKey: "",
    userId: "",
    sender: "",
  });

  // ── 알리고 SMS 설정 상태 ──────────────────────────
  const [showApiKey, setShowApiKey] = useState(false);
  const [aligoStatus, setAligoStatus] = useState<AligoConfigStatus | null>(null);
  const [aligoLoading, setAligoLoading] = useState(false);
  const [aligoSaveMsg, setAligoSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 저장된 알리고 설정 현황 로드 (마스킹된 값만 반환)
  useEffect(() => {
    const loadAligoStatus = async () => {
      try {
        const res = await fetch(`${BASE_URL}/sms-auth/config`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            apikey: publicAnonKey,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAligoStatus(data);
        } else {
          setAligoStatus({
            isConfigured: false,
            apiKeyMasked: "",
            userId: "",
            sender: "",
          });
        }
      } catch {
        setAligoStatus({
          isConfigured: false,
          apiKeyMasked: "",
          userId: "",
          sender: "",
        });
      }
    };

    loadAligoStatus();
  }, []);

  // 알리고 설정 저장
  const handleSaveAligoConfig = async () => {
    const adminApiToken = getAdminApiToken();
    const csrfToken = getCsrfToken();

    if (!adminApiToken) {
      setAligoSaveMsg({
        type: "error",
        text: "관리자 로그인 세션이 없습니다. 다시 로그인해주세요.",
      });
      return;
    }

    if (!csrfToken) {
      setAligoSaveMsg({
        type: "error",
        text: "보안 토큰이 없습니다. 다시 로그인해주세요.",
      });
      return;
    }

    if (
      !aligoForm.apiKey.trim() ||
      !aligoForm.userId.trim() ||
      !aligoForm.sender.trim()
    ) {
      setAligoSaveMsg({
        type: "error",
        text: "API Key, 아이디, 발신번호를 모두 입력해주세요.",
      });
      return;
    }

    const normalizedSender = aligoForm.sender.replace(/-/g, "").trim();

    if (!/^01[016789]\d{7,8}$/.test(normalizedSender)) {
      setAligoSaveMsg({
        type: "error",
        text: "발신번호는 알리고에 등록된 발신번호를 정확히 입력해주세요. (예: 01012345678)",
      });
      return;
    }

    setAligoLoading(true);
    setAligoSaveMsg(null);

    try {
      const res = await fetch(`${BASE_URL}/sms-auth/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminApiToken}`,
          apikey: publicAnonKey,
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          apiKey: aligoForm.apiKey.trim(),
          userId: aligoForm.userId.trim(),
          sender: normalizedSender,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAligoSaveMsg({
          type: "success",
          text: "✅ 알리고 SMS 설정이 저장되었습니다. 즉시 적용됩니다.",
        });

        setAligoForm({ apiKey: "", userId: "", sender: "" });
        
        // 상태 갱신 (마스킹)
        setAligoStatus(
          data.config || {
            isConfigured: true,
            apiKeyMasked: aligoForm.apiKey.trim().slice(-4),
            userId: aligoForm.userId.trim(),
            sender: normalizedSender,
          }
        );
      } else {
        setAligoSaveMsg({
          type: "error",
          text: data.error || "저장에 실패했습니다. 다시 시도해주세요.",
        });
      }
    } catch {
      setAligoSaveMsg({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setAligoLoading(false);
    }
  };

  // SMS 테스트 발송
  const handleTestSms = async () => {
    const adminApiToken = getAdminApiToken();
    const csrfToken = getCsrfToken();

    if (!adminApiToken) {
      setTestMsg({
        type: "error",
        text: "관리자 로그인 세션이 없습니다. 다시 로그인해주세요.",
      });
      return;
    }

    if (!csrfToken) {
      setTestMsg({
        type: "error",
        text: "보안 토큰이 없습니다. 다시 로그인해주세요.",
      });
      return;
    }

    const phone = testPhone.replace(/-/g, "").trim();

    if (!/^01[016789]\d{7,8}$/.test(phone)) {
      setTestMsg({
        type: "error",
        text: "올바른 휴대폰 번호를 입력해주세요.",
      });
      return;
    }

    setTestLoading(true);
    setTestMsg(null);

    try {
      const res = await fetch(`${BASE_URL}/sms-auth/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminApiToken}`,
          apikey: publicAnonKey,
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setTestMsg({
          type: "success",
          text: `✅ 테스트 문자가 ${testPhone}으로 발송되었습니다.`,
        });
        setTestPhone("");
      } else {
        setTestMsg({
          type: "error",
          text: data.error || "테스트 발송에 실패했습니다.",
        });
      }
    } catch {
      setTestMsg({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>시스템 설정 | 성남시 개발 톡톡</title>
        <meta
          name="description"
          content="단지 기준 시스템 설정 및 운영 안내를 확인하세요"
        />
        <link
          rel="canonical"
          href={`${window.location.origin}${window.location.pathname}`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
          <p className="text-gray-600">단지 기준 시스템 설정 및 운영 안내</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">운영 단지 수</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {complexes.length}개
                  </p>
                </div>
                <Building2 className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">인증 방식</p>
                  <p className="text-xl font-bold text-green-600">SMS 인증</p>
                </div>
                <Shield className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">설정 상태</p>
                  <p className="text-xl font-bold text-purple-600">운영 중</p>
                </div>
                <Settings className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              단지별 운영 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedComplex} onValueChange={setSelectedComplex}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
                {complexes.map((complex) => (
                  <TabsTrigger key={complex.id} value={complex.id}>
                    {complex.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {complexes.map((complex) => (
                <TabsContent key={complex.id} value={complex.id}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {complex.name} 운영 정보
                      </h3>
                      <Badge variant="secondary">SMS 인증 적용</Badge>
                    </div>

                    <Card className="border border-gray-200">
                      <CardContent className="py-6 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            인증 정책
                          </p>
                          <p className="text-sm text-gray-600">
                            시민 사용자는 별도 회원가입 없이 SMS 인증 인증으로만
                            서비스를 이용합니다.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            개인정보 처리 원칙
                          </p>
                          <p className="text-sm text-gray-600">
                            설정 화면에서는 시민 개별 이름, 전화번호, 주소,
                            가입일, 인증 상태 등 개인정보를 표시하지 않습니다.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            운영 기준
                          </p>
                          <p className="text-sm text-gray-600">
                            단지별 서비스 운영은 공지, 투표, 소통 기능 중심으로
                            제공되며, 시민 계정 기반 회원 관리 기능은 사용하지
                            않습니다.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* ── 알리고 SMS 설정 카드 ── */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-600" />
              SMS 인증 설정 (알리고 Aligo)
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              알리고에서 발급받은 API Key를 입력하면 즉시 SMS 시민 인증이 활성화됩니다.
              API Key는 서버에 암호화 저장되며 이 화면에는 노출되지 않습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* 현재 설정 상태 */}
            <div className="p-4 rounded-lg border bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-3">현재 설정 상태</p>
              {aligoStatus === null ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> 상태 확인 중...
                </div>
              ) : aligoStatus.isConfigured ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">SMS 인증 서비스 활성화됨</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-gray-600">
                    <div><span className="font-medium">API Key:</span> ****{aligoStatus.apiKeyMasked}</div>
                    <div><span className="font-medium">아이디:</span> {aligoStatus.userId}</div>
                    <div><span className="font-medium">발신번호:</span> {aligoStatus.sender}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>아직 설정되지 않았습니다. 아래에서 API Key를 등록해주세요.</span>
                </div>
              )}
            </div>

            {/* API Key 입력 폼 */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-800">
                {aligoStatus?.isConfigured ? "API Key 변경" : "API Key 신규 등록"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="aligo-api-key" className="text-sm font-medium">
                    알리고 API Key <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="aligo-api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="알리고에서 발급받은 API Key"
                      value={aligoForm.apiKey}
                      onChange={(e) =>
                        setAligoForm((f) => ({ ...f, apiKey: e.target.value }))
                      }
                      className="pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showApiKey ? "API Key 숨기기" : "API Key 표시"}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 알리고 아이디 */}
                <div>
                  <Label htmlFor="aligo-user-id" className="text-sm font-medium">
                    알리고 아이디 (ALIGO_USER_ID) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="aligo-user-id"
                    type="text"
                    placeholder="알리고 가입 아이디"
                    value={aligoForm.userId}
                    onChange={(e) =>
                      setAligoForm((f) => ({ ...f, userId: e.target.value }))
                    }
                    className="mt-1.5"
                    autoComplete="off"
                  />
                </div>

                {/* 발신번호 */}
                <div>
                  <Label htmlFor="aligo-sender" className="text-sm font-medium">
                    발신번호 (ALIGO_SENDER) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="aligo-sender"
                    type="tel"
                    placeholder="01012345678 (알리고 등록 번호)"
                    value={aligoForm.sender}
                    onChange={(e) =>
                      setAligoForm((f) => ({ ...f, sender: e.target.value }))
                    }
                    className="mt-1.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    알리고에 사전 등록된 발신번호와 동일해야 합니다.
                  </p>
                </div>
              </div>

              {aligoSaveMsg && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    aligoSaveMsg.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                  role="alert"
                >
                  {aligoSaveMsg.type === "success" ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{aligoSaveMsg.text}</span>
                </div>
              )}

              <Button
                onClick={handleSaveAligoConfig}
                disabled={aligoLoading}
                className="w-full sm:w-auto"
              >
                {aligoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {aligoLoading ? "저장 중..." : "설정 저장"}
              </Button>
            </div>

            {/* 테스트 발송 */}
            {aligoStatus?.isConfigured && (
              <div className="border-t pt-5 space-y-3">
                <p className="text-sm font-semibold text-gray-800">SMS 테스트 발송</p>
                <p className="text-xs text-gray-500">
                  설정이 올바른지 테스트 인증번호를 발송해 확인하세요.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="010-0000-0000"
                    value={testPhone}
                    onChange={(e) => {
                      setTestPhone(e.target.value);
                      setTestMsg(null);
                    }}
                    className="max-w-xs"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestSms}
                    disabled={testLoading || !testPhone.trim()}
                  >
                    {testLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Send className="w-4 h-4 mr-1.5" />
                    )}
                    {testLoading ? "발송 중..." : "테스트 발송"}
                  </Button>
                </div>

                {testMsg && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                      testMsg.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}
                    role="alert"
                  >
                    {testMsg.type === "success" ? (
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{testMsg.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* 알리고 가입 안내 */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                💡 <strong>알리고(aligo.in) 가입 방법:</strong> aligo.in 접속 → 회원가입 → 문자서비스 신청 → 발신번호 등록 → API Key 발급.
                <br />
                API Key는 알리고 로그인 후 마이페이지 → API 설정에서 확인할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">
                  💡 개인정보 최소화 안내
                </p>
                <p className="text-sm text-blue-700">
                  본 서비스는 시민 회원가입 정보를 수집하거나 설정 화면에
                  노출하지 않으며, 시민 이용은 SMS 인증 인증 기반으로만
                  처리합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
