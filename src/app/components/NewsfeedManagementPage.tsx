import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Calendar, Tag, FileText, Save, X, AlertCircle, ExternalLink, CheckCircle, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

interface NewsItem {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  isImportant: boolean;
}

export function NewsfeedManagementPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isNewNews, setIsNewNews] = useState(false);
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<'opendata' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    category: "정책",
    title: "",
    summary: "",
    source: "",
    isImportant: false,
  });

  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElementTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 뉴스 데이터 로드
  useEffect(() => {
    fetchNews();
  }, []);

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
        setNewsItems(data.news || []);
      } else {
        console.error("뉴스 로드 실패");
      }
    } catch (error) {
      console.error("뉴스 로드 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setIsNewNews(true);
    setSelectedNews(null);
    setFormData({
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      category: "정책",
      title: "",
      summary: "",
      source: "",
      isImportant: false,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (news: NewsItem) => {
    setIsNewNews(false);
    setSelectedNews(news);
    setFormData({
      date: news.date,
      category: news.category,
      title: news.title,
      summary: news.summary,
      source: news.source,
      isImportant: news.isImportant,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (news: NewsItem) => {
    setSelectedNews(news);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedNews) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/news/${selectedNews.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        alert("✅ 뉴스가 삭제되었습니다.");
        fetchNews();
        setDeleteDialogOpen(false);
      } else {
        alert("❌ 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("삭제 중 오류:", error);
      alert("❌ 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.summary || !formData.source) {
      alert("⚠️ 모든 필수 항목을 입력해주세요.");
      return;
    }

    try {
      const url = isNewNews
        ? `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/news`
        : `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/news/${selectedNews?.id}`;

      const response = await fetch(url, {
        method: isNewNews ? "POST" : "PUT",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`✅ 뉴스가 ${isNewNews ? '추가' : '수정'}되었습니다.`);
        fetchNews();
        setEditDialogOpen(false);
      } else {
        alert(`❌ ${isNewNews ? '추가' : '수정'}에 실패했습니다.`);
      }
    } catch (error) {
      console.error("저장 중 오류:", error);
      alert("❌ 저장 중 오류가 발생했습니다.");
    }
  };

  const categories = ["정책", "단지", "교통", "교육", "금융", "환경"];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            시정소식 관리
          </h1>
          <p className="text-gray-600">재건축 관련 뉴스를 추가하고 관리하세요</p>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 시정소식 관리 안내</p>
                <p>여기서 추가한 뉴스는 "시정소식" 메뉴에서 모든 사용자에게 표시됩니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Public Data API Setup Guide */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-purple-900 mb-2">🏛️ 공공데이터 자동 수집 기능 안내</p>
                <p className="text-sm text-purple-800 mb-3">
                  국토교통부 및 성남시 공공데이터를 자동으로 수집하여 뉴스피드에 추가할 수 있습니다.
                </p>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white hover:bg-purple-50 border-purple-300 text-purple-800"
                  onClick={() => {
                    setSelectedGuide('opendata');
                    setGuideDialogOpen(true);
                  }}
                >
                  <Database className="w-4 h-4 mr-2" />
                  공공데이터포털 API 설정 가이드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Button */}
        <div className="mb-6">
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            뉴스 추가
          </Button>
        </div>

        {/* News List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">로딩 중...</p>
            </CardContent>
          </Card>
        ) : newsItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">등록된 뉴스가 없습니다.</p>
              <Button onClick={handleAdd} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                첫 뉴스 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {newsItems.map((news) => (
              <Card key={news.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-blue-600 font-semibold">
                          {news.date.split('.')[1]}월
                        </span>
                        <span className="text-lg font-bold text-blue-700">
                          {news.date.split('.')[2]}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{news.title}</h3>
                          {news.isImportant && (
                            <Badge variant="destructive" className="text-xs">중요</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline">{news.category}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-all">{news.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {news.date}
                          </span>
                          <span>·</span>
                          <span>{news.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(news)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(news)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Add Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {isNewNews ? "뉴스 추가" : "뉴스 수정"}
              </DialogTitle>
              <DialogDescription>
                뉴스 정보를 입력하세요. 모든 항목은 필수입니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="2026.03.28"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="뉴스 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요약 <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="뉴스 요약을 입력하세요"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 성남시청, 국토교통부"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Important */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={formData.isImportant}
                  onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isImportant" className="text-sm font-medium text-gray-700">
                  중요 뉴스로 표시
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                뉴스 삭제
              </DialogTitle>
              <DialogDescription>
                정말로 이 뉴스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>

            {selectedNews && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">{selectedNews.title}</p>
                <p className="text-sm text-gray-600 line-clamp-2 break-all">{selectedNews.summary}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                삭제
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* API Setup Guide Dialog */}
        <Dialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                공공데이터포털 API 설정 가이드
              </DialogTitle>
              <DialogDescription>
                공공데이터포털 API를 사용하여 정책 정보를 자동으로 수집하는 방법을 안내합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Open Data Guide */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      1단계: 공공데이터포털 가입 및 로그인
                    </h3>
                    <ol className="text-sm text-purple-800 space-y-2 ml-7 list-decimal">
                      <li>
                        <a 
                          href="https://www.data.go.kr/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 underline hover:text-purple-800 font-medium inline-flex items-center gap-1"
                        >
                          공공데이터포털 회원가입 페이지
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        에 접속합니다.
                      </li>
                      <li>회원가입 버튼을 클릭하여 계정을 생성합니다. (개인/사업자 선택 가능)</li>
                      <li>이메일 주소, 비밀번호, 이름을 입력합니다.</li>
                      <li>이메일 인증을 완료합니다.</li>
                      <li>로그인하여 공공데이터포털에 접속합니다.</li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      2단계: 재건축/성남시 관련 API 검색 및 활용신청
                    </h3>
                    <ol className="text-sm text-purple-800 space-y-2 ml-7 list-decimal">
                      <li>상단 검색창에 <strong>"성남시"</strong>, <strong>"재건축"</strong>, <strong>"주택정책"</strong> 등을 검색합니다.</li>
                      <li>유용한 데이터 API 예시:
                        <ul className="ml-5 mt-1 list-disc text-xs">
                          <li>국토교통부 아파트 실거래가 정보</li>
                          <li>성남시 재건축 사업현황 정보</li>
                          <li>국토교통부 주택 정책 공지사항</li>
                          <li>성남시 공지사항 RSS</li>
                        </ul>
                      </li>
                      <li>원하는 API를 선택하고 <strong>활용신청</strong> 버튼을 클릭합니다.</li>
                      <li>활용목적을 입력하고 <strong>신청</strong>을 완료합니다. (즉시 승인 또는 1~2일 소요)</li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      3단계: API 키 확인
                    </h3>
                    <ol className="text-sm text-purple-800 space-y-2 ml-7 list-decimal">
                      <li>로그인 후 <strong>마이페이지 → 일반 인증키(Encoding)</strong>로 이동합니다.</li>
                      <li>발급된 일반 인증키를 복사합니다. (예: xxxxxxxxxxxxxx==)</li>
                      <li>이 인증키는 여러 API에 공통으로 사용됩니다.</li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      4단계: 코드에 API 적용
                    </h3>
                    <div className="text-sm text-purple-800 space-y-3">
                      <p>발급받은 API 키를 환경 변수로 저장합니다:</p>
                      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
{`OPENDATA_SERVICE_KEY=your_service_key_here`}
                      </div>
                      <p className="mt-3">서버 코드에서 공공데이터포털 API를 사용하여 정책 정보를 수집합니다:</p>
                      <div className="bg-gray-900 text-gray-300 p-3 rounded font-mono text-xs overflow-x-auto">
{`// Supabase Edge Function
// 공공데이터 자동 수집 함수
async function fetchPublicNewsData() {
  const serviceKey = Deno.env.get('OPENDATA_SERVICE_KEY') || '';
  
  // 예시 1: 국토교통부 보도자료 RSS
  const molit_url = \`https://www.molit.go.kr/portal/service/rss/getRssList?brdctsNo=1\`;
  const molit_response = await fetch(molit_url);
  const molit_xml = await molit_response.text();
  
  // 예시 2: 성남시 공공데이터 API (성남시에서 제공하는 경우)
  const seongnam_url = \`https://openapi.seongnam.go.kr/...?serviceKey=\${serviceKey}\`;
  const seongnam_response = await fetch(seongnam_url);
  const seongnam_data = await seongnam_response.json();
  
  // 수집한 데이터를 파싱하여 뉴스피드에 추가
  const newsItems = parseNewsData(molit_xml, seongnam_data);
  
  // 뉴스피드 DB에 저장
  for (const item of newsItems) {
    await saveNewsToDatabase(item);
  }
  
  console.log(\`\${newsItems.length}개의 뉴스를 수집했습니다.\`);
  return newsItems;
}

// 정기적으로 실행 (예: 매일 오전 9시)
// Cron Job 또는 Supabase Edge Function Scheduler 사용`}
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>💡 참고사항:</strong>
                      <br/>• 무료: 대부분의 공공데이터 API는 무료로 제공
                      <br/>• 승인: 즉시 승인 또는 1~2일 소요 (API마다 다름)
                      <br/>• 호출 제한: API마다 일일 호출 횟수 제한 있음 (보통 1,000~10,000회)
                      <br/>• 데이터 형식: XML, JSON 등 다양한 형식 제공
                      <br/>• 정기 수집: Cron Job을 사용하여 매일 자동 수집 가능
                      <br/>• 법적 안전: 공식 정부 데이터로 합법적 사용 가능
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setGuideDialogOpen(false)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      확인
                    </Button>
                  </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}