import { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, Building2, MapPin, Home, Newspaper, Users, Shield, CheckCircle } from "lucide-react";
import { Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Helmet } from "react-helmet-async";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { TypingMessage } from "./TypingMessage";
import { useAnyId } from "../contexts/AnyIdContext";
import { AnyIdAuthDialog } from "./AnyIdAuthDialog";

export function HomePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string; isTyping?: boolean; isComplete?: boolean }[]
  >([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isAuthenticated: anyIdAuthenticated, user: anyIdUser } = useAnyId();
  const [anyIdDialogOpen, setAnyIdDialogOpen] = useState(false);

  const suggestedQuestions = [
    "시범단지 분담금은?",
    "공공기여는?",
    "학교 과밀화 대책",
    "이주비 대출 방법",
    "재건축 진행 단계",
    "가로주택정비사업?",
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 300);
    }
  }, [chatMessages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: query };
    const nextMessages = [...chatMessages, userMessage];

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/chat`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          messages: nextMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "FAILED_TO_GET_RESPONSE");
      }

      const assistantText =
        typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : "죄송합니다. 응답을 불러오지 못했습니다.";

      const assistantMessage = {
        role: "assistant" as const,
        content: assistantText,
        isTyping: true,
        isComplete: false,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      const typingDuration = assistantText.length * 15 + 500;

      setTimeout(() => {
        setChatMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, isComplete: true } : msg
          )
        );
      }, typingDuration);
    } catch (error: any) {
      const errorMessage = {
        role: "assistant" as const,
        content: "죄송합니다. 응답을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.💡 문제가 계속되면 시민광장에서 질문을 남겨주세요.",
      };

      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setCurrentInput(question);
    handleSearch(question);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 150);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 w-full">
      <Helmet>
        <title>성남시 개발 톡톡 - 성남시 개발 정보 소통 플랫폼</title>
        <meta
          name="description"
          content="성남시 재건축·재개발 단지 정보, 진행률, 분담금, 학군 정보를 제공하는 시민 참여 포털입니다."
        />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      {/* Any-ID 인증 안내 배너 - 미인증 시만 표시 */}
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

      <section className="w-full pt-12 pb-8" aria-labelledby="chatbot-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <h2
            id="chatbot-title"
            className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 ml-[30px] mr-[0px] my-[0px]"
          >
            <span className="w-3 h-3 bg-purple-600 rounded-full" aria-hidden="true"></span>
            AI 챗봇 톡톡
          </h2>
        </div>

        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
          <Card className="shadow-lg rounded-none sm:rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" aria-hidden="true" />
                AI 챗봇에게 물어보세요
              </CardTitle>
              <p className="text-sm text-gray-600">
                💬 성남시 정비사업 궁금한 점을 물어보세요.
              </p>
              <p className="text-sm text-gray-600">
                💬 성남시 개발 톡톡 AI상담은 재건축·재개발·가로주택정비 등 도시정비 관련 내용만 답변할 수 있으며, 정확하지 않을 수 있으니 담당 부서에 문의 하시기 바랍니다.
              </p>
            </CardHeader>
            <CardContent>
              {chatMessages.length > 0 && (
                <div
                  className="mb-4 h-[500px] md:h-96 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg"
                  ref={chatContainerRef}
                  role="log"
                  aria-live="polite"
                  aria-label="챗봇 대화 내역"
                >
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200"
                        }`}
                        ref={(el) => {
                          messageRefs.current[idx] = el;
                        }}
                      >
                        {msg.role === "user" ? (
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                        ) : (
                          <div className="text-sm">
                            {msg.isTyping && !msg.isComplete ? (
                              <TypingMessage content={msg.content} speed={15} />
                            ) : (
                              <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:my-2 prose-table:my-2">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2" id="suggested-questions-label">
                  자주 묻는 질문:
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="suggested-questions-label">
                  {suggestedQuestions.map((q, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(q)}
                      className="text-xs"
                      disabled={isLoading}
                      aria-label={`자주 묻는 질문: ${q}`}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>

              <form
                className="flex gap-2 items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(currentInput);
                }}
                role="search"
                aria-label="챗봇 질문하기"
              >
                <label htmlFor="chat-input" className="sr-only">
                  재건축 관련 질문 입력
                </label>
                <Textarea
                  ref={textareaRef}
                  id="chat-input"
                  placeholder="예: 시범단지 ..."
                  value={currentInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch(currentInput);
                    }
                  }}
                  className="flex-1 min-h-[42px] max-h-[150px] resize-none overflow-y-auto"
                  disabled={isLoading}
                  aria-describedby="suggested-questions-label"
                  rows={1}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  aria-label={isLoading ? "질문 처리 중" : "질문 전송"}
                  className="shrink-0"
                >
                  <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                  {isLoading ? "처리중..." : "검색"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full" aria-labelledby="service-categories-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <h2 id="service-categories-title" className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 m-[0px]">
            <span className="w-3 h-3 bg-purple-600 rounded-full" aria-hidden="true"></span>
            정비 사업 현황
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Link to="/dashboard/bundang-reconstruction" aria-label="분당 재건축 정보 보기" className="no-underline">
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer h-full">
              <CardContent className="pt-10 pb-8 text-center">
                <Building2 className="w-10 h-10 text-red-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-base font-bold text-gray-900">분당 재건축</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/old-town-reconstruction" aria-label="원도심 재건축 정보 보기" className="no-underline">
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer h-full">
              <CardContent className="pt-10 pb-8 text-center">
                <Building2 className="w-10 h-10 text-green-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-base font-bold text-gray-900">원도심 재건축</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/old-town-redevelopment" aria-label="원도심 재개발 정보 보기" className="no-underline">
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer h-full">
              <CardContent className="pt-10 pb-8 text-center">
                <MapPin className="w-10 h-10 text-purple-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-base font-bold text-gray-900">원도심 재개발</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/street-housing" aria-label="가로주택정비사업 정보 보기" className="no-underline">
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer h-full">
              <CardContent className="pt-10 pb-8 text-center">
                <Home className="w-10 h-10 text-blue-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-base font-bold text-gray-900 whitespace-nowrap">가로주택정비사업</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-labelledby="cta-title">
        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardContent className="py-12 text-center">
            <h2 id="cta-title" className="text-2xl font-bold mb-4">더 많은 정보가 필요하신가요?</h2>
            <p className="mb-6 text-blue-100">
              시민광장에서 다른 주민들과 소통하고, 전문가에게 질문하세요.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <Link to="/community" aria-label="시민광장으로 이동" className="no-underline">
                <Button size="lg" variant="secondary" className="w-full">
                  <Users className="w-5 h-5 mr-2" aria-hidden="true" />
                  시민광장 방문
                </Button>
              </Link>
              <Link to="/guide" aria-label="재건축 가이드 페이지로 이동" className="no-underline">
                <Button size="lg" variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                  정비사업 가이드
                </Button>
              </Link>
              <Link to="/news" aria-label="시정소식 뉴스 페이지로 이동" className="no-underline">
                <Button size="lg" variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  <Newspaper className="w-5 h-5 mr-2" aria-hidden="true" />
                  시정소식 뉴스
                </Button>
              </Link>

              <a
                href="https://seongnam.go.kr/urbanRenewal/urbanRenewalDistrictArea.do?menuIdx=1001109&returnURL=%2Fmain.do"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="정비구역 지번검색 외부 페이지 새 창 이동"
                className="no-underline"
              >
               <Button size="lg" variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50">               
                정비구역 지번검색(새창)
               </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Any-ID 인증 다이얼로그 */}
      <AnyIdAuthDialog
        open={anyIdDialogOpen}
        onOpenChange={setAnyIdDialogOpen}
      />
    </div>
  );
}
