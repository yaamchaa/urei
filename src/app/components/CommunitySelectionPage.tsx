import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { Building2, MapPin, Home, Shield } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAnyId } from "../contexts/AnyIdContext";
import { AnyIdAuthDialog } from "./AnyIdAuthDialog";

export function CommunitySelectionPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const { isAuthenticated: anyIdAuthenticated } = useAnyId();
  const [anyIdDialogOpen, setAnyIdDialogOpen] = useState(false);

  const communityCategories = [
    {
      id: "bundang-reconstruction",
      title: "분당 재건축",
      icon: Building2,
      color: "text-red-600",
      path: "/community/bundang-reconstruction",
      description: "분당 신도시 재건축 시민광장",
    },
    {
      id: "old-town-reconstruction",
      title: "원도심 재건축",
      icon: Building2,
      color: "text-green-600",
      path: "/community/old-town-reconstruction",
      description: "원도심 지역 재건축 시민광장",
    },
    {
      id: "old-town-redevelopment",
      title: "원도심 재개발",
      icon: MapPin,
      color: "text-purple-600",
      path: "/community/old-town-redevelopment",
      description: "원도심 지역 재개발 시민광장",
    },
    {
      id: "street-housing",
      title: "가로주택정비",
      icon: Home,
      color: "text-blue-600",
      path: "/community/street-housing",
      description: "가로주택정비사업 시민광장",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>시민광장 - 사업 유형 선택 | 성남시 개발 톡톡</title>
        <meta
          name="description"
          content="성남시 정비사업 유형별 시민광장을 선택하세요. 분당 재건축, 원도심 재건축, 원도심 재개발, 가로주택정비"
        />
        <link rel="canonical" href={`${window.location.origin}/community`} />
      </Helmet>

      {!anyIdAuthenticated && (
        <section className="w-full pt-8 pb-4" aria-labelledby="anyid-banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Shield className="w-12 h-12 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h2 id="anyid-banner" className="text-xl font-bold mb-2">
                      🔐 시민 인증 (Any-ID)
                    </h2>
                    <p className="text-sm text-green-50 mb-1">
                      회원가입 없이 본인 인증만으로 서비스를 이용하세요
                    </p>
                    <p className="text-xs text-green-100">
                      모바일신분증 · 공동인증서 · 금융인증서 · 간편인증 · 민간ID (네이버, 카카오, 토스)
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setAnyIdDialogOpen(true)}
                  className="bg-white text-green-600 hover:bg-green-50 font-semibold px-8 py-3 text-base whitespace-nowrap"
                >
                  지금 인증하기
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            시민광장 톡톡
          </h1>
          <p className="text-lg text-gray-600">
            원하는 사업 유형을 선택하여 소통하세요
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {communityCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.path}
                aria-label={`${category.title} 시민광장으로 이동`}
                className="no-underline"
              >
                <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer h-full border-2 border-transparent hover:border-blue-300">
                  <CardContent className="pt-8 pb-8 text-center">
                    <Icon
                      className={`w-12 h-12 ${category.color} mx-auto mb-4`}
                      aria-hidden="true"
                    />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {category.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-6">
              <p className="text-sm text-blue-800 text-center">
                💡 각 사업 유형별로 소식, 투표, 의견을 공유할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AnyIdAuthDialog
        open={anyIdDialogOpen}
        onOpenChange={setAnyIdDialogOpen}
      />
    </div>
  );
}
