import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// =============================================
// SMS 인증 타입
// =============================================

export interface SmsAuthUser {
  phone: string;       // 인증된 전화번호 (마스킹 표시용)
  verifiedAt: string;  // 인증 완료 시각 ISO string
}

interface SmsAuthContextType {
  isAuthenticated: boolean;
  user: SmsAuthUser | null;
  logout: () => void;
  setAuthenticated: (user: SmsAuthUser) => void;
}

const SmsAuthContext = createContext<SmsAuthContextType | null>(null);

// =============================================
// Provider
// =============================================

export function SmsAuthProvider({ children }: { children: ReactNode }) {
  // sessionStorage 기반: 브라우저 탭이 닫히면 자동 만료 (보안 강화)
  const [user, setUser] = useState<SmsAuthUser | null>(() => {
    try {
      const raw = sessionStorage.getItem("sms_auth_user");
      if (!raw) return null;
      const parsed: SmsAuthUser = JSON.parse(raw);
      // 2시간 유효
      const diff = Date.now() - new Date(parsed.verifiedAt).getTime();
      if (diff > 2 * 60 * 60 * 1000) {
        sessionStorage.removeItem("sms_auth_user");
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const setAuthenticated = useCallback((newUser: SmsAuthUser) => {
    sessionStorage.setItem("sms_auth_user", JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("sms_auth_user");
    setUser(null);
  }, []);

  return (
    <SmsAuthContext.Provider value={{ isAuthenticated: !!user, user, logout, setAuthenticated }}>
      {children}
    </SmsAuthContext.Provider>
  );
}

// =============================================
// Hook
// =============================================

export function useSmsAuth() {
  const ctx = useContext(SmsAuthContext);
  if (!ctx) throw new Error("useSmsAuth must be used within SmsAuthProvider");
  return ctx;
}

// =============================================
// 전화번호 마스킹 유틸
// =============================================

export function maskPhone(phone: string): string {
  // 010-1234-5678 → 010-****-5678
  return phone.replace(/(\d{3})-?(\d{3,4})-?(\d{4})/, "$1-****-$3");
}
