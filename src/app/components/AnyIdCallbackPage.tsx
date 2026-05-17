import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { handleAnyIdCallback } from "../contexts/AnyIdContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

/**
 * Any-ID 인증 콜백 페이지
 *
 * @description
 * Any-ID 인증 완료 후 리다이렉트되는 페이지
 * 인증 결과를 처리하고 메인 페이지로 이동
 */
export function AnyIdCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("인증 정보를 확인하는 중...");

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      const result = await handleAnyIdCallback();

      if (!result) {
        setStatus("error");
        setMessage("인증 정보가 없습니다.");
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      setStatus("success");
      setMessage(`${result.user.name}님, 환영합니다!`);

      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate("/");
        window.location.reload(); // Provider에서 세션 다시 로드
      }, 2000);
    } catch (error: any) {
      console.error("[Any-ID] 콜백 처리 실패:", error);
      setStatus("error");
      setMessage(error.message || "인증 처리 중 오류가 발생했습니다.");

      // 5초 후 메인 페이지로 이동
      setTimeout(() => navigate("/"), 5000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-800">{message}</h2>
              <p className="text-sm text-gray-600">잠시만 기다려주세요...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">{message}</h2>
              <p className="text-sm text-gray-600">곧 메인 페이지로 이동합니다.</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-800">인증 실패</h2>
              <p className="text-sm text-gray-600 text-center">{message}</p>
              <p className="text-xs text-gray-500 mt-2">5초 후 메인 페이지로 이동합니다.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
