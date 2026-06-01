import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Calendar, TrendingUp, FileText, ExternalLink, Bell, Mail, Smartphone, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";

interface NewsItem {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  isImportant?: boolean;
}

export function NewsfeedPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [newsDetailDialogOpen, setNewsDetailDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isLoggedIn } = useUser();

  // 알림 설정 폼 상태
  const [notificationSettings, setNotificationSettings] = useState({
    email: "",
    phone: "", // 회원 전화번호
    emailEnabled: true,
    smsEnabled: false,
    importantOnly: false,
    frequency: "immediate", // immediate, daily, weekly
  });

  // 뉴스 상세보기 함수
  const handleViewNewsDetail = (news: NewsItem) => {
    setSelectedNews(news);
    setNewsDetailDialogOpen(true);
  };

  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 서버에서 뉴스 데이터 로드
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/news`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // 날짜 기준 내림차순 정렬
          const sortedNews = (data.news || []).sort((a: NewsItem, b: NewsItem) => {
            return b.date.localeCompare(a.date);
          });
          setNewsItems(sortedNews);
        } else {
          console.error("뉴스 로드 실패");
          // 기본 예시 데이터 사용
          setNewsItems(getDefaultNews());
        }
      } catch (error) {
        console.error("뉴스 로드 중 오류:", error);
        // 기본 예시 데이터 사용
        setNewsItems(getDefaultNews());
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  // 기본 예시 데이터
  const getDefaultNews = (): NewsItem[] => [
    {
      id: "1",
      date: "2026.03.16",
      category: "정책",
      title: "분당구 재건축 시범사업 가이드라인 발표",
      summary: "성남시와 분당구청이 협력하여 재건축 시범사업 추진을 위한 가이드라인을 발표했습니다. 주요 내용으로는 안전진단 기준 완화, 행정 절차 간소화 등이 포함됩니다.",
      source: "성남시청",
      isImportant: true
    },
    {
      id: "2",
      date: "2026.03.15",
      category: "교통",
      title: "지하철 8호선 연장 타당성 조사 착수",
      summary: "국토교통부가 지하철 8호선 분당 연장에 대한 타당성 조사에 착수했습니다. 2027년 상반기 중 조사 결과가 발표될 예정입니다.",
      source: "국토교통부",
      isImportant: true
    },
    {
      id: "3",
      date: "2026.03.14",
      category: "단지",
      title: "시범단지 주민설명회 개최 안내",
      summary: "시범단지 재건축 추진위원회가 오는 3월 25일 주민설명회를 개최합니다. 분담금 산정 방식과 향후 추진 일정에 대한 상세 설명이 진행될 예정입니다.",
      source: "시범단지 추진위",
      isImportant: false
    }
  ];

  const importantNews = newsItems.filter(item => item.isImportant);
  const recentNews = newsItems.slice(0, 5);
  const categoryNews = (category: string) => newsItems.filter(item => item.category === category);

  // 알림 설정 다이얼로그 열기
  const handleOpenNotificationDialog = () => {
    if (!isLoggedIn) {
      alert("⚠️ 로그인이 필요한 기능입니다.\n로그인 후 이용해주세요.");
      return;
    }

    // 사용자 정보로 초기화
    setNotificationSettings({
      ...notificationSettings,
      email: user?.phone || "", // 이메일 필드 초기화
      phone: user?.phone || "", // 회원 전화번호 자동 설정
    });
    
    // 기존 설정 불러오기
    fetchNotificationSettings();
    setNotificationDialogOpen(true);
  };

  // 알림 설정 불러오기
  const fetchNotificationSettings = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/notification-settings/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setNotificationSettings(data.settings);
        }
      }
    } catch (error) {
      console.error("알림 설정 로드 중 오류:", error);
    }
  };

  // 알림 설정 저장
  const handleSaveNotificationSettings = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/notification-settings`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            settings: notificationSettings,
          }),
        }
      );

      if (response.ok) {
        alert("✅ 알림 설정이 저장되었습니다.");
        setNotificationDialogOpen(false);
      } else {
        alert("❌ 알림 설정 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("알림 설정 저장 중 오류:", error);
      alert("❌ 알림 설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>시정소식 | 성남시 개발 톡톡</title>
        <meta name="description" content="재건축 관련 최신 소식과 중요 공지사항을 실시간으로 확인하세요" />
              <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
           <span className="w-3 h-3 bg-yellow-500 rounded-full"></span> 
            시정소식
          </h1>
          <p className="text-gray-600">성남시 소식을 실시간 확인하세요.</p>
        </div>

        {/* Important News Highlight */}
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingUp className="w-5 h-5" />
              도시정비 주요 소식
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importantNews.slice(0, 3).map((item) => (
                <article key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg">
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 break-all">{item.title}</h3>
                      <Badge variant="destructive" className="flex-shrink-0 w-fit">중요</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2 break-all">{item.summary}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <time dateTime={item.date}>{item.date}</time>
                        </span>
                        <span>·</span>
                        <span>{item.source}</span>
                        <span>·</span>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit"
                        onClick={() => handleViewNewsDetail(item)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        뉴스 상세 정보 보기
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* News Tabs */}
<div className="space-y-6 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border border-blue-100">
  <div className="grid w-full grid-cols-2 gap-3">
    <a
      href="https://seongnam.go.kr/city/1000052/30001/bbsList.do"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center justify-center rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-100 hover:text-blue-800"
    >
      성남시 새소식
    </a>

    <a
      href="https://seongnam.go.kr/city/1001101/30565/bbsList.do"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 hover:text-emerald-800"
    >
      성남시 도시정비
    </a>
  </div>
</div>      

        {/* Subscription CTA */}
        <Card className="mt-8 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold mb-2">성남소식 문자서비스</h3>
            <p className="text-blue-100 mb-4">
              성남 시정소식지를 받을 수 있습니다.
            </p>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Button 
              className="w-full font-medium"
              size="lg"
              variant="secondary"
              onClick={() => window.open("https://snvision.seongnam.go.kr/rcs.html", "_blank", "noopener,noreferrer")}
            >              
              문자서비스
            </Button>
            
             <Button 
              className="w-full font-medium"
              size="lg"
              variant="secondary"              
              onClick={() => window.open("https://snvision.seongnam.go.kr/se.html", "_blank", "noopener,noreferrer")}
            >
              비전 성남
            </Button>
            
            <Button 
              className="w-full font-medium"
              size="lg"
              variant="secondary"              
              onClick={() => window.open("https://pf.kakao.com/_NkLBV", "_blank", "noopener,noreferrer")}
            >
              카카오톡 채널
            </Button>
           </div>
            
            <p className="mt-3 text-xs text-yellow-50">
              성남소식 문자서비스, ‘비전성남’, 성남시청 카톡 채널’ 연결
            </p>
          </CardContent>
        </Card>

        {/* Notification Settings Dialog */}
        <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                뉴스 알림 설정
              </DialogTitle>
              <DialogDescription>
                중요한 재건축 소식을 이메일 또는 SMS로 받아보세요
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* 이메일 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  이메일 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">알림 채널</h3>
                
                {/* 이메일 알림 */}
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={notificationSettings.emailEnabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-900 cursor-pointer">
                      이메일 알림 받기
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      새로운 뉴스를 이메일로 받아보세요
                    </p>
                  </div>
                </div>

                {/* SMS 알림 */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="smsEnabled"
                    checked={notificationSettings.smsEnabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-900 cursor-pointer">
                      SMS 알림 받기
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      회원가입 시 등록한 전화번호({notificationSettings.phone})로 SMS 알림을 받습니다
                    </p>
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      🔒 보안: 회원만 SMS 알림 이용 가능 (타인 번호 악용 방지)
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">알림 필터</h3>
                
                {/* 중요 소식만 */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="importantOnly"
                    checked={notificationSettings.importantOnly}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, importantOnly: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="importantOnly" className="text-sm font-medium text-gray-900 cursor-pointer">
                      중요 소식만 알림 받기
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      "중요" 태그가 붙은 뉴스만 알림을 받습니다
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-3">알림 주기</label>
                <select
                  value={notificationSettings.frequency}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="immediate">즉시 알림 (뉴스 등록 시 바로 발송)</option>
                  <option value="daily">일일 요약 (매일 오후 6시)</option>
                  <option value="weekly">주간 요약 (매주 월요일 오전 9시)</option>
                </select>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>안내:</strong> 알림 설정은 언제든지 변경할 수 있으며, 수신 거부도 가능합니다.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setNotificationDialogOpen(false)}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                <Button
                  onClick={handleSaveNotificationSettings}
                  disabled={isSaving || !notificationSettings.email}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* News Detail Dialog */}
        <Dialog open={newsDetailDialogOpen} onOpenChange={setNewsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                뉴스 상세 정보
              </DialogTitle>
              <DialogDescription>
                뉴스 전체 내용을 확인하세요
              </DialogDescription>
            </DialogHeader>

            {selectedNews && (
              <div className="space-y-4 py-4">
                {/* 뉴스 카테고리 및 날짜 */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-sm">{selectedNews.category}</Badge>
                  {selectedNews.isImportant && (
                    <Badge variant="destructive" className="text-sm">중요</Badge>
                  )}
                  <span className="text-sm text-gray-500">·</span>
                  <span className="text-sm text-gray-500">{selectedNews.date}</span>
                  <span className="text-sm text-gray-500">·</span>
                  <span className="text-sm text-gray-500">{selectedNews.source}</span>
                </div>

                {/* 뉴스 제목 */}
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 break-all">
                    {selectedNews.title}
                  </h2>
                </div>

                {/* 뉴스 내용 */}
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
                    {selectedNews.summary}
                  </p>
                </div>

                {/* 출처 정보 */}
                <div className="border-t pt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">출처:</span>
                    <span>{selectedNews.source}</span>
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
