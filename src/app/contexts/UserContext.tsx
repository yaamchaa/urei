import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserInfo {
  role: "admin" | "user";
  complexId?: string;
  complexName?: string;
  memberId?: string;

  // 관리자용 프로필 정보
  name?: string;
  phone?: string;
  address?: string;

  // 시민용 Any-ID 상태 표시용
  authMethod?: "any-id";
  isVerified?: boolean;

  // 기존 관리자 전용 권한
  isPrimaryAdmin?: boolean;
}

interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "bundang360_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (!savedUser) return;

    try {
      const parsedUser = JSON.parse(savedUser) as UserInfo;

      if (!parsedUser || !parsedUser.role) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setUserState(parsedUser);
    } catch (error) {
      console.error("사용자 정보 복원 실패:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setUser = (nextUser: UserInfo | null) => {
    setUserState(nextUser);

    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isLoggedIn = user !== null;

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}