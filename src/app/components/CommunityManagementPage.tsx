import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router";
import { MessageSquare, Trash2, Search, AlertCircle, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useComplexList } from "../hooks/useComplexList";
import { getCategoryName } from "../data/complexes";

// 날짜와 시간 포맷팅 함수 (한국 시간대 KST 기준)
const formatDateTime = (isoString?: string, fallbackDate?: string, fallbackTime?: string): string => {
  if (isoString) {
    try {
      const date = new Date(isoString);
      // 한국 시간대(KST, UTC+9)로 변환
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      const year = kstDate.getUTCFullYear();
      const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(kstDate.getUTCDate()).padStart(2, '0');
      const hours = String(kstDate.getUTCHours()).padStart(2, '0');
      const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch (e) {
      console.error("날짜 포맷 오류:", e);
    }
  }
  if (fallbackDate && fallbackTime) {
    return `${fallbackDate} ${fallbackTime}`;
  }
  return fallbackDate || fallbackTime || "";
};

interface Question {
  id: number;
  author: string;
  date: string;
  title: string;
  content: string;
  category: string;
  created_at?: string;
  answers?: any[];
  deleteReason?: string;
  deletedAt?: string;
}

interface Message {
  id: number;
  author: string;
  time: string;
  content: string;
  complexId: string;
  created_at?: string;
  replies?: any[];
  deleteReason?: string;
  deletedAt?: string;
}

export function CommunityManagementPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'bundang';
  const categoryName = getCategoryName(category);
  
  const { complexList, isLoading: complexesLoading } = useComplexList(category);
  const complexes = complexList || [];
  const [questions, setQuestions] = useState<Question[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [deletedQuestions, setDeletedQuestions] = useState<Question[]>([]);
  const [deletedMessages, setDeletedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 삭제 다이얼로그 상
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"question" | "message">("question");
  const [selectedItem, setSelectedItem] = useState<Question | Message | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // 삭제된 내용 다이얼로그 상태
  const [deletedDialogOpen, setDeletedDialogOpen] = useState(false);
  const [deletedSearchTerm, setDeletedSearchTerm] = useState("");

  // 페이지네이션 상태
  const [currentQuestionsPage, setCurrentQuestionsPage] = useState(1);
  const [currentMessagesPage, setCurrentMessagesPage] = useState(1);
  const [currentDeletedQuestionsPage, setCurrentDeletedQuestionsPage] = useState(1);
  const [currentDeletedMessagesPage, setCurrentDeletedMessagesPage] = useState(1);
  const itemsPerPage = 10;

  // 페이지 로드 시 스크롤 최상단
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 질문 로드 - category 변경 시에도 다시 로드
  useEffect(() => {
    loadQuestions();
  }, [category]);

  // 메시지 로드 - category 변경 시에도 다시 로드
  useEffect(() => {
    loadMessages();
  }, [category]);

  // 삭제된 질문 로드 - category 변경 시에도 다시 로드
  useEffect(() => {
    loadDeletedQuestions();
  }, [category]);

  // 삭제된 메시지 로드 - category 변경 시에도 다시 로드
  useEffect(() => {
    loadDeletedMessages();
  }, [category]);

  // 검색어 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentQuestionsPage(1);
    setCurrentMessagesPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentDeletedQuestionsPage(1);
    setCurrentDeletedMessagesPage(1);
  }, [deletedSearchTerm]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      // 카테고리별로 질문 필터링
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/questions?category=${category}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("질문 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      // 카테고리별로 메시지 필터링
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/messages?category=${category}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("메시지 로드 오류:", error);
    }
  };

  const loadDeletedQuestions = async () => {
    try {
      // 카테고리별로 삭제된 질문 필터링
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/deleted-questions?category=${category}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeletedQuestions(data.deletedQuestions || []);
      }
    } catch (error) {
      console.error("삭제된 질문 로드 오류:", error);
    }
  };

  const loadDeletedMessages = async () => {
    try {
      // 카테고리별로 삭제된 메시지 필터링
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/deleted-messages?category=${category}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeletedMessages(data.deletedMessages || []);
      }
    } catch (error) {
      console.error("삭제된 메시지 로드 오류:", error);
    }
  };

  const handleDeleteClick = (type: "question" | "message", item: Question | Message) => {
    setDeleteType(type);
    setSelectedItem(item);
    setDeleteReason("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    if (!deleteReason.trim()) {
      alert("삭제 이유를 입력해주세요.");
      return;
    }

    try {
      const endpoint = deleteType === "question"
        ? `questions/${selectedItem.id}`
        : `messages/${(selectedItem as Message).complexId}/${selectedItem.id}`;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/${endpoint}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: deleteReason }),
        }
      );

      if (response.ok) {
        alert(`✅ ${deleteType === "question" ? "질문" : "메시지"}이 삭제되었습니다.`);
        setDeleteDialogOpen(false);
        setSelectedItem(null);
        setDeleteReason("");

        // 목록 새로고침
        if (deleteType === "question") {
          loadQuestions();
          loadDeletedQuestions();
        } else {
          loadMessages();
          loadDeletedMessages();
        }
      } else {
        const errorData = await response.json();
        alert(`삭제 실패: ${errorData.error || "서버 오류"}`);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 검색 필터링
  const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 메시지 검색 필터링 (서버에서 이미 category로 필터링됨)
  const filteredMessages = messages.filter(m => {
    const complex = complexes?.find(c => c.id === m.complexId);
    const complexName = complex?.name || "";
    return (
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complexName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // 삭제된 내용 검색 필터링
  const filteredDeletedQuestions = deletedQuestions.filter(q =>
    q.title.toLowerCase().includes(deletedSearchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(deletedSearchTerm.toLowerCase()) ||
    q.author.toLowerCase().includes(deletedSearchTerm.toLowerCase()) ||
    (q.deleteReason && q.deleteReason.toLowerCase().includes(deletedSearchTerm.toLowerCase()))
  );

  // 삭제된 메시지 검색 필터링 (서버에서 이미 category로 필터링됨)
  const filteredDeletedMessages = deletedMessages.filter(m => {
    const complex = complexes?.find(c => c.id === m.complexId);
    const complexName = complex?.name || "";
    return (
      m.content.toLowerCase().includes(deletedSearchTerm.toLowerCase()) ||
      m.author.toLowerCase().includes(deletedSearchTerm.toLowerCase()) ||
      complexName.toLowerCase().includes(deletedSearchTerm.toLowerCase()) ||
      (m.deleteReason && m.deleteReason.toLowerCase().includes(deletedSearchTerm.toLowerCase()))
    );
  });

  // 페이지네이션 계산
  const totalQuestionsPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const totalMessagesPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const totalDeletedQuestionsPages = Math.ceil(filteredDeletedQuestions.length / itemsPerPage);
  const totalDeletedMessagesPages = Math.ceil(filteredDeletedMessages.length / itemsPerPage);

  const paginatedQuestions = filteredQuestions.slice(
    (currentQuestionsPage - 1) * itemsPerPage,
    currentQuestionsPage * itemsPerPage
  );

  const paginatedMessages = filteredMessages.slice(
    (currentMessagesPage - 1) * itemsPerPage,
    currentMessagesPage * itemsPerPage
  );

  const paginatedDeletedQuestions = filteredDeletedQuestions.slice(
    (currentDeletedQuestionsPage - 1) * itemsPerPage,
    currentDeletedQuestionsPage * itemsPerPage
  );

  const paginatedDeletedMessages = filteredDeletedMessages.slice(
    (currentDeletedMessagesPage - 1) * itemsPerPage,
    currentDeletedMessagesPage * itemsPerPage
  );

  // 페이지네이션 컴포넌트
  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="min-w-[40px]"
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>시민광장 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="센터톡톡 질문과 단지별 톡톡 메시지를 관리하세요" />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName} 시민광장 관리</h1>
            <p className="text-gray-600">센터톡톡 질문과 단지별 톡톡 메시지를 관리하세요</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setDeletedDialogOpen(true);
              setDeletedSearchTerm("");
            }}
            className="flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            삭제된 내용 ({deletedQuestions.length + deletedMessages.length})
          </Button>
        </div>

        {/* 검색 */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="검색어를 입력하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">
              센터톡톡 질문 ({filteredQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="messages">
              단지별 톡톡 메시지 ({filteredMessages.length})
            </TabsTrigger>
          </TabsList>

          {/* 센터톡톡 질문 탭 */}
          <TabsContent value="questions" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedQuestions.map((question) => (
                    <Card key={question.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{getCategoryName(question.category)}</Badge>
                              <span className="text-sm text-gray-500">{formatDateTime(question.created_at, question.date)}</span>
                            </div>
                            <CardTitle className="text-lg break-all line-clamp-2">
                              {question.title}
                            </CardTitle>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick("question", question)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 mb-3 break-all line-clamp-3">
                          {question.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>작성자: {question.author}</span>
                          {question.answers && question.answers.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {question.answers.length}개 답변
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Pagination
                  currentPage={currentQuestionsPage}
                  totalPages={totalQuestionsPages}
                  onPageChange={setCurrentQuestionsPage}
                />
              </>
            )}
          </TabsContent>

          {/* 단지별 톡톡 메시지 탭 */}
          <TabsContent value="messages" className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedMessages.map((message) => {
                    const complex = complexes.find(c => c.id === message.complexId);
                    return (
                      <Card key={message.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {complex && (
                                  <Badge variant="outline" className="text-xs">
                                    {complex.name}
                                  </Badge>
                                )}
                                <span className="font-semibold text-gray-900">{message.author}</span>
                                <span className="text-sm text-gray-500">{formatDateTime(message.created_at, undefined, message.time)}</span>
                                {message.replies && message.replies.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {message.replies.length}개 댓글
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 break-all line-clamp-3">
                                {message.content}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick("message", message)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              삭제
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <Pagination
                  currentPage={currentMessagesPage}
                  totalPages={totalMessagesPages}
                  onPageChange={setCurrentMessagesPage}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                {deleteType === "question" ? "질문" : "메시지"} 삭제
              </DialogTitle>
              <DialogDescription>
                삭제 이유를 입력하고 확인 버튼을 눌러주세요. 이 작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-4">
                {/* 선택된 항목 미리보기 */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {'title' in selectedItem ? (
                    <>
                      <p className="font-semibold text-gray-900 mb-1 break-all">{selectedItem.title}</p>
                      <p className="text-sm text-gray-700 break-all line-clamp-2">{selectedItem.content}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-700 break-all line-clamp-2">{selectedItem.content}</p>
                  )}
                </div>

                {/* 삭제 이유 입력 */}
                <div>
                  <Label htmlFor="deleteReason" className="text-sm font-medium text-gray-700 mb-2 block">
                    삭제 이유 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="deleteReason"
                    placeholder="삭제 이유를 입력하세요..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedItem(null);
                  setDeleteReason("");
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={!deleteReason.trim()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제 확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 삭제된 내용 다이얼로그 */}

        <Dialog open={deletedDialogOpen} onOpenChange={(open) => {
          setDeletedDialogOpen(open);
          if (!open) setDeletedSearchTerm("");
        }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-gray-600" />
                삭제된 내용
              </DialogTitle>
              <DialogDescription>
                삭제된 질문과 메시지를 확인할 수 있습니다
              </DialogDescription>
            </DialogHeader>

            {/* 삭제된 내용 검색 */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="검색어를 입력하세요..."
                value={deletedSearchTerm}
                onChange={(e) => setDeletedSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs defaultValue="deleted-questions" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deleted-questions">
                  삭제된 질문 ({filteredDeletedQuestions.length})
                </TabsTrigger>
                <TabsTrigger value="deleted-messages">
                  삭제된 메시지 ({filteredDeletedMessages.length})
                </TabsTrigger>
              </TabsList>

              {/* 삭제된 질문 탭 */}
              <TabsContent value="deleted-questions" className="space-y-4 mt-4">
                {filteredDeletedQuestions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Archive className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>삭제된 질문이 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedDeletedQuestions.map((question) => (
                        <Card key={question.id} className="bg-red-50 border-red-200">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{getCategoryName(question.category)}</Badge>
                                  <span className="text-sm text-gray-500">
                                    작성: {formatDateTime(question.created_at, question.date)}
                                  </span>
                                  <span className="text-sm text-red-600 font-medium">
                                    삭제: {formatDateTime(question.deletedAt)}
                                  </span>
                                </div>
                                <CardTitle className="text-lg break-all line-clamp-2">
                                  {question.title}
                                </CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700 mb-3 break-all line-clamp-3">
                              {question.content}
                            </p>
                            <div className="flex items-start gap-4 text-sm">
                              <span className="text-gray-500">작성자: {question.author}</span>
                            </div>
                            {question.deleteReason && (
                              <div className="mt-3 p-3 bg-white rounded border border-red-200">
                                <p className="text-xs text-gray-500 mb-1">삭제 이유</p>
                                <p className="text-sm text-gray-900 break-all">{question.deleteReason}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Pagination
                      currentPage={currentDeletedQuestionsPage}
                      totalPages={totalDeletedQuestionsPages}
                      onPageChange={setCurrentDeletedQuestionsPage}
                    />
                  </>
                )}
              </TabsContent>

              {/* 삭제된 메시지 탭 */}
              <TabsContent value="deleted-messages" className="space-y-4 mt-4">
                {filteredDeletedMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Archive className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>삭제된 메시지가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedDeletedMessages.map((message) => {
                        const complex = complexes.find(c => c.id === message.complexId);
                        return (
                          <Card key={message.id} className="bg-red-50 border-red-200">
                            <CardContent className="py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {complex && (
                                      <Badge variant="outline" className="text-xs">
                                        {complex.name}
                                      </Badge>
                                    )}
                                    <span className="font-semibold text-gray-900">{message.author}</span>
                                    <span className="text-sm text-gray-500">
                                      작성: {formatDateTime(message.created_at, undefined, message.time)}
                                    </span>
                                    <span className="text-sm text-red-600 font-medium">
                                      삭제: {formatDateTime(message.deletedAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 break-all line-clamp-3">
                                    {message.content}
                                  </p>
                                  {message.deleteReason && (
                                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                                      <p className="text-xs text-gray-500 mb-1">삭제 이유</p>
                                      <p className="text-sm text-gray-900 break-all">{message.deleteReason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <Pagination
                      currentPage={currentDeletedMessagesPage}
                      totalPages={totalDeletedMessagesPages}
                      onPageChange={setCurrentDeletedMessagesPage}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button onClick={() => {
                setDeletedDialogOpen(false);
                setDeletedSearchTerm("");
              }}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}