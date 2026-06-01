// CommunityPage v2.2.0 - 완전 익명 참여 (회원가입 없음) - Build 2026.04.11
import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router";
import { MessageSquare, ThumbsUp, Send, TrendingUp, AlertCircle, Users, Shield, MapPin, Eye, EyeOff, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { projectId, publicAnonKey } from "../../../utils/supabase/info.tsx";
import { useUser } from "../contexts/UserContext";
import { useAnyId } from "../contexts/AnyIdContext";
import { trackEvent, trackClarityEvent } from "./Analytics";
import { useComplexList } from "../hooks/useComplexList";
import { getCategoryName } from "../data/complexes";

interface QuestionAnswer {
  id: number;
  author: string;
  date: string;
  content: string;
  isExpert?: boolean;
}

interface Question {
  id: number;
  author: string;
  date: string;
  title: string;
  content: string;
  category: string;
  status?: "pending" | "answered";
  answers?: QuestionAnswer[];
  created_at?: string;
  is_private?: boolean;
  author_id?: string;
}

interface Answer {
  id: number;
  questionId: number;
  author: string;
  date: string;
  content: string;
  likes: number;
}

interface Poll {
  id: string;
  title: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  endDate: string;
  isActive: boolean;
  complexId: string;
}

interface ChatMessage {
  id: number;
  author: string;
  time: string;
  content: string;
  complexId: string;
  created_at?: string;
  replies?: ChatReply[];  // 댓글 배열 추가
}

interface ChatReply {
  id: number;
  author: string;
  time: string;
  content: string;
}

// 날짜+시간 포맷 함수 (한국 시간대 KST 기준)
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
  // fallback: 기존 date, time 필드 조합
  if (fallbackDate && fallbackTime) {
    return `${fallbackDate} ${fallbackTime}`;
  }
  if (fallbackDate) {
    return fallbackDate;
  }
  if (fallbackTime) {
    return fallbackTime;
  }
  return "";
};

// 금지어 목록
const BANNED_WORDS = [
  "씨발", "시발", "병신", "개새끼", "개세끼", "지랄", "닥쳐", "꺼져", "죽어",
  "미친", "쓰레기", "바보", "멍청", "개같", "좆", "ㅅㅂ", "ㅂㅅ", "병자",
  "ㄱㅅㄲ", "ㅈㄹ", "ㅄ", "ㅆㅂ", "년", "놈", "새끼", "니엄마", "니미", "보지", "자지", "또라이",
  "기레기", "일베충", "로퀴", "의전충", "홍어", "멍청도", "고담", "대구"
];

// 금지어 체크 함수
const checkBannedWords = (text: string): boolean => {
  const lowerText = text.toLowerCase().replace(/\s/g, "");
  return BANNED_WORDS.some(word => lowerText.includes(word.toLowerCase()));
};

