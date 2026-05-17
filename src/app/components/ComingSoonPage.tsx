import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useEffect } from "react";

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <Helmet>
        <title>{title} - 준비중 | 성남시 개발 톡톡</title>
        <meta name="description" content={`${title} 페이지는 현재 준비중입니다.`} />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Card>
          <CardContent className="py-12">
            <Construction className="w-20 h-20 text-blue-600 mx-auto mb-6" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {title}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              페이지 준비중입니다
            </p>
            {description && (
              <p className="text-sm text-gray-500 mb-8">
                {description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/dashboard">
                <Button variant="default" size="lg">
                  <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
                  대시보드로 돌아가기
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg">
                  홈으로 이동
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                💡 해당 사업 유형의 정보는 곧 업데이트될 예정입니다. 다른 메뉴를 이용해 주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
