import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useUser } from "../contexts/UserContext";
import { projectId } from "../../../utils/supabase/info";
import { setAdminApiToken } from "../adminApi";
import { setCsrfToken } from "../utils/csrf";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [formData, setFormData] = useState({
    phone: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.phone.trim() || !formData.password.trim()) {
    toast.error("전화번호와 비밀번호를 입력해주세요.");
    return;
  }

  const { phone, password } = formData;
  setSubmitting(true);

  try {
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone, password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "로그인에 실패했습니다.");
      return;
    }

    const admin = data.admin;

    if (data.adminApiToken) {
      setAdminApiToken(data.adminApiToken);
    }

    // 🔒 CSRF 토큰 저장
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
    }

    setUser({
      name: admin.name,
      phone: admin.phone,
      address: admin.department,
      complexId: "admin",
      complexName: admin.department,
      memberId: admin.id,
      role: "admin",
      isPrimaryAdmin: admin.isPrimaryAdmin === true,
    });

    toast.success(`${admin.name}님, 환영합니다!`);

    setTimeout(() => {
      navigate("/");
    }, 1000);
  } catch (error) {
    console.error("로그인 오류:", error);
    toast.error("로그인 중 오류가 발생했습니다.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">관리자 로그인</h1>
          <p className="mt-2 text-sm text-gray-600">
            관리자 계정으로 로그인하세요.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              로그인 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-[0px]">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  required
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호를 입력하세요"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              💡 안내
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 관리자 계정만 로그인할 수 있습니다.</li>
              <li>• 등록된 관리자 계정의 전화번호로 로그인하세요.</li>
              <li>• 로그인 후 관리 기능을 이용할 수 있습니다.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}