export function CommunityPage() {
  const location = useLocation();
  const { user, isLoggedIn, setUser } = useUser();
  const { isAuthenticated: anyIdAuthenticated, user: anyIdUser } = useAnyId();
  const realName =
  anyIdUser?.name?.trim() ||
  user?.name?.trim() ||
  "이름없음";
  
  // URL 경로에서 카테고리 추출
  const getCategoryFromPath = () => {
    const path = location.pathname;
    if (path.includes('old-town-reconstruction')) return 'oldtown-reconstruction';
    if (path.includes('old-town-redevelopment')) return 'oldtown-redevelopment';
    if (path.includes('street-housing')) return 'garohousing';
    return 'bundang';
  };
  
  const category = getCategoryFromPath();
  const categoryName = getCategoryName(category);
  const { complexList: complexes } = useComplexList(category);
  
  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Questions 상태 (서버에서 로드)
  const [questions, setQuestions] = useState<Question[]>([]);


  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [pollTab, setPollTab] = useState<"active" | "closed">("active");
  const [selectedPollOption, setSelectedPollOption] = useState<{[pollId: string]: number | undefined}>({});
  const [votingPoll, setVotingPoll] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<{[pollId: string]: number}>({});  // 사용자가 투표한 선택지 기록

  const [newQuestion, setNewQuestion] = useState({ title: "", content: "", category: "재건축", isPrivate: false });
  
  // 카테고리별 첫 번째 단지를 기본 선택값으로 설정
  const [selectedComplex, setSelectedComplex] = useState("");
  
  // complexes 로드 후 첫 번째 단지로 초기화
  useEffect(() => {
    if (complexes.length > 0 && !selectedComplex) {
      setSelectedComplex(complexes[0].id);
    }
  }, [complexes]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      author: "김**",
      time: "10:23",
      content: "조합 설립 준비 관련서 다음 주민설명회 언제인지 아시는 분 계신가요?",
      complexId: "sibeom2",
      replies: []
    },
    {
      id: 2,
      author: "이**",
      time: "10:35",
      content: "3월 25일로 알고 있습니다. 공지 확인해보세요!",
      complexId: "sibeom2",
      replies: []
    },
    {
      id: 3,
      author: "박**",
      time: "11:12",
      content: "분담금 관련 개별 상담도 받을 수 있다고 하더라구요",
      complexId: "sibeom2",
      replies: []
    },
    {
      id: 4,
      author: "최**",
      time: "09:45",
      content: "추진위원회 구성은 어떻게 진행고 나요?",
      complexId: "saetbyeol",
      replies: []
    },
    {
      id: 5,
      author: "정**",
      time: "10:05",
      content: "현재 준비위원 모집 중입니다. 관심 있으신 분들 많이 참여해주세요!",
      complexId: "saetbyeol",
      replies: []
    },
    {
      id: 6,
      author: "한**",
      time: "14:20",
      content: "안전진단 결과는 언제쯤 나올까요?",
      complexId: "mokryeon1",
      replies: []
    },
    {
      id: 7,
      author: "송**",
      time: "08:30",
      content: "이주비 지원 관련 정보 공유해주실 분 계실까요?",
      complexId: "yangji",
      replies: []
    },
    {
      id: 8,
      author: "**",
      time: "13:15",
      content: "주차 계획안 어디서 확인 수 있나요?",
      complexId: "jangan4",
      replies: []
    },
    {
      id: 9,
      author: "강**",
      time: "11:40",
      content: "학군 관련 설명회 참석했는데 유익했습니다!",
      complexId: "neuti3",
      replies: []
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // 삭제 확인 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "answer" | "reply";
    questionId?: number;
    answerId?: number;
    messageId?: number;
    replyId?: number;
    complexId?: string;
  } | null>(null); 
  
  // 투표 데이터 가져오기
  useEffect(() => {
    loadPolls();
    // localStorage에서 사용자 투표 기록 로드
    const savedVotes = localStorage.getItem('userPollVotes');
    if (savedVotes) {
      try {
        setUserVotes(JSON.parse(savedVotes));
      } catch (error) {
        console.error("투표 기록 로드 오류:", error);
      }
    }
  }, [category]); // category가 변경될 때마다 투표 다시 로드
  
  const loadPolls = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/polls?category=${category}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPolls(data);
      }
    } catch (error) {
      console.error("투표 목록 로드 오류:", error);
    } finally {
      setPollsLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      // 사용자 ID 가져오기 (비공개 질문 필터링용)
      const userId = anyIdUser?.userId || user?.memberId;

      const headers: HeadersInit = {
        Authorization: `Bearer ${publicAnonKey}`,
      };

      // 사용자 ID가 있으면 헤더에 추가
      if (userId) {
        headers['X-User-ID'] = userId;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/questions?category=${category}`;

      // 카테고리별로 질문 필터링
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        console.error("질문 로드 실패:", response.status, await response.text());
        setQuestions([]);
      }
    } catch (error) {
      console.error("질문 목록 로드 오류:", error);
      setQuestions([]);
    }
  };

  // 질문 로드 - category가 변경될 때마다 다시 로드
  useEffect(() => {
    loadQuestions();
  }, [category]);

  // 답변 삭제 핸들러
  const handleDeleteAnswer = (questionId: number, answerId: number) => {
    setDeleteTarget({ type: "answer", questionId, answerId });
    setDeleteDialogOpen(true);
  };

  // 댓글 삭제 핸들러
  const handleDeleteReply = (complexId: string, messageId: number, replyId: number) => {
    setDeleteTarget({ type: "reply", complexId, messageId, replyId });
    setDeleteDialogOpen(true);
  };

  // 삭제 확인
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      let endpoint = "";
      if (deleteTarget.type === "answer") {
        endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/questions/${deleteTarget.questionId}/answers/${deleteTarget.answerId}`;
      } else if (deleteTarget.type === "reply") {
        endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/messages/${deleteTarget.complexId}/${deleteTarget.messageId}/replies/${deleteTarget.replyId}`;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        alert("✅ 삭제되었습니다.");
        setDeleteDialogOpen(false);
        setDeleteTarget(null);

        // 목록 새로고침
        if (deleteTarget.type === "answer") {
          loadQuestions();
        } else if (deleteTarget.type === "reply") {
          loadMessages();
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

  // Question Detail Dialog State
  const [questionDetailDialogOpen, setQuestionDetailDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  // Show All Questions State
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  
  // Show Messages Count (단지별 톡톡용) - 처음 4개, 더 보기 클릭 시 10개씩 추가
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(4);
  
  // Q&A 질문 표시 개수 (처음 4개, 더 보기 클릭 시 10개씩 추가)
  const [visibleQuestionsCount, setVisibleQuestionsCount] = useState(4);
  
  // 댓글 관련 상태
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  // Q&A 답변 관련 상태
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [answerContent, setAnswerContent] = useState("");

  const handleComplexClick = (complexId: string) => {
    // 단지 선택 시 메시지 표시 개수 초기화
    setSelectedComplex(complexId);
    setVisibleMessagesCount(4);
    setExpandedMessageId(null); // 댓글 창 닫기
  };
  
  const currentComplexMessages = chatMessages.filter(
    msg => msg.complexId === selectedComplex
  );

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/messages?complexId=${selectedComplex}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error("메시지 로드 오류:", error);
    }
  };

  // 메시지 로드
  useEffect(() => {
    loadMessages();
  }, [selectedComplex]);

  const handleSendMessage = async () => {
    // Any-ID 인증 체크
    if (!anyIdAuthenticated && !isLoggedIn) {
      alert("🔐 메시지 작성은 Any-ID 시민 인증이 필요합니다.\n\n우측 상단의 '시민 인증' 버튼을 클릭하여 본인 인증을 진행해주세요.");
      return;
    }

    if (!newMessage.trim()) {
      alert("메시지를 입력해주세요.");
      return;
    }

    // 금지어 체크
    if (checkBannedWords(newMessage)) {
      alert("⚠️ 금지어 입력 시 등록이 불가 합니다.");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            complexId: selectedComplex,
            author: realName,
            content: newMessage.trim()
          })
        }
      );

      if (response.ok) {
        setNewMessage("");
        await loadMessages();
        // GA4 및 Clarity 이벤트 추적
        trackEvent('community_message_send', {
          complex_id: selectedComplex,
          message_length: newMessage.trim().length
        });
        trackClarityEvent('community_message_send');
      } else {
        const errorData = await response.json();
        console.error("메시지 전송 오류:", errorData);
        alert("메시지 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      alert("서버 연결에 실패했습니다.");
    }
  };

  // 댓글 전송 함수
  const handleSendReply = async (messageId: number) => {
    // Any-ID 인증 체크
    if (!anyIdAuthenticated && !isLoggedIn) {
      alert("🔐 댓글 작성은 Any-ID 시민 인증이 필요합니다.\n\n우측 상단의 '시민 인증' 버튼을 클릭하여 본인 인증을 진행해주세요.");
      return;
    }

    if (!replyContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    // 금지어 체크
    if (checkBannedWords(replyContent)) {
      alert("⚠️ 금지어 입력 시 등록이 불가 합니다.");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/messages/${messageId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            complexId: selectedComplex,
            author: realName,
            content: replyContent.trim()
          })
        }
      );

      if (response.ok) {
        setReplyContent("");
        await loadMessages();
        // GA4 및 Clarity 이벤트 추적
        trackEvent('community_reply_send', {
          complex_id: selectedComplex,
          message_id: messageId
        });
        trackClarityEvent('community_reply_send');
      } else {
        const errorData = await response.json();
        console.error("댓글 전송 오류:", errorData);
        alert("댓글 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 전송 오류:", error);
      alert("서버 연결에 실패했습니다.");
    }
  };

  const handleSubmitQuestion = async () => {
    // Any-ID 인증 체크
    if (!anyIdAuthenticated && !isLoggedIn) {
      alert("🔐 질문 작성은 Any-ID 시민 인증이 필요합니다.\n\n우측 상단의 '시민 인증' 버튼을 클릭하여 본인 인증을 진행해주세요.");
      return;
    }

    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    // 금지어 체크
    if (checkBannedWords(newQuestion.title) || checkBannedWords(newQuestion.content)) {
      alert("⚠️ 금지어 입력 시 등록이 불가 합니다.");
      return;
    }

    try {
      // 사용자 ID 가져오기 (Any-ID 또는 일반 사용자)
      const authorId = anyIdUser?.userId || user?.memberId || 'anonymous';

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            author: realName,
            title: newQuestion.title.trim(),
            content: newQuestion.content.trim(),
            category: category, // 현재 페이지의 카테고리 사용
            is_private: newQuestion.isPrivate,
            author_id: authorId
          })
        }
      );

      if (response.ok) {
        alert("✅ 질문이 등록되었습니다!");

        // GA4 및 Clarity 이벤트 추적
        trackEvent('question_submit', {
          category: newQuestion.category,
          title_length: newQuestion.title.trim().length
        });
        trackClarityEvent('question_submit');

        // 질문 폼 초기화
        setNewQuestion({
          title: "",
          content: "",
          category: "재건축",
          isPrivate: false,
        });

        await loadQuestions(); // 질문 다시 로드
      } else {
        const errorData = await response.json();
        console.error("질문 등록 오류:", errorData);
        alert("질문 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("질문 등록 오류:", error);
      alert("서버 연결에 실패했습니다.");
    }
  };
  
  // 답변 제출 함수
  const handleSubmitAnswer = async (questionId: number) => {
    // 관리자 인증 체크
    if (!isLoggedIn || user?.role !== "admin") {
      alert("🔐 센터톡톡 답변은 관리자만 작성할 수 있습니다.");
      return;
    }

    if (!answerContent.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    // 금지어 체크
    if (checkBannedWords(answerContent)) {
      alert("⚠️ 금지어 입력 시 등록이 불가 합니다.");
      return;
    }

    try {
      const authorName = realName;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/questions/${questionId}/answers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            author: authorName,
            content: answerContent.trim()
          })
        }
      );

      if (response.ok) {
        setAnswerContent("");        
        alert("✅ 답변이 등록되었습니다!");

        // GA4 및 Clarity 이벤트 추적
        trackEvent('answer_submit', {
          question_id: questionId
        });
        trackClarityEvent('answer_submit');

        await loadQuestions(); 
      } else {
        const errorData = await response.json();
        console.error("답변 등록 오류:", errorData);
        alert("답변 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("답변 등록 오류:", error);
      alert("서버 연결에 실패했습니다.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
           <span className="w-3 h-3 bg-red-600 rounded-full"></span> 
            {categoryName} 톡톡
          </h1>
          <p className="text-gray-600">문의 하시면 지원 센터에서 답변을 드립니다.</p>
        </div>

        {/* Info Banner */}      
        <Tabs defaultValue="qna" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="qna">센터 톡톡</TabsTrigger>
            <TabsTrigger value="sms">바로문자</TabsTrigger>
            
          </TabsList>

          {/* 센터 톡톡 Tab */}
          <TabsContent value="qna" className="space-y-6">
            {/* Ask Question */}
            <Card>
              <CardHeader>
                
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" aria-hidden="true" />
                센터에 물어 보면 답변
              </CardTitle>
              <p className="text-sm text-gray-600">
                💬 본 게시판은 단순 문의 및 안내 게시판으로 민원 및 법령질의는 {" "} 
                <a
                href="https://www.epeople.go.kr/index.jsp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                국민신문고 바로가기
               </a>
                를 이용하여 주시기 바랍니다.
              </p>
                <p className="text-sm text-gray-600">
                💬 현재 플랫폼 시범운영 중으로 정식 개통 시 질문글 게시 가능합니다.
              </p>
            </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      제목 <span className="text-xs text-gray-500">({newQuestion.title.length}/50자)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${newQuestion.isPrivate ? 'text-gray-500' : 'font-semibold text-blue-600'}`}>공개</span>
                      <Switch
                        checked={newQuestion.isPrivate}
                        onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, isPrivate: checked })}
                      />
                      <span className={`text-sm ${newQuestion.isPrivate ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>비공개</span>
                    </div>
                  </div>
                  <Input
                    placeholder="예: 도시정비 관련 문의입니다"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 <span className="text-xs text-gray-500">({newQuestion.content.length}/500자)</span>
                  </label>
                  <Textarea
                    placeholder="궁금한 내용을 자세히 작성해주세요..."
                    rows={4}
                    value={newQuestion.content}
                    onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                    maxLength={500}
                  />
                </div>
                <Button onClick={handleSubmitQuestion} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  등록하기
                </Button>
               </CardContent>              
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">최근 문의</h3>
                <Badge variant="secondary">{questions.length}개 문의</Badge>
              </div>

              {questions.slice(0, visibleQuestionsCount).map((q) => {
                return (
                <Card key={q.id} className="bg-gray-50">
                  {/* 질문 본문 */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {q.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900">{q.author}</span>
                          <span className="text-xs text-gray-500">{formatDateTime(q.created_at, q.date)}</span>
                          <Badge variant="outline" className="text-xs">{q.category}</Badge>
                          {q.is_private && (
                            <Badge variant="secondary" className="text-xs bg-gray-700 text-white">
                              <EyeOff className="w-3 h-3 mr-1" />
                              비공개
                            </Badge>
                          )}
                          {q.answers && q.answers.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {q.answers.length}개 답변
                            </Badge>
                          )}
                        </div>
                        <h4 className={`font-semibold mb-1 break-all line-clamp-3 ${(q as any).censored ? 'text-gray-600 Notosans-kr' : 'text-gray-900'}`}>
                          {q.title}
                        </h4>
                        <p className={`text-sm mb-2 break-all line-clamp-3 ${(q as any).censored ? 'text-gray-600 Notosans-kr' : 'text-gray-700'}`}>
                          {q.content}
                        </p>
                        <div className="text-xs text-gray-500">
                          {expandedQuestionId === q.id ? "👆 클릭하여 접기" : "💬 질문 답변하기"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 답변 영역 (확장 시) */}
                  {expandedQuestionId === q.id && (
                    <div className="border-t border-gray-200 px-4 pb-4">
                      {/* 기존 답변 목록 */}
                      {q.answers && q.answers.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-semibold text-gray-700 mb-2">💬 답변 {q.answers.length}개</p>
                          {q.answers.map((answer) => (
                            <div key={answer.id} className="flex gap-2 bg-white p-3 rounded">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {answer.author.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-900">{answer.author}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime((answer as any).created_at, answer.date)}</span>
                                </div>
                                <p className={`text-sm break-all line-clamp-3 ${(answer as any).censored ? 'text-red-600 italic' : 'text-gray-700'}`}>{answer.content}</p>
                              </div>
                              {user?.role === "admin" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAnswer(q.id, answer.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 답변 입력창 - 관리자만 보임*/}
                    {user?.role === "admin" && (  
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          답변 ({answerContent.length}/500자)
                        </label>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="답변을 입력하세요..."
                            value={answerContent}
                            onChange={(e) => setAnswerContent(e.target.value)}
                            className="flex-1"
                            rows={3}
                            maxLength={500}
                          />
                        </div>
                        <Button
                          onClick={() => handleSubmitAnswer(q.id)}
                          size="sm"
                          className="mt-2 w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          답변 등록
                        </Button>
                      </div>
                     )} 
                    </div>                 
                  )}
                </Card>
               );
             })}
                            
              {/* 더 보기 버튼 */}
              {questions.length > visibleQuestionsCount && (
                <div className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setVisibleQuestionsCount(prev => prev + 10)}
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    더 보기 ({questions.length - visibleQuestionsCount}개 질문 더 보기)
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* SMS Service Tab - 바로문자 */}
          <TabsContent value="sms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[22px] font-bold">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  성남시"바로문자 서비스"
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 서비스 소개 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📱 바로문자 란?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    성남시가 운영하는 시민의 불편 사항 및 개선·시정을 휴대폰 문자로 
                    간단히 보낼 수 있는 대표적인 시민 소통 창구입니다.
                  </p>
                </div>

                {/* 이용 방법 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 이용 방법</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                      <p className="text-gray-700 flex-1">
                        아래 전화번호를 클릭하여 문자(SMS) 작성 화면을 엽니다
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                      <p className="text-gray-700 flex-1">
                        궁금한 내용을 문자로 작성하여 전송합니다
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                      <p className="text-gray-700 flex-1">
                        담당 부서에서 확인 후 문자로 답변을 보내드립니다
                      </p>
                    </div>
                  </div>

                  {/* 전화번호 버튼 */}
                  <div className="mt-6 text-center">
                    <a
                      href="sms:010-5920-0184"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-lg text-xl transition-colors whitespace-nowrap"
                    >
                      📲 010-5920-0184
                    </a>
                    <p className="text-gray-600 mt-5 text-[15px]">
                      ☝️ 성남시 바로문자서비스 전용번호
                    </p>
                  </div>
                </div>

                {/* 처리 구조 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">✨ 처리 구조</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>시민이 문자 전송</strong> - 언제든지 문자를 보낼 수 있습니다</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>성남시 소통관실이 접수</strong> - 질문 내용에 따라 담당 부서로 직접 연결됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>빠른 답변</strong> - 해당 부서(교통, 안전, 복지, 환경 등) 로 이첩 후 조사·조치</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>무료 서비스</strong> - 결과를 동일한 번호로 문자 답변으로 회신</span>
                    </li>
                  </ul>
                </div>

                {/* 주요 특징·장점 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">⚠️ 주요 특징·장점</h3>
                  <ul className="space-y-1 text-sm text-gray-700">                    
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>앱 설치, 회원가입, 로그인 없이 휴대폰 문자 하나로 가능</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab - 소통방 톡톡 */}
          <TabsContent value="chat" className="space-y-6">
            {/* Complex Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  소통방 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {complexes.map((complex) => (
                    <Button
                      key={complex.id}
                      variant={selectedComplex === complex.id ? "default" : "outline"}
                      onClick={() => handleComplexClick(complex.id)}
                      className="h-auto py-3"                      
                    >
                      <div className="text-left">
                        <div className="font-semibold">{complex.name}</div>
                        <div className="text-xs opacity-75">
                          <Shield className="w-3 h-3 inline mr-1" />
                          인증 필요
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 단지 및 구역별 투표 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  {complexes.find(c => c.id === selectedComplex)?.name} 투표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 진행중 / 마감 탭 */}
                  <div className="flex items-center gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setPollTab("active")}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        pollTab === "active"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      진행중인 투표
                      <Badge variant="secondary" className="ml-2">
                        {polls.filter(p => p.isActive && p.complexId === selectedComplex).length}
                      </Badge>
                    </button>
                    <button
                      onClick={() => setPollTab("closed")}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        pollTab === "closed"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      마감한 투표
                      <Badge variant="secondary" className="ml-2">
                        {polls.filter(p => !p.isActive && p.complexId === selectedComplex).length}
                      </Badge>
                    </button>
                  </div>

                  {pollsLoading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">로딩 중...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {polls.filter(p => (pollTab === "active" ? p.isActive : !p.isActive) && p.complexId === selectedComplex).length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>
                            {pollTab === "active" ? "진행중인 투표가 없습니다." : "마감한 투표가 없습니다."}
                          </p>
                        </div>
                      ) : (
                        polls
                          .filter(p => (pollTab === "active" ? p.isActive : !p.isActive) && p.complexId === selectedComplex)
                          .map((poll) => (
                            <Card key={poll.id} className="bg-gray-50">
                              <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                  <CardTitle className="text-lg">{poll.title}</CardTitle>
                                  <Badge variant={poll.isActive ? "default" : "outline"}>
                                    {poll.endDate} {poll.isActive ? "마감" : "마감됨"}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {poll.options.map((option, idx) => {
                                  const percentage = poll.totalVotes > 0
                                    ? (option.votes / poll.totalVotes) * 100
                                    : 0;
                                  const isSelected = selectedPollOption[poll.id] === idx;

                                  return (
                                    <div key={idx} className="space-y-2">
                                      {poll.isActive ? (
                                        <label
                                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                                            isSelected
                                              ? "border-blue-600 bg-blue-50"
                                              : "border-gray-200 hover:border-gray-300"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={`poll-${poll.id}`}
                                            checked={isSelected}
                                            onChange={() => {
                                              setSelectedPollOption({ ...selectedPollOption, [poll.id]: idx });
                                            }}
                                            className="w-4 h-4"
                                          />
                                          <span className="flex-1 text-sm font-medium text-gray-700">
                                            {option.text}
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            {option.votes}표
                                          </span>
                                        </label>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">{option.text}</span>
                                            <span className="text-sm text-gray-600">
                                              {option.votes}표 ({percentage.toFixed(1)}%)
                                            </span>
                                          </div>
                                          <Progress value={percentage} className="h-2" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                <div className="pt-4 border-t border-gray-200">
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-600">총 투표수</span>
                                    <span className="text-sm font-bold text-gray-900">{poll.totalVotes}명</span>
                                  </div>
                                  {poll.isActive && (
                                    <>
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={votingPoll === poll.id || selectedPollOption[poll.id] === undefined}
                                        onClick={async () => {
                                          // 이미 투표한 경우 재투표 확인
                                          const previousVote = userVotes[poll.id];
                                          const newVote = selectedPollOption[poll.id];
                                          if (newVote === undefined) return;

                                          if (previousVote !== undefined && previousVote !== newVote) {
                                            if (!window.confirm("이미 투표하셨습니다.\n\n다른 선택지로 재투표하시겠습니까?\n(이전 투표는 취소됩니다)")) {
                                              return;
                                            }
                                          }

                                          setVotingPoll(poll.id);

                                          try {
                                            const response = await fetch(
                                              `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/polls/${poll.id}/vote`,
                                              {
                                                method: "POST",
                                                headers: {
                                                  Authorization: `Bearer ${publicAnonKey}`,
                                                  "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify({
                                                  optionIndex: selectedPollOption[poll.id],
                                                  previousVote: previousVote,
                                                }),
                                              }
                                            );

                                            if (response.ok) {
                                              // 투표 기록 저장
                                              const newUserVotes = { ...userVotes, [poll.id]: newVote };
                                              setUserVotes(newUserVotes);
                                              localStorage.setItem('userPollVotes', JSON.stringify(newUserVotes));

                                              // 투표 목록 다시 로드
                                              await loadPolls();

                                              alert("✅ 투표가 완료되었습니다!");

                                              // 선택 초기화
                                              setSelectedPollOption({ ...selectedPollOption, [poll.id]: undefined });
                                            } else {
                                              alert("❌ 투표에 실패했습니다.");
                                            }
                                          } catch (error) {
                                            console.error("투표 오류:", error);
                                            alert("❌ 투표 중 오류가 발생했습니다.");
                                          } finally {
                                            setVotingPoll(null);
                                          }
                                        }}
                                      >
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        {votingPoll === poll.id ? "투표 중..." : userVotes[poll.id] !== undefined ? "재투표하기" : "투표 참여하기"}
                                      </Button>
                                      {userVotes[poll.id] !== undefined && (
                                        <p className="text-xs text-blue-600 text-center mt-2">
                                          ℹ️ 이미 투표하셨습니다 (선택지 변경 가능)
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    {complexes.find(c => c.id === selectedComplex)?.name} 소통방 톡톡
                  </CardTitle>
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {currentComplexMessages.length}개 메시지
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Messages */}
                <div className="space-y-4 mb-4">
                  {currentComplexMessages.length > 0 ? (
                    currentComplexMessages.slice(0, visibleMessagesCount).map((msg) => (
                      <div key={msg.id} className="bg-gray-50 rounded-lg">
                        {/* 메시지 본문 */}
                        <div 
                          className="flex gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors rounded-lg"
                          onClick={() => setExpandedMessageId(expandedMessageId === msg.id ? null : msg.id)}
                        >
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {msg.author.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{msg.author}</span>
                              <span className="text-xs text-gray-500">{formatDateTime(msg.created_at, undefined, msg.time)}</span>
                              {msg.replies && msg.replies.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  {msg.replies.length}개 댓글
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm break-all line-clamp-3 ${(msg as any).censored ? 'text-gray-600 Notosans-kr' : 'text-gray-700'}`}>
                              {msg.content}
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              {expandedMessageId === msg.id ? "👆 클릭하여 접기" : "💬 댓글 작성하기"}
                            </div>
                          </div>
                        </div>
                        
                        {/* 댓글 영역 (확장 시) */}
                        {expandedMessageId === msg.id && (
                          <div className="border-t border-gray-200 px-3 pb-3">
                            {/* 기존 댓글 목록 */}
                            {msg.replies && msg.replies.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {msg.replies.map((reply) => (
                                  <div key={reply.id} className="flex gap-2 bg-white p-2 rounded">
                                    <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                      {reply.author.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-gray-900">{reply.author}</span>
                                        <span className="text-xs text-gray-500">{formatDateTime((reply as any).created_at, undefined, reply.time)}</span>
                                      </div>
                                      <p className={`text-sm break-all line-clamp-3 ${(reply as any).censored ? 'text-red-600 italic' : 'text-gray-700'}`}>{reply.content}</p>
                                    </div>
                                    {user?.role === "admin" && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteReply(msg.complexId, msg.id, reply.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* 댓글 입력창 */}
                            <div className="mt-3">
                              <label className="block text-xs text-gray-500 mb-1">
                                댓글 ({replyContent.length}/500자)
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="댓글을 입력하세요..."
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendReply(msg.id);
                                    }
                                  }}
                                  className="flex-1"
                                  maxLength={500}
                                />
                                <Button
                                  onClick={() => handleSendReply(msg.id)}
                                  size="sm"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>아직 메시지가 없습니다.</p>
                      <p className="text-sm">첫 메시지를 남겨보세요!</p>
                    </div>
                  )}
                </div>

                {/* 더 보기 버튼 */}
                {currentComplexMessages.length > visibleMessagesCount && (
                  <div className="border-t pt-4 pb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setVisibleMessagesCount(prev => prev + 10)}
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      더 보기 ({currentComplexMessages.length - visibleMessagesCount}개 메시지 더 보기)
                    </Button>
                  </div>
                )}

                {/* Message Input */}
                <div className="border-t pt-4">
                  <label className="block text-xs text-gray-500 mb-1">
                    메시지 ({newMessage.length}/100자)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="메시지를 입력하세요..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      maxLength={100}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Guidelines */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base">소통방 톡톡 이용 규칙</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 기본 안내 */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-2">📢 소통방 톡톡 운영 목적</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="pl-4 -indent-4">• 같은 단지 및 구역 조합원들끼리 도시정비 관련 정보를 공유하는 공간입니다</li>
                      <li className="pl-4 -indent-4">• 설명회, 주민 모임, 투표 등의 일정을 공지하고 함께 참여할 수 있습니다</li>
                      <li className="pl-4 -indent-4">• 본인이 속한 단지 및 구역의 톡톡에만 메시지를 작성할 수 있습니다</li>
                    </ul>
                  </div>

                  {/* 금지 사항 */}
                  <div>
                    <h4 className="font-semibold text-sm text-red-700 mb-2">🚫 금지 사항</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="pl-4 -indent-4">• 욕설, 비방, 허위 사실 유포는 엄격히 금지됩니다</li>
                      <li className="pl-4 -indent-4">• 개인정보(전화번호, 주소 등)를 공개하지 마세요</li>
                      <li className="pl-4 -indent-4">• 상업적 광고, 홍보, 영리 목적의 게시글은 삭제됩니다</li>
                      <li className="pl-4 -indent-4">• 정치적·종교적 논쟁을 유발하는 게시글은 제한됩니다</li>
                      <li className="pl-4 -indent-4">• 타 단지 및 구역 비방 및 비교하는 게시글은 삭제됩니다</li>
                    </ul>
                  </div>

                  {/* 권장 사항 */}
                  <div>
                    <h4 className="font-semibold text-sm text-green-700 mb-2">✅ 권장 사항</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="pl-4 -indent-4">• 존중하는 언어를 사용하고 서로 배려해주세요</li>
                      <li className="pl-4 -indent-4">• 정확한 정보를 공유하고, 출처를 밝혀주세요</li>
                      <li className="pl-4 -indent-4">• 궁금한 점은 자유롭게 질문하고, 아는 정보는 나눠주세요</li>
                      <li className="pl-4 -indent-4">• 중요한 공지사항은 "📌" 이모지를 활용해주세요</li>
                    </ul>
                  </div>

                  {/* 운영 안내 */}
                  <div className="pt-3 border-t border-green-300">
                    <p className="text-xs text-gray-600">
                      ⚠️ <strong>성남시 도시 정비</strong>와 함께협력하여 운영됩니다.<br/>
                      규칙 위반 시 경고 없이 게시글 삭제 및 이용 제한 조치가 취해질 수 있습니다.<br/>
                      정상적이지 않은 소통메세지 및 댓글은 삭제 할 수 습니다.<br/>
                      건전한 소통 문화를 만들어주셔서 감사합니다. 💚
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Community Guidelines */}
        <Card className="mt-8 bg-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">커뮤니티 이용 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="pl-4 -indent-4">• 정상적이지 않은 질문은 삭제 할 수 있습니다.</li>
              <li className="pl-4 -indent-4">• 허위 정보 유포 및 타인 비방은 금지됩니다.</li>
              <li className="pl-4 -indent-4">• 개인정보 보호를 위해 구체적인 개인정보는 작성하지 마세요.</li>
              <li className="pl-4 -indent-4">• 정확한 정보는 반드시 공식 채널을 통해 확인하세요.</li>
              <li className="pl-4 -indent-4">• 분당 재건축 지원센터 및 원도심 재개발·재건축 지원센터가 모니터링합니다.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Question Detail Dialog */}
      <Dialog open={questionDetailDialogOpen} onOpenChange={setQuestionDetailDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              질문 상세보기
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              질문과 답변을 확인하세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedQuestion && (
              <Card key={selectedQuestion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{selectedQuestion.title}</h4>
                        <Badge variant="outline">{selectedQuestion.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{selectedQuestion.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{selectedQuestion.author}</span>
                        <span>·</span>
                        <span>{selectedQuestion.date}</span>
                        <span>·</span>
                        <span className="text-blue-600 font-medium">답변 {selectedQuestion.answers?.length || 0}개</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 답변 목록 */}
            {selectedQuestion && selectedQuestion.answers && (
              <div className="space-y-4">
                {selectedQuestion.answers.map((answer) => (
                  <Card key={answer.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex gap-4">
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{answer.author}</h4>
                          </div>
                          <p className={`text-sm mb-3 ${(answer as any).censored ? 'text-red-600 italic' : 'text-gray-600'}`}>{answer.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{answer.date}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* 예시 안내 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      💡 실제 운영 시 질문이 계속 추가됩니다
                    </p>
                    <p className="text-sm text-blue-700">
                      백엔드 연동 시 주민들이 등록한 질문이 실시간으로 이 목록에 추가되며, 페이지네이션으로 더 많은 질문을 탐색할 수 있습니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuestionDetailDialogOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              {deleteTarget?.type === "answer" ? "답변" : "댓글"} 삭제
            </DialogTitle>
            <DialogDescription>
              삭제 하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
