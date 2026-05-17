import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Info, Save, RotateCcw, Eye, EyeOff, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

type CenterForm = {
  id: string;
  title: string;
  short_description: string;
  intro: string;
  services: string;
  hours: string;
  location: string;
  contact: string;
  note: string;
  is_visible: boolean;
  sort_order: number;
};

const fallbackCenters: CenterForm[] = [
  {
    id: "bundang-support-center",
    title: "분당 재건축 지원센터 안내",
    short_description: "분당 신도시 재건축 관련 상담과 안내를 받을 수 있습니다.",
    intro:
      "분당 재건축 지원센터는 분당 신도시 재건축과 관련하여 시민이 필요한 정보를 확인하고 상담을 받을 수 있도록 운영하는 안내 창구입니다.",
    services:
      "재건축 절차와 추진 단계 관련 기본 안내\n단지별 정비사업 관련 일반 문의 응대\n재건축 관련 민원 및 상담 창구 안내\n시민이 자주 묻는 사항에 대한 기초 정보 제공",
    hours: "평일 오전 9시 30분 ~ 오후 4시 30분",
    location: "분당구청 1층 종합민원실",
    contact: "방문 전 해당 부서 또는 성남시 대표 민원창구를 통해 운영 여부를 확인해 주세요.",
    note:
      "운영시간, 상담 범위, 담당자 정보는 변경될 수 있으므로 방문 전에 최신 안내를 확인해 주세요.",
    is_visible: true,
    sort_order: 1,
  },
  {
    id: "oldtown-support-center",
    title: "원도심 재개발·재건축 지원센터 안내",
    short_description: "원도심 재개발·재건축 관련 상담과 행정 안내를 받을 수 있습니다.",
    intro:
      "원도심 재개발·재건축 지원센터는 원도심 정비사업과 관련하여 시민이 필요한 행정 안내와 상담을 받을 수 있도록 지원하는 창구입니다.",
    services:
      "재개발·재건축 절차와 사업 단계 관련 안내\n사업지별 문의에 대한 기본 상담 지원\n정비사업 관련 행정 절차 안내\n시민 문의사항 접수 및 관련 부서 안내",
    hours: "운영시간은 방문 전 확인을 권장합니다.",
    location: "수정커뮤니티센터",
    contact: "성남시 재개발과 031-729-4672~4, 031-729-4525",
    note:
      "센터 운영 일정과 상담 가능 시간은 변경될 수 있으므로 방문 전 전화 확인을 권장합니다.",
    is_visible: true,
    sort_order: 2,
  },
];

