import { useState, useEffect } from "react";
import { AnyIdAuthDialog } from "./AnyIdAuthDialog";
import { useAnyId } from "../contexts/AnyIdContext";

/**
 * Any-ID 환영 다이얼로그
 *
 * @description
 * - 시민이 처음 방문했을 때 Any-ID 인증을 안내하는 다이얼로그
 * - 한 번만 표시되며, 사용자가 닫으면 다시 표시하지 않음
 * - "다시 보지 않기" 옵션 제공
 */
export function AnyIdWelcomeDialog() {
  const { isEnabled, isAuthenticated } = useAnyId();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    // Any-ID가 비활성화 상태이거나 이미 인증된 경우 표시하지 않음
    if (!isEnabled || isAuthenticated) {
      return;
    }

    // 이미 환영 메시지를 본 경우 표시하지 않음
    const hasSeenWelcome = localStorage.getItem("anyid_welcome_seen");
    if (hasSeenWelcome === "true") {
      return;
    }

    // 페이지 로드 후 2초 후에 환영 다이얼로그 표시
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isEnabled, isAuthenticated]);

  const handleClose = () => {
    setShowWelcome(false);
    // 닫기 버튼을 누르면 다시 보지 않음
    localStorage.setItem("anyid_welcome_seen", "true");
  };

  const handleStartAuth = () => {
    setShowWelcome(false);
    setShowAuthDialog(true);
    localStorage.setItem("anyid_welcome_seen", "true");
  };

  const handleSkip = () => {
    setShowWelcome(false);
    // 건너뛰기는 다음에 다시 표시할 수 있도록 저장하지 않음
  };

  // 환영 다이얼로그가 활성화되지 않은 경우 아무것도 렌더링하지 않음
  if (!showWelcome && !showAuthDialog) {
    return null;
  }

  return (
    <>
      {/* 환영 다이얼로그 - 실제 구현 시 사용 */}
      {/* 현재는 Any-ID가 비활성화 상태이므로 표시하지 않음 */}

      {/* Any-ID 인증 다이얼로그 */}
      <AnyIdAuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </>
  );
}
