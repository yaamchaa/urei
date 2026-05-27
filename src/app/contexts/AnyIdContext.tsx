import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

// ========================================
// Any-ID 타입 정의
// ========================================

export type AnyIdAuthMethod = "mobile" | "cert" | "finance" | "simple" | "social";

export interface AnyIdUser {
  userId: string;
  name: string;
  birthDate: string;
  phoneNumber?: string;
}

export interface AnyIdSession {
  sessionId: string;
  user: AnyIdUser;
  authMethod: "anyid";
  createdAt: string;
}

// ========================================
// Context 정의
// ========================================

interface AnyIdContextType {
  // 상태
  isEnabled: boolean;
  isAuthenticated: boolean;
  session: AnyIdSession | null;
  user: AnyIdUser | null;
  isLoading: boolean;

  // 액션
  checkStatus: () => Promise<void>;
  startAuth: (authMethod: AnyIdAuthMethod) => Promise<void>;
  logout: () => Promise<void>;
}

const AnyIdContext = createContext<AnyIdContextType | null>(null);

// ========================================
// Provider 컴포넌트
// ========================================

interface AnyIdProviderProps {
  children: ReactNode;
}

export function AnyIdProvider({ children }: AnyIdProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [session, setSession] = useState<AnyIdSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0`;

  // Any-ID 활성화 상태 확인
  const checkStatus = async () => {
    try {
      const response = await fetch(`${baseUrl}/anyid/status`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      setIsEnabled(data.enabled);
    } catch (error) {
      console.error("[Any-ID] 상태 확인 실패:", error);
      setIsEnabled(false);
    }
  };

  // 저장된 세션 확인
  const loadSession = async () => {
    const savedSessionId = localStorage.getItem("anyid_session_id");
    if (!savedSessionId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/anyid/session/${savedSessionId}`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        // 세션이 만료되었거나 유효하지 않음
        localStorage.removeItem("anyid_session_id");
        setSession(null);
      }
    } catch (error) {
      console.error("[Any-ID] 세션 로드 실패:", error);
      localStorage.removeItem("anyid_session_id");
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 시작
  const startAuth = async (authMethod: AnyIdAuthMethod) => {
    if (!isEnabled) {
      alert("Any-ID 인증이 활성화되지 않았습니다.\nAPI 키 설정 후 사용 가능합니다.");
      return;
    }

    try {
      setIsLoading(true);

      // 서버에 인증 초기화 요청
      const response = await fetch(`${baseUrl}/anyid/auth/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          authMethod,
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "인증 초기화 실패");
      }

      // Any-ID 인증 페이지로 리다이렉트
      // (실제로는 팝업 또는 새 탭으로 열 수도 있음)
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("[Any-ID] 인증 시작 실패:", error);
      alert(`인증 시작 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const logout = async () => {
    if (!session) return;

    try {
      await fetch(`${baseUrl}/anyid/session/${session.sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
    } catch (error) {
      console.error("[Any-ID] 로그아웃 실패:", error);
    } finally {
      localStorage.removeItem("anyid_session_id");
      setSession(null);
    }
  };

  // 초기화
  useEffect(() => {
    checkStatus();
    loadSession();
  }, []);

  const value: AnyIdContextType = {
    isEnabled,
    isAuthenticated: !!session,
    session,
    user: session?.user || null,
    isLoading,
    checkStatus,
    startAuth,
    logout,
  };

  return <AnyIdContext.Provider value={value}>{children}</AnyIdContext.Provider>;
}

// ========================================
// Hook
// ========================================

export function useAnyId() {
  const context = useContext(AnyIdContext);
  if (!context) {
    throw new Error("useAnyId must be used within AnyIdProvider");
  }
  return context;
}

// ========================================
// 콜백 페이지용 유틸리티
// ========================================

/**
 * Any-ID 콜백 처리 (리다이렉트 후 호출)
 *
 * @description
 * 인증 완료 후 콜백 URL로 돌아왔을 때 호출
 * URL 파라미터에서 code와 state를 추출하여 서버로 전송
 */
export async function handleAnyIdCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) {
    return null;
  }

  try {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0`;

    const response = await fetch(
      `${baseUrl}/anyid/auth/callback?code=${code}&state=${state}`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "인증 실패");
    }

    // 세션 ID 저장
    localStorage.setItem("anyid_session_id", data.sessionId);

    return data;
  } catch (error) {
    console.error("[Any-ID] 콜백 처리 실패:", error);
    throw error;
  }
}
