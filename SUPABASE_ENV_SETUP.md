# Supabase 환경 변수 설정 가이드 (단계별 스크린샷)

> **성남시 개발 톡톡** - ChatGPT 및 공공 API 키 설정 방법

---

## 📍 설정 위치

**모든 API 키는 Supabase 대시보드의 환경 변수에서 관리합니다.**

❌ **코드 파일에 직접 입력하지 마세요!**  
✅ **Supabase 대시보드에서만 설정하세요!**

---

## 🔑 1단계: Supabase 대시보드 접속

### 1-1. 로그인
```
https://supabase.com/dashboard
```

### 1-2. 프로젝트 선택
```
성남시 개발 톡톡 프로젝트 클릭
```

---

## 🔑 2단계: Edge Functions 환경 변수 페이지 이동

### 2-1. 좌측 메뉴에서 "Edge Functions" 클릭

```
왼쪽 사이드바:
┌─────────────────────┐
│ 🏠 Home            │
│ 📊 Table Editor    │
│ 🔐 Authentication  │
│ 📦 Storage         │
│ ⚡ Edge Functions  │ ← 이것 클릭!
│ 📊 Database        │
│ ⚙️  Settings       │
└─────────────────────┘
```

### 2-2. 상단 탭에서 "Settings" (톱니바퀴 아이콘) 클릭

```
상단 탭:
┌─────────────────────────────────┐
│ Functions | Settings (⚙️)      │ ← Settings 클릭!
└─────────────────────────────────┘
```

### 2-3. "Environment Variables" 섹션 찾기

페이지를 아래로 스크롤하면 "Environment Variables" 섹션이 있습니다.

```
Environment Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These variables are available to all Edge Functions

┌──────────────────────────────────────┐
│ + Add new variable                   │
├──────────────────────────────────────┤
│ Name                    | Value       │
│ OPENAI_API_KEY         | sk-proj-... │ ← 여기에 표시됨
│ SUPABASE_URL           | https://... │
│ SUPABASE_ANON_KEY      | eyJhb...    │
└──────────────────────────────────────┘
```

---

## 🔑 3단계: ChatGPT API 키 수정

### 3-1. OPENAI_API_KEY 찾기

Environment Variables 목록에서 `OPENAI_API_KEY` 항목을 찾습니다.

### 3-2. "Edit" 버튼 클릭

```
OPENAI_API_KEY  [Edit] [Delete]
                  ↑
                여기 클릭
```

### 3-3. 새 API 키 입력

```
┌─────────────────────────────────────┐
│ Edit Environment Variable           │
├─────────────────────────────────────┤
│ Name:                               │
│ OPENAI_API_KEY                      │
│                                     │
│ Value:                              │
│ ┌─────────────────────────────────┐ │
│ │ sk-proj-새로운키를여기에붙여넣기 │ │ ← 성남시청 API 키
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]           [Save] ←클릭    │
└─────────────────────────────────────┘
```

### 3-4. "Save" 클릭

변경사항 저장 완료!

---

## 🔑 4단계: 시정소식 공공 API 키 추가 (선택)

### 4-1. "+ Add new variable" 클릭

```
┌──────────────────────────────────────┐
│ + Add new variable  ← 클릭           │
└──────────────────────────────────────┘
```

### 4-2. 변수 정보 입력

```
┌─────────────────────────────────────┐
│ Add Environment Variable            │
├─────────────────────────────────────┤
│ Name:                               │
│ ┌─────────────────────────────────┐ │
│ │ PUBLIC_DATA_API_KEY             │ │ ← 변수명
│ └─────────────────────────────────┘ │
│                                     │
│ Value:                              │
│ ┌─────────────────────────────────┐ │
│ │ 발급받은공공데이터API키          │ │ ← 키값
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]           [Save] ←클릭    │
└─────────────────────────────────────┘
```

### 4-3. 성남시청 API URL도 추가 (있는 경우)

같은 방법으로 추가:

```
Name:  SEONGNAM_NEWS_API_URL
Value: https://api.seongnam.go.kr/news
```

---

## 🔑 5단계: Edge Function 재배포 (중요!)

⚠️ **환경 변수를 변경한 후에는 반드시 재배포해야 합니다!**

### 방법 1: Supabase 대시보드에서 재배포

```
1. Edge Functions 메뉴로 이동
2. "server" 함수 찾기
3. 오른쪽 "..." (점 3개) 메뉴 클릭
4. "Deploy" 선택
5. 확인 메시지에서 "Deploy" 클릭
```

### 방법 2: Supabase CLI 사용 (추천)

터미널에서 실행:

```bash
# 프로젝트 폴더로 이동
cd /workspaces/default/code

# Edge Function 재배포
supabase functions deploy server

# 출력 예시:
# ✓ Deploying function server...
# ✓ Function deployed successfully
```

---

