import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, UserPlus, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export function AdminRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    phone: "",
    password: "",
    passwordConfirm: "",
    authCode: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "비밀번호는 최소 8자 이상이어야 합니다." };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const validCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
    
    if (validCount < 3) {
      return { 
        valid: false, 
        message: "비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다." 
      };
    }
    
    return { valid: true, message: "유효한 비밀번호입니다." };
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("이름을 입력해주세요.");
      return false;
    }
    if (!formData.department.trim()) {
      toast.error("부서를 입력해주세요.");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("전화번호를 입력해주세요.");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("비밀번호를 입력해주세요.");
      return false;
    }
    
    // 🔒 강화된 비밀번호 검증
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return false;
    }
    
    if (formData.password !== formData.passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return false;
    }
    if (!formData.authCode.trim()) {
      toast.error("인증번호를 입력해주세요.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/admin/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            name: formData.name,
            department: formData.department,
            phone: formData.phone,
            password: formData.password,
            authCode: formData.authCode
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "계정 추가에 실패했습니다.");
        setSubmitting(false);
        return;
      }

      toast.success("관리자 계정이 추가되었습니다!");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);
    } catch (error) {
      console.error("계정추가 오류:", error);
      toast.error("계정추가 중 오류가 발생했습니다.");
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
          <h1 className="text-3xl font-bold text-gray-900">관리자 계정추가</h1>
          <p className="mt-2 text-sm text-gray-600">
            관리자 계정을 생성하려면 인증번호가 필요합니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              추가 계정 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">부서명 입력 *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="도시개발과"
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">사용부서 *</Label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="도시개발과"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">전화번호 *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">비밀번호 *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="최소 8자 이상"
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
                <p className="text-xs text-gray-500 mt-1">
                  🔒 영문 대소문자, 숫자, 특수문자 중 3가지 이상 포함, 최소 8자
                </p>
              </div>

              <div>
                <Label htmlFor="passwordConfirm">비밀번호 확인 *</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="authCode">인증번호 *</Label>
                <Input
                  id="authCode"
                  name="authCode"
                  type="text"
                  value={formData.authCode}
                  onChange={handleChange}
                  placeholder="XXXX-XXXX-XXXX"
                  className="font-mono uppercase"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  관리자로부터 전달받은 인증번호를 입력하세요.
                </p>
              </div>
              
              <div className="space-y-2">
               <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
               {submitting ? "처리 중..." : "계정추가"}
               </Button>

               <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                홈 이동
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ 주의사항
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 인증번호는 기존 관리자에게 요청하세요.</li>
              <li>• 인증번호는 한 번만 사용 가능합니다.</li>
              <li>• 전화번호는 로그인 시 사용됩니다.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
