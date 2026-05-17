# API 키 설정 가이드

> **중요**: API 키는 절대 Git에 커밋하지 마세요!  
> Supabase 대시보드에서 환경 변수로 관리합니다.

---

## 📋 목차

1. [ChatGPT API 키 설정](#1-chatgpt-api-키-설정)
2. [시정소식 공공 API 키 설정](#2-시정소식-공공-api-키-설정)
3. [Any-ID API 키 설정](#3-any-id-api-키-설정)
4. [환경 변수 적용 확인](#4-환경-변수-적용-확인)

---

## 1. ChatGPT API 키 설정

### 🎯 현재 상태
- 지금은 개인 ChatGPT API 키 사용 중
- **내일 모레부터** 성남시청에서 가입한 ChatGPT API 키로 교체 필요

### 📍 설정 위치: Supabase 대시보드

#### 단계별 설정 방법:

**1단계: Supabase 대시보드 접속**
```
https://supabase.com/dashboard
→ 프로젝트 선택
```

**2단계: Edge Functions 환경 변수 설정**
```
좌측 메뉴: Edge Functions
→ 상단 탭: Settings (톱니바퀴 아이콘)
→ Environment Variables 섹션
```

**3단계: OPENAI_API_KEY 찾기 및 수정**
```
1. 기존 OPENAI_API_KEY 항목 찾기
2. "Edit" 버튼 클릭
3. Value 입력란에 새 API 키 붙여넣기:
   
   sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
4. "Save" 클릭
```

**4단계: Edge Function 재배포 (중요!)**
```
환경 변수 변경 후에는 반드시 Edge Function을 재배포해야 적용됩니다.

방법 1: Supabase CLI 사용
$ supabase functions deploy server

방법 2: Supabase 대시보드
Edge Functions → server → Deploy 버튼 클릭
```

### ✅ 성남시청 ChatGPT API 키 받는 방법

성남시청 담당자에게 다음 정보를 요청하세요:

```
1. OpenAI API Key 형식:
   sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
2. 사용 가능한 모델:
   - gpt-4o-mini (현재 사용 중, 권장)
   - gpt-4o
   - gpt-3.5-turbo
   
3. 월 사용량 제한 확인
```

### 🔍 현재 사용 중인 곳

**AI 챗봇 (홈페이지)**
```typescript
// 위치: /supabase/functions/server/index.tsx
// 라인: ~12

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

// 사용: POST /make-server-66444bd0/chat
// 모델: gpt-4o-mini
```

---

## 2. 시정소식 공공 API 키 설정

### 🎯 시정소식 자동 수집 API

성남시청이나 공공데이터포털에서 시정소식을 자동으로 가져오려면 다음 API가 필요합니다:

### 📍 설정 가능한 공공 API

#### 옵션 1: 공공데이터포털 API

**1. API 신청**
```
https://www.data.go.kr/
→ 회원가입 (성남시청 공무원 계정)
→ "성남시 뉴스" 또는 "지자체 공지사항" API 검색
→ 활용신청
→ 승인 후 API 키 발급
```

**2. 발급받은 API 키 예시**
```
serviceKey=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**3. Supabase 환경 변수 추가**
```
변수명: PUBLIC_DATA_API_KEY
값: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 옵션 2: 성남시청 자체 API

성남시청에서 자체 API를 제공하는 경우:

**1. IT 부서에 문의**
```
- API 엔드포인트 URL
- 인증 키 또는 토큰
- API 문서 (요청/응답 형식)
```

**2. Supabase 환경 변수 추가**
```
변수명: SEONGNAM_NEWS_API_KEY
값: [발급받은 키]

변수명: SEONGNAM_NEWS_API_URL
값: https://api.seongnam.go.kr/news
```

### 📝 서버 코드 수정 필요

**현재**: 관리자가 수동으로 시정소식 등록  
**변경 후**: API로 자동 수집

**수정이 필요한 파일**:
```
/supabase/functions/server/index.tsx

추가할 엔드포인트:
- GET /sync-news (공공 API에서 자동 수집)
- POST /cron/sync-news (정기적 자동 수집, 예: 매일 오전 9시)
```

### 🔧 자동 수집 구현 예시 (코드 작성 필요)

```typescript
// 환경 변수 추가
const PUBLIC_DATA_API_KEY = Deno.env.get("PUBLIC_DATA_API_KEY") || "";
const SEONGNAM_NEWS_API_URL = Deno.env.get("SEONGNAM_NEWS_API_URL") || "";

// 새 라우트 추가
app.get("/make-server-f75f5f59/sync-news", async (c) => {
  // 관리자 인증 체크
  const authResult = await requireAdminAuth(c);
  if (!authResult.ok) return authResult.response;

  try {
    // 공공 API에서 뉴스 가져오기
    const response = await fetch(
      `${SEONGNAM_NEWS_API_URL}?serviceKey=${PUBLIC_DATA_API_KEY}`
    );
    
    const newsData = await response.json();
    
    // KV Store에 저장
    for (const news of newsData.items) {
      await kvSet(`news:${news.id}`, {
        title: news.title,
        content: news.content,
        imageUrl: news.imageUrl,
        category: news.category,
        date: news.publishedDate,
        source: "공공데이터포털",
        createdAt: new Date().toISOString()
      });
    }
    
    return c.json({ success: true, count: newsData.items.length });
  } catch (error) {
    console.error("뉴스 동기화 오류:", error);
    return c.json({ error: error.message }, 500);
  }
});
```

---

## 3. Any-ID API 키 설정

### 📍 Any-ID 환경 변수 (이미 준비됨)

**Supabase 환경 변수 추가**:

```
ANY_ID_ENABLED=true
ANY_ID_CLIENT_ID=[발급받은 클라이언트 ID]
ANY_ID_CLIENT_SECRET=[발급받은 시크릿]
ANY_ID_AGENCY_CODE=[성남시청 기관코드]
ANY_ID_API_URL=https://anyid.go.kr
ANY_ID_REDIRECT_URI=https://your-domain.go.kr/auth/anyid/callback
```

자세한 내용은 `ANYID_INTEGRATION_GUIDE.md` 참조

---

## 4. 환경 변수 적용 확인

### ✅ 설정 후 확인 방법

**1. Supabase 대시보드에서 확인**
```
Edge Functions → Settings → Environment Variables
→ 모든 키가 정상적으로 설정되어 있는지 확인
```

**2. 로그에서 확인**
```
Edge Functions → server → Logs

✅ 정상:
"OPENAI_API_KEY loaded successfully"

❌ 오류:
"OPENAI_API_KEY is not set"
```

**3. 실제 기능 테스트**
```
✅ ChatGPT 챗봇:
   - 홈페이지 접속
   - "시범단지 분담금은?" 질문
   - AI 답변 정상 응답 확인

✅ 시정소식 자동 수집:
   - 관리자 로그인
   - 시정소식 관리 페이지
   - "동기화" 버튼 클릭
   - 새 뉴스 자동 추가 확인
```

---

## 🚨 중요 보안 사항

### ❌ 절대 하지 말 것

```bash
# ❌ 코드에 직접 키 입력 (위험!)
const OPENAI_API_KEY = "sk-proj-xxxxx";

# ❌ Git에 .env 파일 커밋 (위험!)
git add .env
git commit -m "Add API keys"
```

### ✅ 올바른 방법

```bash
# ✅ Supabase 환경 변수 사용
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

# ✅ .env 파일은 .gitignore에 추가됨
.env
.env.local
```

---

## 📞 문의

### 성남시청 담당 부서

1. **ChatGPT API 키**
   - 정보통신과 또는 디지털정책과
   - OpenAI 계약 담당자

2. **시정소식 공공 API**
   - 홍보담당관실 또는 공보담당관
   - 공공데이터 담당자

3. **Any-ID API 키**
   - 도시개발과 김현주 담당관
   - 승인번호: 5000010820

---

## 📝 체크리스트

### ChatGPT API 키 교체

- [ ] 성남시청에서 OpenAI API 키 받음
- [ ] Supabase 환경 변수 `OPENAI_API_KEY` 수정
- [ ] Edge Function 재배포
- [ ] 챗봇 테스트 완료

### 시정소식 자동 수집 (선택)

- [ ] 공공데이터포털 회원가입 및 API 신청
- [ ] API 키 발급 받음
- [ ] Supabase 환경 변수 추가
- [ ] 서버 코드 수정 (자동 수집 기능 구현)
- [ ] 동기화 기능 테스트 완료

### Any-ID 인증

- [ ] Any-ID 개발자 등록 완료
- [ ] API 키 발급 받음
- [ ] Supabase 환경 변수 추가
- [ ] 인증 플로우 테스트 완료

---

**마지막 업데이트**: 2026-05-17