## ✅ 6단계: 설정 확인

### 6-1. 환경 변수 목록 확인

Environment Variables 페이지에서 다음 항목들이 모두 있는지 확인:

```
필수 항목:
✅ OPENAI_API_KEY
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ PASSWORD_PEPPER
✅ ADMIN_API_TOKEN

선택 항목 (필요 시):
□ PUBLIC_DATA_API_KEY
□ SEONGNAM_NEWS_API_URL
□ ANY_ID_CLIENT_ID
□ ANY_ID_CLIENT_SECRET
□ ANY_ID_AGENCY_CODE
```

### 6-2. Edge Function 로그 확인

```
Edge Functions → server → Logs

최근 로그에서 확인:
✅ "Edge Function deployed successfully"
✅ "OPENAI_API_KEY loaded"
```

### 6-3. 실제 기능 테스트

**ChatGPT 챗봇 테스트:**

1. 홈페이지 접속
2. 챗봇에 질문 입력: "시범단지 분담금은?"
3. AI 답변이 정상적으로 나오는지 확인

**성공 시:**
```
✅ AI가 답변을 잘 제공함
→ API 키 설정 완료!
```

**실패 시:**
```
❌ "API 키 오류" 또는 응답 없음
→ 단계 5 (재배포) 다시 확인
→ 로그에서 오류 메시지 확인
```

---

## 🔧 문제 해결

### 문제 1: API 키를 수정했는데 적용이 안 됨

**원인**: Edge Function을 재배포하지 않음

**해결**:
```bash
supabase functions deploy server
```

### 문제 2: "Permission denied" 오류

**원인**: Supabase 프로젝트 권한 없음

**해결**:
- 프로젝트 관리자에게 권한 요청
- Settings → Team → Members에서 권한 확인

### 문제 3: 환경 변수가 보이지 않음

**원인**: Edge Functions 페이지가 아닌 다른 곳에서 찾고 있음

**해결**:
```
Edge Functions (왼쪽 메뉴)
→ Settings (상단 탭)
→ Environment Variables (아래로 스크롤)
```

### 문제 4: ChatGPT API 키 형식 오류

**올바른 형식**:
```
✅ sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✅ sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

❌ OPENAI_API_KEY=sk-proj-xxx (변수명 포함 X)
❌ "sk-proj-xxx" (따옴표 포함 X)
```

---

## 📋 전체 환경 변수 목록

### 현재 설정해야 할 환경 변수

```bash
# ============================================
# 챗봇 (필수)
# ============================================
OPENAI_API_KEY=sk-proj-[성남시청API키]

# ============================================
# Supabase (자동 설정됨, 수정 X)
# ============================================
SUPABASE_URL=https://[프로젝트ID].supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_DB_URL=postgresql://...
SUPABASE_JWKS=https://...

# ============================================
# 보안 (필수, 이미 설정됨)
# ============================================
PASSWORD_PEPPER=[32자이상무작위문자열]
ADMIN_API_TOKEN=[UUID]

# ============================================
# 시정소식 자동 수집 (선택)
# ============================================
PUBLIC_DATA_API_KEY=[공공데이터포털API키]
SEONGNAM_NEWS_API_URL=[성남시APIURL]

# ============================================
# Any-ID 정부 통합인증 (나중에 추가)
# ============================================
ANY_ID_ENABLED=true
ANY_ID_CLIENT_ID=[발급받은ID]
ANY_ID_CLIENT_SECRET=[발급받은시크릿]
ANY_ID_AGENCY_CODE=[성남시기관코드]
ANY_ID_API_URL=https://anyid.go.kr
ANY_ID_REDIRECT_URI=https://your-domain/auth/anyid/callback
```

---

## 🎯 요약

### ChatGPT API 키 교체 절차 (5분)

```
1️⃣ Supabase 대시보드 접속
   https://supabase.com/dashboard

2️⃣ Edge Functions → Settings

3️⃣ Environment Variables 섹션에서
   OPENAI_API_KEY 찾기

4️⃣ Edit 클릭 → 새 API 키 붙여넣기

5️⃣ Save 클릭

6️⃣ Edge Function 재배포
   supabase functions deploy server

7️⃣ 챗봇 테스트
```

### 시정소식 API 키 추가 절차 (10분)

```
1️⃣ 공공데이터포털에서 API 키 발급
   https://www.data.go.kr/

2️⃣ Supabase Environment Variables에서
   "+ Add new variable" 클릭

3️⃣ PUBLIC_DATA_API_KEY 추가

4️⃣ SEONGNAM_NEWS_API_URL 추가 (있는 경우)

5️⃣ Edge Function 재배포

6️⃣ 서버 코드 수정 (자동 수집 기능 구현)
   → 별도 작업 필요
```

---

**작성일**: 2026-05-17  
**최종 업데이트**: ChatGPT API 키 교체 가이드 추가
