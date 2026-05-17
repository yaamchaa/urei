import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Shield, Settings, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { complexes } from "../data/complexes";

interface Settings {
  selectedComplexId?: string;
}

export function SettingsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [settings] = useState<Settings>({});
  const [selectedComplex, setSelectedComplex] = useState(
    settings.selectedComplexId || "sibeom2"
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>시스템 설정 | 성남시 개발 톡톡</title>
        <meta
          name="description"
          content="단지 기준 시스템 설정 및 운영 안내를 확인하세요"
        />
        <link
          rel="canonical"
          href={`${window.location.origin}${window.location.pathname}`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
          <p className="text-gray-600">단지 기준 시스템 설정 및 운영 안내</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">운영 단지 수</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {complexes.length}개
                  </p>
                </div>
                <Building2 className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">인증 방식</p>
                  <p className="text-xl font-bold text-green-600">Any-ID</p>
                </div>
                <Shield className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">설정 상태</p>
                  <p className="text-xl font-bold text-purple-600">운영 중</p>
                </div>
                <Settings className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              단지별 운영 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedComplex} onValueChange={setSelectedComplex}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
                {complexes.map((complex) => (
                  <TabsTrigger key={complex.id} value={complex.id}>
                    {complex.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {complexes.map((complex) => (
                <TabsContent key={complex.id} value={complex.id}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {complex.name} 운영 정보
                      </h3>
                      <Badge variant="secondary">Any-ID 적용</Badge>
                    </div>

                    <Card className="border border-gray-200">
                      <CardContent className="py-6 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            인증 정책
                          </p>
                          <p className="text-sm text-gray-600">
                            시민 사용자는 별도 회원가입 없이 Any-ID 인증으로만
                            서비스를 이용합니다.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            개인정보 처리 원칙
                          </p>
                          <p className="text-sm text-gray-600">
                            설정 화면에서는 시민 개별 이름, 전화번호, 주소,
                            가입일, 인증 상태 등 개인정보를 표시하지 않습니다.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            운영 기준
                          </p>
                          <p className="text-sm text-gray-600">
                            단지별 서비스 운영은 공지, 투표, 소통 기능 중심으로
                            제공되며, 시민 계정 기반 회원 관리 기능은 사용하지
                            않습니다.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">
                  💡 개인정보 최소화 안내
                </p>
                <p className="text-sm text-blue-700">
                  본 서비스는 시민 회원가입 정보를 수집하거나 설정 화면에
                  노출하지 않으며, 시민 이용은 Any-ID 인증 기반으로만
                  처리합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}