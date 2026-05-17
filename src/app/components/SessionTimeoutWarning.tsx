import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

interface SessionTimeoutWarningProps {
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({ onExtend, onLogout }: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // 세션 만료 30초 전에 경고 표시 (실제로는 29분 30초 후)
    // 데모를 위해 10분으로 설정
    const warningTimer = setTimeout(() => {
      setShowWarning(true);
    }, 10 * 60 * 1000); // 10분

    return () => clearTimeout(warningTimer);
  }, []);

  useEffect(() => {
    if (!showWarning) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showWarning, onLogout]);

  const handleExtend = () => {
    setShowWarning(false);
    setCountdown(30);
    onExtend();
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" aria-hidden="true" />
            세션 만료 경고
          </DialogTitle>
          <DialogDescription>
            {countdown}초 후에 자동으로 로그아웃됩니다.
            <br />
            계속 사용하시려면 "연장하기" 버튼을 클릭하세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onLogout}>
            로그아웃
          </Button>
          <Button onClick={handleExtend} autoFocus>
            연장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
