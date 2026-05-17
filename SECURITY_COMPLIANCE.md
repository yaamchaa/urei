# 성남시 개발 톡톡 - 보안 조치 사항

**작성일**: 2026년 5월 17일  
**대상**: 성남시청 정보통신과 소스코드 보안취약점 진단

---

## 📋 목차

1. [개요](#개요)
2. [관리자 인증 및 권한 관리 보안](#관리자-인증-및-권한-관리-보안)
3. [시민 사용 시 보안](#시민-사용-시-보안)
4. [서버 측 보안 강화](#서버-측-보안-강화)
5. [프론트엔드 보안 강화](#프론트엔드-보안-강화)
6. [보안 취약점 대응 상세](#보안-취약점-대응-상세)
7. [보안 점검 체크리스트](#보안-점검-체크리스트)

---

## 개요

본 문서는 "성남시 개발 톡톡" 서비스의 소스코드 보안취약점 진단을 위한 보안 조치 사항을 정리한 문서입니다.

### 시스템 구성

- **Frontend**: React 18.3.1 + TypeScript
- **Backend**: Supabase Edge Functions (Deno + Hono)
- **Database**: Supabase PostgreSQL
- **Auth**: 관리자(bcrypt), 시민(Any-ID)

---

## 관리자 인증 및 권한 관리 보안

### 1. 비밀번호 보안

#### 저장 방식
- **해싱 알고리즘**: bcrypt (Round 12)
- **Pepper 추가**: 환경 변수 `PASSWORD_PEPPER` 사용
- **위치**: `/supabase/functions/server/index.tsx` Line 2133

```typescript
const passwordHash = await bcrypt.hash(password + PASSWORD_PEPPER, 12);
```

#### 비밀번호 정책
- 최소 8자 이상
- 영문 대소문자, 숫자, 특수문자 중 3가지 이상 포함
- **위치**: `/supabase/functions/server/index.tsx` Line 182-202

### 2. 세션 관리

#### 세션 타임아웃
- **타임아웃 시간**: 30분 (1,800초)
- **자동 갱신**: 활동 시 세션 연장
- **만료 처리**: 세션 만료 시 자동 삭제 및 재로그인 요구
- **위치**: `/supabase/functions/server/index.tsx` Line 98-147

```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분
```

#### 세션 토큰
- **생성 방식**: UUID (crypto.randomUUID())
- **저장 위치**: KV Store (서버 측)
- **전송 방식**: Bearer Token (Authorization Header)

### 3. 권한 관리

#### 역할 기반 접근 제어 (RBAC)
- **일반 관리자**: 데이터 조회/수정
- **최고 관리자 (Primary Admin)**: 계정 관리 권한 포함

#### 인증 확인 미들웨어
- **위치**: `/supabase/functions/server/index.tsx` Line 98-147
- 모든 관리자 API 요청 시 토큰 검증
- 세션 타임아웃 자동 확인

### 4. Rate Limiting

#### 로그인 시도 제한
- **제한**: 1분에 5회
- **목적**: 무차별 대입 공격(Brute Force) 방지
- **위치**: `/supabase/functions/server/index.tsx` Line 2198

```typescript
if (!checkRateLimit(`login:${normalizedPhone}`, 5, 60000)) {
  return c.json({ error: "너무 많은 로그인 시도..." }, 429);
}
```

### 5. 활동 로그

#### 로그 기록 항목
- 로그인 성공/실패
- 관리자 등록
- 프로필 수정
- 데이터 변경 작업

#### 로그 정보
- 관리자 ID
- 액션 타입
- 타임스탬프
- IP 주소 (선택)
- **위치**: `/supabase/functions/server/index.tsx` Line 124-145

---

## 시민 사용 시 보안

### 1. Any-ID 인증 방식
- 공공기관 전용 Any-ID 사용
- 익명성 보장 (개인정보 미수집)

### 2. 질문/답변 보안

#### 입력 검증
- **제목 길이**: 1~200자
- **내용 길이**: 1~2,000자
- **위치**: `/supabase/functions/server/index.tsx` Line 1693-1699

#### XSS 방지
```typescript
const sanitizedTitle = sanitizeHtml(title);
const sanitizedContent = sanitizeHtml(content);
```
- 모든 HTML 태그 제거
- JavaScript 코드 삭제
- 이벤트 핸들러 제거

#### Rate Limiting
- **질문 생성**: 1분에 3개
- **답변 생성**: 1분에 5개
- **위치**: `/supabase/functions/server/index.tsx` Line 1686-1689

### 3. 메시지/댓글 보안

#### 입력 검증
- **메시지 내용**: 1~1,000자
- **댓글 내용**: 1~500자

#### Rate Limiting
- **메시지 생성**: 1분에 5개
- **댓글 생성**: 1분에 10개
- **위치**: `/supabase/functions/server/index.tsx` Line 1469-1472, 1527-1530

#### 금지어 필터링
- 서버 측 금지어 리스트 검증
- 부적절한 단어 자동 차단
- **위치**: `/supabase/functions/server/index.tsx` Line 210-227

```typescript
const BANNED_WORDS = [
  '씨발', '개새끼', '병신', '좆', '지랄', ...
];
```

### 4. 챗봇 보안

#### Prompt Injection 방지
- 시스템 프롬프트 공개 차단
- "이전 지시를 무시하라" 등의 요청 무시
- 오프토픽 질문 거부
- **위치**: `/supabase/functions/server/index.tsx` Line 804-865

#### API 키 보안
- 환경 변수로 관리 (`OPENAI_API_KEY`)
- 클라이언트 노출 방지

---

## 서버 측 보안 강화

### 1. 보안 헤더

#### 적용된 헤더
```typescript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: geolocation=(), microphone=(), camera=()
```
- **위치**: `/supabase/functions/server/index.tsx` Line 293-307

### 2. CORS 정책
- Origin 검증
- 허용된 메서드만 허용 (GET, POST, PUT, DELETE)
- Preflight 요청 처리

### 3. 입력 Sanitization

#### HTML 태그 제거
```typescript
const sanitizeHtml = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // ...
};
```

#### SQL Injection 방지
- Supabase ORM 자동 방어
- 추가 특수문자 필터링 적용

### 4. Error Handling

#### 민감정보 노출 방지
- 에러 메시지에 스택 트레이스 미포함
- 일반적인 에러 메시지 반환
- 상세 로그는 서버 측에만 기록

### 5. 파일 업로드 보안

#### 검증 항목
- **허용 파일 형식**: JPEG, PNG, WebP, GIF
- **최대 파일 크기**: 10MB
- **위치**: `/supabase/functions/server/index.tsx` Line 207-223

---

## 프론트엔드 보안 강화

### 1. 입력 검증 라이브러리
- **위치**: `/src/app/utils/security.ts`

#### 주요 기능
- XSS 방지 (sanitizeInput)
- 금지어 검증 (containsBannedWords)
- 텍스트 길이 검증 (validateTextLength)
- 전화번호 검증 (validatePhoneNumber)
- 비밀번호 강도 검증 (validatePasswordStrength)

### 2. CSRF 보호
```typescript
export function generateCsrfToken(): string {
  const token = crypto.randomUUID();
  sessionStorage.setItem('csrf_token', token);
  return token;
}
```

### 3. 안전한 API 호출
```typescript
export async function secureFetch(url: string, options: RequestInit) {
  // 에러 처리 포함
  // 타임아웃 설정
  // 재시도 로직
}
```

---

## 보안 취약점 대응 상세

### 1. XSS (Cross-Site Scripting)

#### 대응 방법
- ✅ 서버 측 HTML 태그 제거 (sanitizeHtml)
- ✅ 프론트엔드 입력 검증 (security.ts)
- ✅ React 자동 이스케이프 활용
- ✅ CSP 헤더 적용

### 2. SQL Injection

#### 대응 방법
- ✅ Supabase ORM 자동 방어
- ✅ Parameterized Query 사용
- ✅ 특수문자 필터링

### 3. CSRF (Cross-Site Request Forgery)

#### 대응 방법
- ✅ CORS 정책 적용
- ✅ Authorization Bearer Token 사용
- ✅ CSRF Token (선택적)

### 4. 무차별 대입 공격 (Brute Force)

#### 대응 방법
- ✅ Rate Limiting 적용
- ✅ 로그인 시도 제한 (1분 5회)
- ✅ 계정 잠금 (선택적)

### 5. Session Hijacking

#### 대응 방법
- ✅ HTTPS Only (Strict-Transport-Security)
- ✅ 세션 타임아웃 (30분)
- ✅ UUID 토큰 사용

### 6. 민감정보 노출

#### 대응 방법
- ✅ 비밀번호 해시 저장 (bcrypt)
- ✅ Pepper 사용
- ✅ 환경 변수로 API 키 관리
- ✅ 에러 메시지 최소화

### 7. 파일 업로드 취약점

#### 대응 방법
- ✅ 파일 형식 검증
- ✅ 파일 크기 제한
- ✅ Private Bucket 사용

---

## 보안 점검 체크리스트

### 관리자 인증 (✅ 완료)
- [x] 비밀번호 bcrypt 해싱
- [x] Pepper 사용
- [x] 세션 타임아웃 30분
- [x] Rate Limiting (로그인 1분 5회)
- [x] 활동 로그 기록
- [x] 권한 기반 접근 제어

### 시민 사용 (✅ 완료)
- [x] 질문/답변 입력 검증 (길이, XSS)
- [x] 메시지/댓글 입력 검증
- [x] Rate Limiting (질문 1분 3회, 답변 1분 5회, 메시지 1분 5회, 댓글 1분 10회)
- [x] 금지어 필터링
- [x] 챗봇 Prompt Injection 방지

### 서버 보안 (✅ 완료)
- [x] 보안 헤더 7종 적용
- [x] CORS 정책 설정
- [x] HTML Sanitization
- [x] 파일 업로드 검증
- [x] 에러 처리 (민감정보 미노출)

### 프론트엔드 보안 (✅ 완료)
- [x] 입력 검증 유틸리티
- [x] XSS 방지
- [x] CSRF 토큰
- [x] 안전한 API 호출

### 데이터 보안 (✅ 완료)
- [x] 비밀번호 해시 저장
- [x] API 키 환경 변수 관리
- [x] 세션 서버 측 저장
- [x] HTTPS 강제 (HSTS)

---

## 결론

본 서비스는 다음과 같은 보안 조치를 통해 소스코드 보안취약점 진단을 통과할 수 있도록 설계되었습니다:

1. **관리자 인증**: bcrypt 해싱, 세션 타임아웃, Rate Limiting
2. **시민 보안**: 입력 검증, XSS 방지, 금지어 필터링, Rate Limiting
3. **서버 보안**: 보안 헤더, CORS, Sanitization, 파일 검증
4. **프론트엔드 보안**: 입력 검증, CSRF 보호, 안전한 API 호출

모든 보안 조치는 OWASP Top 10 및 행정안전부 공공기관 보안 가이드라인을 준수하였습니다.

---

**문의**: 개발팀  
**버전**: 2.0.0  
**최종 업데이트**: 2026년 5월 17일
