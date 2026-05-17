import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronRight, Smartphone, FileText, CreditCard, Shield, Building2 } from "lucide-react";

interface AnyIdAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: (authData: AnyIdAuthResult) => void;
}

export interface AnyIdAuthResult {
  ci: string; // 연계정보
  name: string;
  birthDate: string;
  phoneNumber?: string;
  authMethod: "mobile" | "cert" | "finance" | "simple" | "social";
}

export function AnyIdAuthDialog({ open, onOpenChange, onAuthSuccess }: AnyIdAuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthMethod = async (method: AnyIdAuthResult["authMethod"]) => {
    setIsLoading(true);

    try {
      // TODO: API 키 발급 후 실제 Any-ID 인증 연동
      // 현재는 준비 단계로 UI만 구현

      // 실제 구현 시:
      // 1. 서버로 인증 요청 (/api/anyid/auth/init)
      // 2. Any-ID 인증창으로 리다이렉트 또는 팝업
      // 3. 콜백으로 인증결과 수신
      // 4. 서버에서 검증 후 사용자 정보 반환

      console.log(`[Any-ID 준비] ${method} 인증 방법 선택됨`);
      console.log("[Any-ID 준비] API 키 발급 후 실제 연동 예정");

      // 임시: 개발 중 표시
      alert("Any-ID 인증은 API 키 발급 후 활성화됩니다.\n현재는 준비 단계입니다.");

    } catch (error) {
      console.error("[Any-ID] 인증 오류:", error);
      alert("인증 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold">
            로그인 방식을 선택해주세요.
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-gray-600 mt-2">
            회원 로그인/가입 이외에, 본인 인증으로만 한 번의 회원가입/로그인 없이 해당 서비스를 이용할 수 있는 인증 서비스입니다.
            <br />단 로그인/가입 이외의 본인인증으로 서비스 이용 시 이용할 수 없는 서비스가 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 md:mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-base md:text-lg font-semibold">정부통합 로그인</h3>
            <div className="flex items-center gap-2 text-xs md:text-sm text-blue-600">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">카톡은 빠르게 본인 인증</span>
              <span className="sm:hidden">빠른 본인 인증</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {/* 모바일 신분증 */}
            <button
              onClick={() => handleAuthMethod("mobile")}
              disabled={isLoading}
              className="flex flex-col items-start p-5 md:p-4 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group disabled:opacity-50 w-full"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <Smartphone className="w-7 h-7 md:w-6 md:h-6 text-blue-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </div>
              <div className="text-left w-full">
                <div className="font-semibold text-base md:text-sm mb-2">모바일 신분증</div>
                <div className="text-sm md:text-xs text-gray-600 leading-relaxed">
                  행정안전부에서 제공하는 전자적 신분증을 이용하여 간편하게 서비스에 로그인할 수 있습니다.
                </div>
              </div>
            </button>

            {/* 공동인증서 */}
            <button
              onClick={() => handleAuthMethod("cert")}
              disabled={isLoading}
              className="flex flex-col items-start p-5 md:p-4 border-2 border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group disabled:opacity-50 w-full"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <FileText className="w-7 h-7 md:w-6 md:h-6 text-green-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
              </div>
              <div className="text-left w-full">
                <div className="font-semibold text-base md:text-sm mb-2">공동인증서</div>
                <div className="text-sm md:text-xs text-gray-600 leading-relaxed">
                  금융결제원에서 공인인증서가 개편된 공동 인증서를 이용하여 신원확인을 할 수 있습니다.
                </div>
              </div>
            </button>

            {/* 금융인증서 */}
            <button
              onClick={() => handleAuthMethod("finance")}
              disabled={isLoading}
              className="flex flex-col items-start p-5 md:p-4 border-2 border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors group disabled:opacity-50 w-full"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <CreditCard className="w-7 h-7 md:w-6 md:h-6 text-orange-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
              </div>
              <div className="text-left w-full">
                <div className="font-semibold text-base md:text-sm mb-2">금융인증서</div>
                <div className="text-sm md:text-xs text-gray-600 leading-relaxed">
                  은행 앱을 이용하여 사전에 발급한 금융 인증서를 이용하여 신원확인을 할 수 있습니다.
                </div>
              </div>
            </button>

            {/* 간편인증 */}
            <button
              onClick={() => handleAuthMethod("simple")}
              disabled={isLoading}
              className="flex flex-col items-start p-5 md:p-4 border-2 border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group disabled:opacity-50 w-full"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <Shield className="w-7 h-7 md:w-6 md:h-6 text-purple-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
              </div>
              <div className="text-left w-full">
                <div className="font-semibold text-base md:text-sm mb-2">간편인증</div>
                <div className="text-sm md:text-xs text-gray-600 leading-relaxed">
                  통신사 앱을 통해 본인 인증받은 이용자는 자동으로 인증 처리되어 간편하게 서비스에 로그인 할 수 있습니다.
                </div>
              </div>
            </button>

            {/* 기타 - ID */}
            <button
              onClick={() => handleAuthMethod("social")}
              disabled={isLoading}
              className="flex flex-col items-start p-5 md:p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors group disabled:opacity-50 w-full"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <Building2 className="w-7 h-7 md:w-6 md:h-6 text-gray-600" />
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
              </div>
              <div className="text-left w-full">
                <div className="font-semibold text-base md:text-sm mb-2">기타 - ID</div>
                <div className="text-sm md:text-xs text-gray-600 leading-relaxed">
                  네이버, 카카오, 페이코 등의 포털, 결제 서비스의 아이디로 민간인증을 이용할 수 있습니다.
                </div>
              </div>
            </button>
          </div>

          {/* 안내 문구 */}
          <div className="mt-6 p-4 md:p-5 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm md:text-base text-blue-800">
                <p className="font-semibold mb-2">카톡은 빠르게 본인 인증(Any-ID) 서비스란?</p>
                <p className="text-xs md:text-sm leading-relaxed">
                  공공 웹사이트 회원가입 없이 본인 확인(모바일신분증, 간편인증 등) 정보만으로 서비스를 이용할 수 있는
                  정부 통합인증 서비스입니다.
                </p>
              </div>
            </div>
          </div>

          {/* API 키 미발급 안내 (개발 중에만 표시) */}
          <div className="mt-4 p-4 md:p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs md:text-sm text-amber-800 leading-relaxed">
              <strong>[개발 준비 단계]</strong> Any-ID API 키 발급 후 실제 인증 기능이 활성화됩니다.
              현재는 UI 구조만 준비되어 있습니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
