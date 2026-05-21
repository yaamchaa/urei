import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Bell, Plus, Trash2, Save, Calendar } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { adminFetch } from "../adminApi";

interface YearData {
  year: string;
  quarters: QuarterData[];
}

interface QuarterData {
  quarter: string;
  mainProgress: string;
  documents: string;
  companies: string;
}

interface BannerContent {
  title: string;
  subtitle: string;
  years: YearData[];
  designSummary: string;
  constructionSummary: string;
}

export function BannerManagementPage() {
  const { user, isLoggedIn } = useUser();
  const [bannerContent, setBannerContent] = useState<BannerContent>({
    title: "2026년 7월 2차 특별정비구역 지정 관련 안내",
    subtitle: "연도별·분기별 흐름 + 중요 서류·동의문·선정 시점",
    years: [],
    designSummary: "",
    constructionSummary: "",
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "admin") {
      alert("관리자만 접근할 수 있습니다.");
      window.location.href = "/";
      return;
    }
    loadBannerContent();
  }, []);

  const loadBannerContent = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/banner-content`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setBannerContent(data.content);
        }
      }
    } catch (error) {
      console.error("배너 내용 로드 오류:", error);
    }
  };

  const handleSave = async () => {
    if (!user || user.role !== "admin") {
      alert("관리자만 저장할 수 있습니다.");
      return;
    }

    setLoading(true);
    setSaveMessage("");

    try {
      const response = await adminFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/banner-content`,
        {
          method: "POST",
          body: JSON.stringify({
            content: bannerContent,
            adminName: user.name,
          }),
        }
      );

      if (response.ok) {
        setSaveMessage("✅ 저장되었습니다.");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        const error = await response.json();
        setSaveMessage(`❌ 저장 실패: ${error.error || "서버 오류"}`);
      }
    } catch (error) {
      console.error("저장 오류:", error);
      setSaveMessage("❌ 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const addYear = () => {
    setBannerContent({
      ...bannerContent,
      years: [
        ...bannerContent.years,
        {
          year: "2026",
          quarters: [],
        },
      ],
    });
  };

  const removeYear = (yearIndex: number) => {
    const newYears = bannerContent.years.filter((_, idx) => idx !== yearIndex);
    setBannerContent({ ...bannerContent, years: newYears });
  };

  const updateYear = (yearIndex: number, field: string, value: string) => {
    const newYears = [...bannerContent.years];
    newYears[yearIndex] = { ...newYears[yearIndex], [field]: value };
    setBannerContent({ ...bannerContent, years: newYears });
  };

  const addQuarter = (yearIndex: number) => {
    const newYears = [...bannerContent.years];
    newYears[yearIndex].quarters.push({
      quarter: "Q1",
      mainProgress: "",
      documents: "",
      companies: "",
    });
    setBannerContent({ ...bannerContent, years: newYears });
  };

  const removeQuarter = (yearIndex: number, quarterIndex: number) => {
    const newYears = [...bannerContent.years];
    newYears[yearIndex].quarters = newYears[yearIndex].quarters.filter(
      (_, idx) => idx !== quarterIndex
    );
    setBannerContent({ ...bannerContent, years: newYears });
  };

  const updateQuarter = (
    yearIndex: number,
    quarterIndex: number,
    field: string,
    value: string
  ) => {
    const newYears = [...bannerContent.years];
    newYears[yearIndex].quarters[quarterIndex] = {
      ...newYears[yearIndex].quarters[quarterIndex],
      [field]: value,
    };
    setBannerContent({ ...bannerContent, years: newYears });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bell className="w-8 h-8 text-blue-600" />
          안내 배너 관리
        </h1>
        <p className="text-gray-600">
          2차 특별정비구역 안내 배너의 내용을 수정할 수 있습니다.
        </p>
      </div>

      {/* 저장 버튼 및 메시지 */}
      <div className="mb-6 flex items-center gap-4">
        <Button onClick={handleSave} disabled={loading} className="w-40">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "저장 중..." : "저장"}
        </Button>
        {saveMessage && (
          <span
            className={`text-sm font-medium ${
              saveMessage.includes("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {saveMessage}
          </span>
        )}
      </div>

      {/* 기본 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              배너 제목
            </label>
            <Input
              value={bannerContent.title}
              onChange={(e) =>
                setBannerContent({ ...bannerContent, title: e.target.value })
              }
              placeholder="예: 2026년 7월 2차 특별정비구역 지정 관련 안내"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              부제목
            </label>
            <Input
              value={bannerContent.subtitle}
              onChange={(e) =>
                setBannerContent({ ...bannerContent, subtitle: e.target.value })
              }
              placeholder="예: 연도별·분기별 흐름 + 중요 서류·동의문·선정 시점"
            />
          </div>
        </CardContent>
      </Card>

      {/* 년도별 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>년도별 정보</CardTitle>
            <Button onClick={addYear} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              년도 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {bannerContent.years.map((yearData, yearIndex) => (
            <Card key={yearIndex} className="bg-gray-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <Input
                      value={yearData.year}
                      onChange={(e) =>
                        updateYear(yearIndex, "year", e.target.value)
                      }
                      placeholder="년도 (예: 2026)"
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => addQuarter(yearIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      분기 추가
                    </Button>
                    <Button
                      onClick={() => removeYear(yearIndex)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {yearData.quarters.map((quarter, quarterIndex) => (
                  <div
                    key={quarterIndex}
                    className="p-4 bg-white rounded-lg border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Input
                        value={quarter.quarter}
                        onChange={(e) =>
                          updateQuarter(
                            yearIndex,
                            quarterIndex,
                            "quarter",
                            e.target.value
                          )
                        }
                        placeholder="분기 (예: Q1, 2026.Q1~Q2)"
                        className="w-48"
                      />
                      <Button
                        onClick={() => removeQuarter(yearIndex, quarterIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        주요 진행사항
                      </label>
                      <Textarea
                        value={quarter.mainProgress}
                        onChange={(e) =>
                          updateQuarter(
                            yearIndex,
                            quarterIndex,
                            "mainProgress",
                            e.target.value
                          )
                        }
                        placeholder="주요 진행사항을 입력하세요"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        중요 서류·동의문·절차
                      </label>
                      <Textarea
                        value={quarter.documents}
                        onChange={(e) =>
                          updateQuarter(
                            yearIndex,
                            quarterIndex,
                            "documents",
                            e.target.value
                          )
                        }
                        placeholder="각 항목은 줄바꿈(엔터)으로 구분하세요"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        설계·정비·시공 업체 등
                      </label>
                      <Textarea
                        value={quarter.companies}
                        onChange={(e) =>
                          updateQuarter(
                            yearIndex,
                            quarterIndex,
                            "companies",
                            e.target.value
                          )
                        }
                        placeholder="업체 관련 정보를 입력하세요"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* 설계·업체 선정 시점 요약 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>설계·업체 선정 시점 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설계 (정비·건축·도시계획)
            </label>
            <Textarea
              value={bannerContent.designSummary}
              onChange={(e) =>
                setBannerContent({
                  ...bannerContent,
                  designSummary: e.target.value,
                })
              }
              placeholder="설계 관련 요약 정보를 입력하세요"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시공사 (건설사)
            </label>
            <Textarea
              value={bannerContent.constructionSummary}
              onChange={(e) =>
                setBannerContent({
                  ...bannerContent,
                  constructionSummary: e.target.value,
                })
              }
              placeholder="시공사 관련 요약 정보를 입력하세요"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="w-40">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
