import { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, Building2, MapPin, Home, Newspaper, Users } from "lucide-react";
import { Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Helmet } from "react-helmet-async";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { TypingMessage } from "./TypingMessage";

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
        content:
          "죄송합니다. 응답을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.💡 문제가 계속되면 시민광장에서 질문을 남겨주세요.",
      };

      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-12" aria-labelledby="service-categories-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <h2 id="service-categories-title" className="text-xl md:text-2xl font-bold text-gray-700 flex items-center gap-2 m-[0px]">
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

      <section className="w-full pt-12 pb-8" aria-labelledby="chatbot-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <h2
            id="chatbot-title"
            className="text-xl md:text-2xl font-bold text-gray-700 flex items-center gap-2 ml-[30px] mr-[0px] my-[0px]"
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

              <form
  className="flex flex-col md:flex-row gap-2 items-stretch md:items-end"
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
    className="w-full md:flex-1 min-h-[42px] max-h-[150px] resize-none overflow-y-auto"
    disabled={isLoading}
    aria-describedby="suggested-questions-label"
    rows={1}
  />

  <Button
    type="submit"
    disabled={isLoading}
    aria-label={isLoading ? "질문 처리 중" : "질문 전송"}
    className="w-full md:w-auto shrink-0"
  >
    <Search className="w-4 h-4 mr-2" aria-hidden="true" />
    {isLoading ? "처리중..." : "검색"}
  </Button>
</form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-labelledby="cta-title">
        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardContent className="py-12 text-center">
            <h2 id="cta-title" className="text-xl font-bold mb-4">더 많은 정보가 필요하신가요?</h2>
            <p className="mb-6 text-blue-100">
              '시민광장 톡톡' 지원센터에 질문하세요.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <Link to="/community" aria-label="시민광장으로 이동" className="no-underline">
                <Button size="lg" variant="secondary" className="w-full">
                  <Users className="w-5 h-5 mr-2" aria-hidden="true" />
                  시민광장 방문
                </Button>
              </Link>
              <Link to="/guide" aria-label="재건축 가이드 페이지로 이동" className="no-underline">
                <Button size="lg" variant="secondary" className="w-full">
                  <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                  정비사업 가이드
                </Button>
              </Link>
              <a
               href="https://seongnam.go.kr/city/1000052/30001/bbsList.do"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="시정소식 뉴스 외부 페이지 새 창 이동"
               className="no-underline"
              >
               <Button size="lg" variant="secondary" className="w-full">
                <Newspaper className="w-5 h-5 mr-2" aria-hidden="true" />
                 시정소식 뉴스
                </Button>
              </a>

              <a
                href="https://seongnam.go.kr/urbanRenewal/urbanRenewalDistrictArea.do?menuIdx=1001109&returnURL=%2Fmain.do"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="정비구역 지번검색 외부 페이지 새 창 이동"
                className="no-underline"
              >
                <Button size="lg" variant="secondary" className="w-full">
                  <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                  정비구역 지번검색
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