export function DashboardSelectionManagementPage() {
  const [centers, setCenters] = useState<CenterForm[]>(fallbackCenters);
  const [initialCenters, setInitialCenters] = useState<CenterForm[]>(fallbackCenters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCenters();
  }, []);

  const loadCenters = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("dashboard_support_centers")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("센터 안내 조회 오류:", error);
      toast.error("센터 안내 정보를 불러오지 못했습니다. 기본값을 표시합니다.");
      setCenters(fallbackCenters);
      setInitialCenters(fallbackCenters);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setCenters(fallbackCenters);
      setInitialCenters(fallbackCenters);
      setLoading(false);
      return;
    }

    setCenters(data);
    setInitialCenters(data);
    setLoading(false);
  };

  const visibleCount = useMemo(
    () => centers.filter((center) => center.is_visible).length,
    [centers]
  );

  const updateCenter = (
    id: string,
    field: keyof CenterForm,
    value: string | boolean | number
  ) => {
    setCenters((prev) =>
      prev.map((center) =>
        center.id === id ? { ...center, [field]: value } : center
      )
    );
  };

  const handleReset = () => {
    const confirmed = window.confirm("현재 편집 내용을 마지막 불러온 상태로 되돌리시겠습니까?");
    if (!confirmed) return;

    setCenters(initialCenters);
    toast.success("마지막 저장 상태로 되돌렸습니다.");
  };

  const handleSave = async () => {
    setSaving(true);

    const payload = centers.map((center) => ({
      id: center.id,
      title: center.title.trim(),
      short_description: center.short_description.trim(),
      intro: center.intro.trim(),
      services: center.services.trim(),
      hours: center.hours.trim(),
      location: center.location.trim(),
      contact: center.contact.trim(),
      note: center.note.trim(),
      is_visible: center.is_visible,
      sort_order: center.sort_order,
    }));

    const hasEmpty = payload.some(
      (item) =>
        !item.id ||
        !item.title ||
        !item.short_description ||
        !item.intro ||
        !item.services ||
        !item.hours ||
        !item.location ||
        !item.contact ||
        !item.note
    );

    if (hasEmpty) {
      toast.error("모든 필수 항목을 입력해 주세요.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("dashboard_support_centers")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) {
      console.error("센터 안내 저장 오류:", error);
      toast.error("저장 중 오류가 발생했습니다.");
      setSaving(false);
      return;
    }

    const sorted = [...(data ?? payload)].sort((a, b) => a.sort_order - b.sort_order);
    setCenters(sorted);
    setInitialCenters(sorted);
    toast.success("센터 안내 정보를 저장했습니다.");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center py-20">
            <p className="text-gray-600">센터 안내 정보를 불러오는 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>센터 안내 관리 | 성남시 개발 톡톡</title>
        <meta
          name="description"
          content="정비사업현황 페이지의 지원센터 안내 팝업 내용을 관리합니다."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">센터 안내 관리</h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            정비사업현황 페이지 하단 지원센터 안내 카드와 팝업 내용을 수정하고 저장할 수 있습니다.
          </p>
        </header>

        <section className="mb-8" aria-labelledby="summary-title">
          <h2 id="summary-title" className="sr-only">요약 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-5">
                <p className="text-sm text-blue-800">등록된 센터 수</p>
                <p className="mt-2 text-2xl font-bold text-blue-900">{centers.length}</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-5">
                <p className="text-sm text-green-800">현재 노출 중</p>
                <p className="mt-2 text-2xl font-bold text-green-900">{visibleCount}</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="py-5">
                <p className="text-sm text-yellow-800">안내</p>
                <p className="mt-2 text-sm text-yellow-900 leading-6">
                  저장 후 사용자 페이지에서 팝업 노출 상태를 확인해 주세요.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="space-y-8">
          {centers.map((center, index) => {
            const prefix = `center-${index}`;
            const servicesPreview = center.services
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean);

            return (
              <Card key={center.id} className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                      {center.id === "bundang-support-center" ? (
                        <Building2 className="w-5 h-5 text-blue-700" aria-hidden="true" />
                      ) : (
                        <MapPin className="w-5 h-5 text-blue-700" aria-hidden="true" />
                      )}
                      <span>{center.title}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor={`${prefix}-visible`} className="text-sm font-medium text-gray-700">
                        노출 여부
                      </Label>
                      <div className="flex items-center gap-2">
                        {center.is_visible ? (
                          <Eye className="w-4 h-4 text-green-700" aria-hidden="true" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" aria-hidden="true" />
                        )}
                        <input
                          id={`${prefix}-visible`}
                          type="checkbox"
                          checked={center.is_visible}
                          onChange={(e) => updateCenter(center.id, "is_visible", e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor={`${prefix}-title`}>센터명</Label>
                        <Input
                          id={`${prefix}-title`}
                          value={center.title}
                          onChange={(e) => updateCenter(center.id, "title", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${prefix}-short_description`}>카드 요약 설명</Label>
                        <Input
                          id={`${prefix}-short_description`}
                          value={center.short_description}
                          onChange={(e) => updateCenter(center.id, "short_description", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${prefix}-intro`}>소개</Label>
                        <Textarea
                          id={`${prefix}-intro`}
                          value={center.intro}
                          onChange={(e) => updateCenter(center.id, "intro", e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${prefix}-services`}>하는 일(한 줄에 1개씩 입력)</Label>
                        <Textarea
                          id={`${prefix}-services`}
                          value={center.services}
                          onChange={(e) => updateCenter(center.id, "services", e.target.value)}
                          rows={6}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${prefix}-hours`}>이용시간</Label>
                          <Input
                            id={`${prefix}-hours`}
                            value={center.hours}
                            onChange={(e) => updateCenter(center.id, "hours", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${prefix}-location`}>위치</Label>
                          <Input
                            id={`${prefix}-location`}
                            value={center.location}
                            onChange={(e) => updateCenter(center.id, "location", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${prefix}-contact`}>문의</Label>
                        <Textarea
                          id={`${prefix}-contact`}
                          value={center.contact}
                          onChange={(e) => updateCenter(center.id, "contact", e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${prefix}-note`}>안내사항</Label>
                        <Textarea
                          id={`${prefix}-note`}
                          value={center.note}
                          onChange={(e) => updateCenter(center.id, "note", e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <section aria-labelledby={`${prefix}-preview-title`}>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 h-full">
                        <div className="flex items-center gap-2 mb-4">
                          <Info className="w-5 h-5 text-blue-700" aria-hidden="true" />
                          <h2 id={`${prefix}-preview-title`} className="text-lg font-semibold text-gray-900">
                            미리보기
                          </h2>
                        </div>

                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4">
                          <h3 className="text-base font-bold text-blue-900">{center.title}</h3>
                          <p className="mt-2 text-sm text-blue-800">{center.short_description}</p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">소개</h3>
                            <p className="text-sm leading-6 text-gray-700">{center.intro}</p>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">하는 일</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                              {servicesPreview.length > 0 ? (
                                servicesPreview.map((item) => <li key={item}>{item}</li>)
                              ) : (
                                <li>하는 일을 입력해 주세요.</li>
                              )}
                            </ul>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                              <p className="text-xs font-semibold text-gray-500">이용시간</p>
                              <p className="mt-1 text-sm text-gray-800">{center.hours}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                              <p className="text-xs font-semibold text-gray-500">위치</p>
                              <p className="mt-1 text-sm text-gray-800">{center.location}</p>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">문의</h3>
                            <p className="text-sm leading-6 text-gray-700 whitespace-pre-line">{center.contact}</p>
                          </div>

                          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <h3 className="text-sm font-semibold text-yellow-900 mb-1">안내사항</h3>
                            <p className="text-sm leading-6 text-yellow-900 whitespace-pre-line">{center.note}</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            마지막 불러온 상태로 복원
          </Button>

          <Button type="button" onClick={handleSave} disabled={saving} className="bg-blue-700 hover:bg-blue-800">
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}