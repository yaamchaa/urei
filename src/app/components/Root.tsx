import { Outlet, Link, useLocation } from "react-router";
import { Home, LayoutDashboard, Users, Newspaper, BookOpen, Menu, X, Settings, User, LogOut, MapPin, Phone, TrendingUp, UserCog, CalendarDays, DollarSign, BarChart3, School, Bus, FileText, Rss, ChevronDown, ChevronRight, Building2, Image, Info, Car, Layers, LineChart, Shield, Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import seongnamLogo from "figma:asset/6618bbf3a75e67ab50721119f6e09d28ed4f0e9b.png";
import { useUser } from "../contexts/UserContext";
import { useAnyId } from "../contexts/AnyIdContext";
import { SkipNav } from "./SkipNav";
import { SessionTimeoutWarning } from "./SessionTimeoutWarning";
import { AnalyticsWrapper } from "./AnalyticsWrapper";
import { AnyIdWelcomeDialog } from "./AnyIdWelcomeDialog";
import { AnyIdAuthDialog } from "./AnyIdAuthDialog";
import { clearCsrfToken } from "../utils/csrf";

export function Root() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const settingsMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout, isLoggedIn } = useUser();
  const { isAuthenticated: anyIdAuthenticated } = useAnyId();
  const [anyIdDialogOpen, setAnyIdDialogOpen] = useState(false);

  const canManageLogin =
    user?.isPrimaryAdmin === true;

  console.log("current user:", user);
  console.log("role:", user?.role);
  console.log("isPrimaryAdmin:", user?.isPrimaryAdmin);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [location.pathname]);

  // 모바일 메뉴 포커스 트랩
  useEffect(() => {
    if (!mobileMenuOpen || !mobileMenuRef.current) return;

    const mobileMenu = mobileMenuRef.current;
    const focusableElements = mobileMenu.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // 메뉴가 열릴 때 첫 번째 요소에 포커스
    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    mobileMenu.addEventListener('keydown', handleTabKey);

    return () => {
      mobileMenu.removeEventListener('keydown', handleTabKey);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false);
        setActiveSubmenu(null);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (userMenuOpen) {
          setUserMenuOpen(false);
          userMenuButtonRef.current?.focus();
        }
        if (settingsMenuOpen) {
          setSettingsMenuOpen(false);
          setActiveSubmenu(null);
          settingsMenuButtonRef.current?.focus();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          setMobileSubmenuOpen(null);
        }
      }
    }

    if (userMenuOpen || settingsMenuOpen || mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [userMenuOpen, settingsMenuOpen, mobileMenuOpen]);

  const handleLinkClick = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    setMobileMenuOpen(false);
    setMobileSubmenuOpen(null);
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      clearCsrfToken();
      logout();
      setUserMenuOpen(false);
      alert("✅ 로그아웃되었습니다.");
    }
  };

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/dashboard", icon: LayoutDashboard, label: "정비사업현황" },
    { path: "/community", icon: Users, label: "시민광장 톡톡" },
    { path: "/news", icon: Newspaper, label: "시정소식" },
    { path: "/guide", icon: BookOpen, label: "가이드" },
  ];

  const managementItems = [
    ...(canManageLogin
      ? [{ path: "/login-management", icon: UserCog, label: "계정 관리" }]
      : []),
    { path: "/security-logs", icon: Shield, label: "🔒 보안 활동 로그" },
    { path: "/dashboard-selection-management", icon: Info, label: "센터 안내 관리" },
    { path: "/complex-selection-management", icon: Building2, label: "단지선택 관리" },
    { path: "/basic-info-management", icon: Info, label: "기본정보 관리" },
    { path: "/progress-management", icon: TrendingUp, label: "진행율 관리" },
    { path: "/contribution-management", icon: DollarSign, label: "분담금 관리" },
    { path: "/parking-management", icon: Car, label: "주차 개선 관리" },
    { path: "/floors-management", icon: Building2, label: "예상 층수 관리" },
    { path: "/floor-area-ratio-management", icon: Layers, label: "용적률 관리" },
    { path: "/image-management", icon: Image, label: "조감도/배치도/구역계" },    
    { path: "/school-management", icon: School, label: "학군 정보 관리" },
    { path: "/transport-management", icon: Bus, label: "교통 정보 관리" },
    { path: "/notes-management", icon: FileText, label: "비고 관리" },
    { path: "/poll-management", icon: BarChart3, label: "투표 관리" },
    { path: "/community-management", icon: Users, label: "시민광장 관리" },
    { path: "/newsfeed-management", icon: Rss, label: "시정소식 관리" },
    { path: "/guide-management", icon: BookOpen, label: "가이드 관리" },
    { path: "/banner-management", icon: Bell, label: "안내 배너 관리" },
    { path: "/analytics-management", icon: LineChart, label: "통계" },
  ];

  const settingsCategories = [
    {
      id: "bundang-reconstruction",
      label: "분당 재건축",
      icon: Building2,
      items: managementItems
    },
    {
      id: "old-town-reconstruction",
      label: "원도심 재건축",
      icon: Building2,
      items: managementItems
    },
    {
      id: "old-town-redevelopment",
      label: "원도심 재개발",
      icon: MapPin,
      items: managementItems
    },
    {
      id: "street-housing",
      label: "가로주택정비사업",
      icon: Home,
      items: managementItems
    }
  ];

  const isSettingsActive = ["/progress-management", "/contribution-management",
    "/timeline-management", "/poll-management", "/school-management",
    "/transport-management", "/notes-management", "/newsfeed-management", "/login-management", "/image-management",
    "/basic-info-management", "/parking-management", "/floors-management", "/floor-area-ratio-management", "/analytics-management", "/community-management", "/security-logs", "/banner-management"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full">
      <AnalyticsWrapper />
      <SkipNav />

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" onClick={handleLinkClick} className="flex items-center gap-2 no-underline" aria-label="성남시 개발 톡톡 홈으로 이동">
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src={seongnamLogo}
                  alt="성남시 로고"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-gray-600 text-[20px]">성남시 개발톡톡(talktalk)</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <nav className="flex items-center gap-1" id="navigation" aria-label="주메뉴">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors no-underline ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {user?.role === "admin" && (
                  <div className="relative" ref={settingsMenuRef}>
                    <button
                      ref={settingsMenuButtonRef}
                      onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isSettingsActive
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      aria-expanded={settingsMenuOpen}
                      aria-haspopup="true"
                      aria-label={settingsMenuOpen ? "설정 메뉴 닫기" : "설정 메뉴 열기"}
                    >
                      <Settings className="w-5 h-5" aria-hidden="true" />
                      <span>설정</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${settingsMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>

                    {settingsMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                        role="menu"
                        aria-label="설정 하위 메뉴"
                      >
                        {settingsCategories.map((category) => {
                          const CategoryIcon = category.icon;
                          const hasSubmenu = category.items.length > 0;

                          return (
                            <div
                              key={category.id}
                              className="relative"
                            >
                              <div
                                onClick={() => hasSubmenu && setActiveSubmenu(activeSubmenu === category.id ? null : category.id)}
                                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                                role="menuitem"
                              >
                                <div className="flex items-center gap-3">
                                  <CategoryIcon className="w-4 h-4" aria-hidden="true" />
                                  <span>{category.label}</span>
                                </div>
                                {hasSubmenu && (
                                  <ChevronRight className={`w-4 h-4 transition-transform ${activeSubmenu === category.id ? 'rotate-90' : ''}`} aria-hidden="true" />
                                )}
                              </div>

                              {hasSubmenu && activeSubmenu === category.id && (
                                <div className="absolute left-full top-0 ml-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                  {category.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    // 카테고리별 쿼리 파라미터 매핑
                                    const categoryParam = category.id === 'bundang-reconstruction' ? 'bundang' : 
                                                         category.id === 'old-town-reconstruction' ? 'oldtown-reconstruction' :
                                                         category.id === 'old-town-redevelopment' ? 'oldtown-redevelopment' : 'garohousing';
                                    return (
                                      <Link
                                        key={item.path}
                                        to={`${item.path}?category=${categoryParam}`}
                                        onClick={() => {
                                          setSettingsMenuOpen(false);
                                          setActiveSubmenu(null);
                                          handleLinkClick();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors no-underline"
                                        role="menuitem"
                                      >
                                        <ItemIcon className="w-4 h-4" aria-hidden="true" />
                                        <span>{item.label}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </nav>

              {isLoggedIn && user ? (
                <div className="relative ml-3" ref={userMenuRef}>
                  <button
                    ref={userMenuButtonRef}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label={userMenuOpen ? `${user.name} 사용자 메뉴 닫기` : `${user.name} 사용자 메뉴 열기`}
                  >
                    <User className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" role="menu">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{user.complexName}</p>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <span className="text-gray-700">{user.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <span className="text-gray-700">{user.address}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-200">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors no-underline"
                          role="menuitem"
                        >
                          <User className="w-4 h-4" aria-hidden="true" />
                          <span>내 정보</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          <span>로그아웃</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-3 flex items-center gap-2">
                  {/* Any-ID 시민 인증 버튼 - 미인증 시만 표시 */}
                  {!anyIdAuthenticated && (
                    <button
                      onClick={() => setAnyIdDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                      aria-label="Any-ID 시민 인증"
                    >
                      <Shield className="w-5 h-5" aria-hidden="true" />
                      <span className="text-sm font-medium">시민 인증</span>
                    </button>
                  )}

                  {/* 관리자 로그인 버튼 - 데스크톱에서만 표시 */}
                  <Link
                    to="/admin/login"
                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors no-underline"
                    aria-label="관리자 로그인 페이지로 이동"
                  >
                    <User className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm font-medium">관리자모드</span>
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav ref={mobileMenuRef} className="md:hidden py-4 border-t border-gray-200" aria-label="모바일 주메뉴">
              {isLoggedIn && user && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white" aria-hidden="true">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.complexName}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" aria-hidden="true" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span className="break-all">{user.address}</span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={handleLinkClick}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium no-underline"
                  >
                    <User className="w-4 h-4" aria-hidden="true" />
                    <span>내 정보</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}

              {/* 로그인하지 않은 사용자: Any-ID 인증 버튼만 (미인증 시) */}
              {!isLoggedIn && !anyIdAuthenticated && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setAnyIdDialogOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Shield className="w-5 h-5" aria-hidden="true" />
                    <span>시민 인증 (Any-ID)</span>
                  </button>
                </div>
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 no-underline ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16" id="footer" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h2 className="font-bold text-gray-900 mb-3">성남시 개발톡톡(talktalk)</h2>
              <p className="text-sm text-gray-600">
                성남시 재개발, 재건축 정보 소통 플랫폼
                <br />
                성남 개발 소식 "손 안에서"
              </p>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 mb-3">문의</h2>
              <address className="text-sm text-gray-600 not-italic">
                분당구 재건축지원센터 031-729-7225~8
                <br />
                원도심 재개발·재건축지원센터 031-729-1745~7
              </address>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 mb-3">공지사항</h2>
              <p className="text-sm text-gray-600">
                ⚠️ 시민광장톡톡 문의는 Any id 시민인증 후 가능합니다.
                <br />
                개인정보는 수집 하지 않습니다.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2026 성남시 재개발·재건축 "톡톡". All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 세션 타임아웃 경고 */}
      {isLoggedIn && (
        <SessionTimeoutWarning
          onExtend={() => {
            console.log("세션 연장됨");
          }}
          onLogout={logout}
        />
      )}

      {/* Any-ID 환영 다이얼로그 (시민 첫 방문 시) */}
      <AnyIdWelcomeDialog />

      {/* Any-ID 인증 다이얼로그 */}
      <AnyIdAuthDialog
        open={anyIdDialogOpen}
        onOpenChange={setAnyIdDialogOpen}
      />
    </div>
  );
}
