/**
 * SmsAuthDialog — 알리고(Aligo) SMS 기반 시민 인증 다이얼로그
 *
 * 보안 설계:
 * - 알리고 API Key는 절대 프론트엔드에 노출하지 않음
 * - 모든 SMS 발송 요청은 Supabase Edge Function(서버)을 통해서만 처리
 * - OTP는 서버에서 생성·저장·검증 (6자리 숫자, 3분 유효)
 * - 전화번호는 서버 전송 전에 기본 형식 검증만 수행
 * - 인증 성공 후 sessionStorage에만 저장 (브라우저 탭 닫히면 자동 만료)
 */

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Smartphone, Shield, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useSmsAuth, maskPhone } from "../contexts/SmsAuthContext";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

interface SmsAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

type Step = "phone" | "otp" | "done";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0`;

// 전화번호 형식 정규화 (하이픈 제거, 숫자만)
function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

// 전화번호 기본 유효성 검사
function isValidPhone(phone: string): boolean {
  return /^01[016789]\d{7,8}$/.test(phone);
}

export function SmsAuthDialog({ open, onOpenChange, onAuthSuccess }: SmsAuthDialogProps) {
  const { setAuthenticated } = useSmsAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 다이얼로그 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setErrorMsg("");
      setResendCooldown(0);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    }
  }, [open]);

  // OTP 단계로 전환 시 자동 포커스
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [step]);

  // 재전송 쿨다운 타이머
  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── 1단계: SMS 발송 요청 ─────────────────────────
  const handleSendOtp = async () => {
    setErrorMsg("");
    const normalized = normalizePhone(phone);

    if (!isValidPhone(normalized)) {
      setErrorMsg("올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/sms-auth/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          apikey: publicAnonKey,
        },
        // 전화번호만 서버로 전송 — OTP 생성은 서버에서
        body: JSON.stringify({ phone: normalized }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 서버 미구성(API Key 미등록) 시 안내
        if (res.status === 503 || data?.code === "SMS_NOT_CONFIGURED") {
          setErrorMsg("⚙️ SMS 서비스 설정이 필요합니다.\n관리자 페이지에서 알리고 API Key를 등록해주세요.");
        } else {
          setErrorMsg(data?.error || "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        return;
      }

      setStep("otp");
      startCooldown();
    } catch {
      setErrorMsg("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 2단계: OTP 검증 ──────────────────────────────
  const handleVerifyOtp = async () => {
    setErrorMsg("");
    const trimmedOtp = otp.trim();

    if (!/^\d{6}$/.test(trimmedOtp)) {
      setErrorMsg("6자리 숫자 인증번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/sms-auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          apikey: publicAnonKey,
        },
        body: JSON.stringify({
          phone: normalizePhone(phone),
          otp: trimmedOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.code === "OTP_EXPIRED") {
          setErrorMsg("인증번호가 만료되었습니다. 다시 발송해주세요.");
        } else if (data?.code === "OTP_MISMATCH") {
          setErrorMsg("인증번호가 일치하지 않습니다. 다시 확인해주세요.");
        } else {
          setErrorMsg(data?.error || "인증에 실패했습니다.");
        }
        return;
      }

      // 인증 성공: Context에 저장
      setAuthenticated({
        phone: normalizePhone(phone),
        verifiedAt: new Date().toISOString(),
      });
      setStep("done");
      onAuthSuccess?.();

      // 2초 후 자동 닫기
      setTimeout(() => onOpenChange(false), 2000);
    } catch {
      setErrorMsg("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleVerifyOtp();
  };

  const handlePhoneKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendOtp();
  };

  // ── 렌더링 ────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-blue-600" aria-hidden="true" />
            SMS 시민 인증
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            휴대폰 문자 인증으로 서비스를 이용하세요.
            <br />
            회원가입 없이 인증만으로 이용 가능합니다.
          </DialogDescription>
        </DialogHeader>

        {/* ── 전화번호 입력 단계 ── */}
        {step === "phone" && (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="sms-phone" className="text-sm font-medium">
                휴대폰 번호
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="sms-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMsg("");
                  }}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={13}
                  autoComplete="tel"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button onClick={handleSendOtp} disabled={isLoading || !phone.trim()} className="shrink-0">
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Smartphone className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span className="ml-1.5">{isLoading ? "발송 중" : "인증번호 발송"}</span>
                </Button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="whitespace-pre-line">{errorMsg}</span>
              </div>
            )}

            <p className="text-xs text-gray-500">
              인증번호는 3분간 유효합니다. 알리고 SMS 서비스를 통해 발송됩니다.
            </p>
          </div>
        )}

        {/* ── OTP 입력 단계 ── */}
        {step === "otp" && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium">{maskPhone(normalizePhone(phone))} 으로 인증번호를 발송했습니다.</p>
              <p className="text-xs mt-1 text-blue-600">3분 이내에 입력해주세요.</p>
            </div>

            <div>
              <Label htmlFor="sms-otp" className="text-sm font-medium">
                인증번호 6자리
              </Label>
              <Input
                id="sms-otp"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  // 숫자만 허용, 최대 6자리
                  const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                  setOtp(val);
                  setErrorMsg("");
                }}
                onKeyDown={handleOtpKeyDown}
                maxLength={6}
                autoComplete="one-time-code"
                className="mt-1.5 text-center tracking-widest text-lg"
                disabled={isLoading}
              />
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setErrorMsg("");
                }}
                disabled={isLoading}
                className="flex-1"
              >
                번호 변경
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
                className="flex-1"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" aria-hidden="true" />
                ) : null}
                {isLoading ? "확인 중..." : "인증 확인"}
              </Button>
            </div>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-gray-500">재발송 가능 ({resendCooldown}초 후)</p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOtp("");
                    setErrorMsg("");
                    handleSendOtp();
                  }}
                  disabled={isLoading}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  인증번호 재발송
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 인증 완료 단계 ── */}
        {step === "done" && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto" aria-hidden="true" />
            <p className="font-semibold text-gray-900">SMS 인증이 완료되었습니다!</p>
            <p className="text-sm text-gray-600">이제 서비스를 이용하실 수 있습니다.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
