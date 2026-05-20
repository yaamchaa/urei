import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { Building2, MapPin, Home, X, Clock3, Phone, MapPinned, Info, ClipboardList } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useEffect, useId, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type SupportCenter = {
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

const fallbackSupportCenters: SupportCenter[] = [
  {
    id: "bundang-support-center",
    title: "분당 재건축 지원센터 안내",
    short_description: "분당 신도시 재건축 관련 상담과 안내를 받을 수 있습니다.",
    intro:
      "분당 재건축 지원센터는 분당 신도시 재건축과 관련하여 시민이 필요한 정보를 확인하고 상담을 받을 수 있도록 운영하는 안내 창구입니다.",
    services:
      "재건축 절차와 추진 단계 관련 기본 안내<br>단지별 정비사업 관련 일반 문의 응대<br>재건축 관련 민원 및 상담 창구 안내<br>시민이 자주 묻는 사항에 대한 기초 정보 제공",
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

export function DashboardSelectionPage() {
  const [supportCenters, setSupportCenters] = useState<SupportCenter[]>(fallbackSupportCenters);
  const [selectedCenter, setSelectedCenter] = useState<SupportCenter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modalTitleId = useId();
  const modalDescriptionId = useId();

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    async function loadSupportCenters() {
      const { data, error } = await supabase
        .from("dashboard_support_centers")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("센터 안내 조회 오류:", error);
        setSupportCenters(fallbackSupportCenters);
        return;
      }

      if (!data || data.length === 0) {
        setSupportCenters(fallbackSupportCenters);
        return;
      }

      setSupportCenters(data);
    }

    loadSupportCenters();
  }, []);

  const dashboardCategories = [
    {
      id: "bundang-reconstruction",
      title: "분당 재건축",
      icon: Building2,
      color: "text-red-600",
      path: "/dashboard/bundang-reconstruction",
      description: "분당 신도시 재건축 사업 정보",
    },
    {
      id: "old-town-reconstruction",
      title: "원도심 재건축",
      icon: Building2,
      color: "text-green-600",
      path: "/dashboard/old-town-reconstruction",
      description: "원도심 지역 재건축 사업 정보",
    },
    {
      id: "old-town-redevelopment",
      title: "원도심 재개발",
      icon: MapPin,
      color: "text-purple-600",
      path: "/dashboard/old-town-redevelopment",
      description: "원도심 지역 재개발 사업 정보",
    },
    {
      id: "street-housing",
      title: "가로주택정비사업",
      icon: Home,
      color: "text-blue-600",
      path: "/dashboard/street-housing",
      description: "가로주택정비사업 정보",
    },
  ];

  const openModal = (center: SupportCenter, triggerElement?: HTMLElement | null) => {
    lastFocusedElementRef.current = triggerElement ?? (document.activeElement as HTMLElement | null);
    setSelectedCenter(center);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCenter(null);

    window.setTimeout(() => {
      lastFocusedElementRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen || !modalRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const visibleFocusableElements = Array.from(focusableElements).filter(
          (element) => !element.hasAttribute("disabled") && element.offsetParent !== null
        );

        if (visibleFocusableElements.length === 0) return;

        const firstElement = visibleFocusableElements[0];
        const lastElement = visibleFocusableElements[visibleFocusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
    };
  }, [isModalOpen]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>대시보드 - 사업 유형 선택 | 성남시 개발 톡톡</title>
        <meta
          name="description"
          content="성남시 정비사업 유형별 대시보드를 선택하세요. 분당 재건축, 원도심 재건축, 원도심 재개발, 가로주택정비사업"
        />
        <link rel="canonical" href={`${window.location.origin}/dashboard`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">정비사업현황</h1>
          <p className="text-lg text-gray-600">
            원하는 사업 유형을 선택하여 상세 정보를 확인하세요.
          </p>
        </div>

        <section aria-labelledby="dashboard-category-title">
          <h2 id="dashboard-category-title" className="sr-only">
            사업 유형별 대시보드
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {dashboardCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  to={category.path}
                  aria-label={`${category.title} 대시보드로 이동`}
                  className="no-underline"
                >
                  <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full border-2 border-transparent hover:border-blue-300 focus-within:ring-4 focus-within:ring-blue-200">
                    <CardContent className="pt-8 pb-8 text-center">
                      <Icon className={`w-12 h-12 ${category.color} mx-auto mb-4`} aria-hidden="true" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="support-center-title" className="mt-14 max-w-5xl mx-auto">
  <div className="text-center mb-6">
    <h2 id="support-center-title" className="text-2xl font-bold text-gray-900 mb-2">
      지원센터 안내
    </h2>
    <p className="text-sm text-gray-600">
      재건축·재개발 관련 상담과 안내를 받을 수 있는 지원센터 정보를 확인하세요.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {supportCenters.map((center) => {
      const isBundang = center.id === "bundang-support-center";

      const cardClassName = isBundang
        ? "bg-red-50 border-red-200 shadow-sm h-full"
        : "bg-green-50 border-green-200 shadow-sm h-full";

      const buttonClassName = isBundang
        ? "w-full text-left p-6 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 hover:bg-red-100 transition-colors"
        : "w-full text-left p-6 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300 hover:bg-green-100 transition-colors";

      const iconClassName = isBundang
        ? "w-6 h-6 text-blue-700 mt-0.5 flex-shrink-0"
        : "w-6 h-6 text-green-700 mt-0.5 flex-shrink-0";

      const titleClassName = isBundang
        ? "text-base md:text-lg font-bold text-blue-900 mb-2"
        : "text-base md:text-lg font-bold text-green-900 mb-2";

      const descriptionClassName = isBundang
        ? "text-sm text-blue-800"
        : "text-sm text-green-800";

      const linkClassName = isBundang
        ? "mt-3 text-sm font-medium text-blue-900 underline underline-offset-4"
        : "mt-3 text-sm font-medium text-green-900 underline underline-offset-4";

      return (
        <Card
          key={center.id}
          className={cardClassName}
        >
          <CardContent className="p-0">
            <button
              type="button"
              onClick={(e) => openModal(center, e.currentTarget)}
              className={buttonClassName}
              aria-haspopup="dialog"
              aria-label={`${center.title} 상세 안내 열기`}
            >
              <div className="flex items-start gap-3">
                <Info className={iconClassName} aria-hidden="true" />
                <div>
                  <h3 className={titleClassName}>
                    {center.title}
                  </h3>
                  <p className={descriptionClassName}>
                    {center.short_description}
                  </p>
                  <p className={linkClassName}>
                    자세히 보기
                  </p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      );
    })}
  </div>
</section>
      </div>

      {isModalOpen && selectedCenter && (
        <div
          className="fixed inset-0 z-50"
          aria-hidden={false}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div className="absolute inset-0 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="min-h-full flex items-center justify-center"
              onClick={closeModal}
             >
              <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={modalTitleId}
                aria-describedby={modalDescriptionId}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200"
              >
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
                  <div>
                    <h2 id={modalTitleId} className="text-xl font-bold text-gray-900">
                      {selectedCenter.title}
                    </h2>
                    <p id={modalDescriptionId} className="mt-2 text-sm text-gray-600">
                      시민이 쉽게 확인할 수 있도록 지원센터의 역할, 위치, 이용시간, 문의 방법을 안내합니다.
                    </p>
                  </div>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={closeModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                    aria-label="지원센터 안내 팝업 닫기"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="px-5 py-5 sm:px-6 sm:py-6">
                  <div className="space-y-6">
                    <section aria-labelledby="center-intro-title">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-5 h-5 text-blue-700" aria-hidden="true" />
                        <h3 id="center-intro-title" className="text-lg font-semibold text-gray-900">
                          소개
                        </h3>
                      </div>
                      <p className="text-sm leading-6 text-gray-700">{selectedCenter.intro}</p>
                    </section>

                    <section aria-labelledby="center-services-title">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="w-5 h-5 text-blue-700" aria-hidden="true" />
                        <h3 id="center-services-title" className="text-lg font-semibold text-gray-900">
                          하는 일
                        </h3>
                      </div>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                         {(selectedCenter.services ?? "")
                           .split(/\r?\n/)
                           .map((service) => service.trim())
                           .filter(Boolean)
                           .map((service, index) => (
                             <li key={`${service}-${index}`}>{service}</li>
                          ))}
                      </ul>
                    </section>

                    <section aria-labelledby="center-use-title">
                      <h3 id="center-use-title" className="sr-only">
                        이용 정보
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock3 className="w-5 h-5 text-blue-700" aria-hidden="true" />
                            <p className="font-semibold text-gray-900">이용시간</p>
                          </div>
                          <p className="text-sm text-gray-700">{selectedCenter.hours}</p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPinned className="w-5 h-5 text-blue-700" aria-hidden="true" />
                            <p className="font-semibold text-gray-900">위치</p>
                          </div>
                          <p className="text-sm text-gray-700">{selectedCenter.location}</p>
                        </div>
                      </div>
                    </section>

                    <section aria-labelledby="center-contact-title">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-5 h-5 text-blue-700" aria-hidden="true" />
                        <h3 id="center-contact-title" className="text-lg font-semibold text-gray-900">
                          문의
                        </h3>
                      </div>
                      <p className="text-sm leading-6 text-gray-700 whitespace-pre-line">{selectedCenter.contact}</p>
                    </section>

                    <section aria-labelledby="center-note-title">
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <h3 id="center-note-title" className="text-sm font-semibold text-yellow-900 mb-2">
                          안내사항
                        </h3>
                        <p className="text-sm leading-6 text-yellow-900 whitespace-pre-line">{selectedCenter.note}</p>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="border-t border-gray-200 px-5 py-4 sm:px-6 flex justify-end">
                  <Button
                    type="button"
                    onClick={closeModal}
                    className="bg-blue-700 hover:bg-blue-800 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                  >
                    닫기
                  </Button>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
