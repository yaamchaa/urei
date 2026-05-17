# Any-ID 정부 통합인증 연동 가이드

> **현재 상태**: 준비 완료 (API 키 발급 대기 중)  
> **승인번호**: 5000010820  
> **담당자**: 도시개발과 김현주 담당관  
> **연동 방식**: 중계형

## 📋 목차

1. [현재 준비된 기능](#현재-준비된-기능)
2. [API 키 발급 후 할 일](#api-키-발급-후-할-일)
3. [환경 변수 설정](#환경-변수-설정)
4. [연동 테스트 방법](#연동-테스트-방법)
5. [보안 고려사항](#보안-고려사항)
6. [문제 해결](#문제-해결)

---

## 🎯 현재 준비된 기능

### ✅ 완료된 작업

#### 1. 환경 변수 준비 (`.env.example`)
- `ANY_ID_CLIENT_ID`: 클라이언트 ID (발급 대기)
- `ANY_ID_CLIENT_SECRET`: 클라이언트 시크릿 (발급 대기)
- `ANY_ID_AGENCY_CODE`: 성남시청 기관코드 (발급 대기)
- `ANY_ID_API_URL`: Any-ID API 서버 URL
- `ANY_ID_REDIRECT_URI`: 인증 후 리다이렉트 URL
- `ANY_ID_ENABLED`: 활성화 여부 (`false` → API 키 발급 후 `true`)

#### 2. UI 컴포넌트
- **`AnyIdAuthDialog.tsx`**: 5가지 인증 방법 선택 다이얼로그
  - ✓ 모바일 신분증
  - ✓ 공동인증서
  - ✓ 금융인증서
  - ✓ 간편인증
  - ✓ 기타-ID (네이버, 카카오, 토스)
- **`AnyIdWelcomeDialog.tsx`**: 첫 방문 시 인증 안내
- **`AnyIdCallbackPage.tsx`**: 인증 완료 후 콜백 처리

#### 3. 백엔드 API (서버 라우트)
- `POST /anyid/auth/init`: 인증 시작
- `GET /anyid/auth/callback`: 인증 콜백 처리
- `GET /anyid/session/:sessionId`: 세션 조회
- `DELETE /anyid/session/:sessionId`: 로그아웃
- `GET /anyid/status`: Any-ID 활성화 상태 확인

#### 4. Context Provider
- **`AnyIdContext.tsx`**: 인증 상태 관리
- **`App.tsx`**: AnyIdProvider 추가됨

#### 5. 라우팅
- `/auth/anyid/callback`: 콜백 페이지 라우트 추가

---

## 🔑 API 키 발급 후 할 일

### 1단계: 개발자 등록 완료
승인번호 **5000010820**로 개발자 추가를 완료하고, 아래 정보를 받으세요:

- ✅ **클라이언트 ID** (client_id)
- ✅ **클라이언트 시크릿** (client_secret)
- ✅ **기관코드** (agency_code)
- ✅ **API 문서 URL** (연동 가이드 PDF 또는 온라인)
- ✅ **테스트 서버 URL**
- ✅ **운영 서버 URL**

### 2단계: API 문서 확인 및 코드 수정

받으신 API 문서를 확인하여 다음 파일들을 **실제 API 명세에 맞게 수정**해야 합니다:

#### 📄 수정 필요 파일

**`/supabase/functions/server/anyid_service.tsx`**

```typescript
// TODO 주석이 있는 부분을 실제 API 명세에 맞게 수정

// 1. generateAnyIdAuthUrl 함수
export function generateAnyIdAuthUrl(authMethod: AnyIdAuthMethod, state: string): string {
  // TODO: API 문서 확인 후 실제 엔드포인트와 파라미터 수정 필요
  const params = new URLSearchParams({
    client_id: ANY_ID_CLIENT_ID,
    redirect_uri: ANY_ID_REDIRECT_URI,
    response_type: "code",
    state: state,
    auth_method: authMethod, // ← 실제 파라미터명 확인 필요
    agency_code: ANY_ID_AGENCY_CODE,
  });

  return `${ANY_ID_API_URL}/oauth2/authorize?${params.toString()}`;
  // ↑ 실제 엔드포인트 경로 확인 필요
}

// 2. exchangeAnyIdCode 함수
export async function exchangeAnyIdCode(code: string): Promise<AnyIdTokenResponse> {
  // TODO: API 문서 확인 후 실제 구현
  const response = await fetch(`${ANY_ID_API_URL}/oauth2/token`, {
    // ↑ 실제 엔드포인트 경로 확인 필요
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: ANY_ID_CLIENT_ID,
      client_secret: ANY_ID_CLIENT_SECRET,
      redirect_uri: ANY_ID_REDIRECT_URI,
    }),
  });
  // ... 응답 형식 확인 필요
}

// 3. getAnyIdUserInfo 함수
export async function getAnyIdUserInfo(accessToken: string): Promise<AnyIdAuthResponse> {
  // TODO: API 문서 확인 후 실제 구현
  const response = await fetch(`${ANY_ID_API_URL}/api/v1/userinfo`, {
    // ↑ 실제 엔드포인트 경로 확인 필요
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  // API 응답 형식을 확인하여 매핑 수정
  return {
    ci: data.ci || data.connectingInformation, // ← 실제 필드명 확인
    name: data.name || data.userName,
    birthDate: data.birthDate || data.birthday,
    phoneNumber: data.phoneNumber || data.mobileNo,
    email: data.email,
    businessNumber: data.businessNumber,
    businessName: data.businessName,
  };
}
```

---

## ⚙️ 환경 변수 설정

### 테스트 환경 (.env)

```bash
# Any-ID Configuration
ANY_ID_ENABLED=true  # ← false에서 true로 변경
ANY_ID_CLIENT_ID=your-actual-client-id-here
ANY_ID_CLIENT_SECRET=your-actual-client-secret-here
ANY_ID_AGENCY_CODE=your-agency-code-here
ANY_ID_API_URL=https://test-anyid.go.kr  # ← 실제 테스트 서버 URL
ANY_ID_REDIRECT_URI=http://localhost:5173/auth/anyid/callback
```

### 운영 환경 (.env.production)

```bash
# Any-ID Configuration
ANY_ID_ENABLED=true
ANY_ID_CLIENT_ID=production-client-id
ANY_ID_CLIENT_SECRET=production-client-secret
ANY_ID_AGENCY_CODE=production-agency-code
ANY_ID_API_URL=https://anyid.go.kr  # ← 실제 운영 서버 URL
ANY_ID_REDIRECT_URI=https://seongnam-dev-toktok.go.kr/auth/anyid/callback
```

**⚠️ 주의사항**:
- 클라이언트 시크릿은 **절대 프론트엔드에 노출하지 말 것**
- `.env` 파일은 **Git에 커밋하지 말 것** (`.gitignore`에 추가됨)

---

## 🧪 연동 테스트 방법

### 1. 로컬 테스트

```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 실제 API 키 입력

# 2. 서버 재시작 (환경 변수 적용)
# Supabase Edge Function 재배포

# 3. 브라우저에서 테스트
# - 홈페이지 방문 시 Any-ID 인증 다이얼로그 확인
# - 인증 방법 선택 (모바일 신분증 등)
# - Any-ID 인증 페이지로 리다이렉트 확인
# - 인증 완료 후 콜백 페이지로 돌아오는지 확인
# - 세션이 생성되고 사용자 정보가 표시되는지 확인
```

### 2. 상태 확인 API

```bash
# Any-ID 활성화 여부 확인
curl https://your-project.supabase.co/functions/v1/make-server-f75f5f59/anyid/status \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# 응답 예시
{
  "enabled": true,
  "message": "Any-ID 인증이 활성화되었습니다."
}
```

### 3. 인증 플로우 테스트

1. **홈페이지 방문** → Any-ID 다이얼로그 표시
2. **인증 방법 선택** → 서버로 요청 전송
3. **Any-ID 페이지로 리다이렉트** → 본인 인증 진행
4. **콜백 페이지로 돌아옴** → 세션 생성
5. **사용자 정보 확인** → CI, 이름, 생년월일 등

---

## 🔒 보안 고려사항

### 1. 클라이언트 시크릿 보호
- ✅ 서버에서만 사용 (Supabase Edge Function)
- ✅ 프론트엔드에 노출 금지
- ✅ Git에 커밋 금지

### 2. CSRF 방지
- ✅ `state` 파라미터 사용 (UUID 생성)
- ✅ 콜백에서 state 검증
- ✅ 5분 후 state 자동 만료

### 3. 세션 관리
- ✅ 세션 ID를 localStorage에 저장
- ✅ 서버에서 세션 검증
- ✅ 30분 세션 타임아웃 (조정 가능)

### 4. CI(연계정보) 보호
- ✅ CI는 개인을 식별할 수 있는 고유 값
- ✅ 암호화하여 저장 권장
- ✅ 외부에 노출 금지

### 5. HTTPS 필수
- ✅ 운영 환경에서는 반드시 HTTPS 사용
- ✅ 리다이렉트 URI도 HTTPS

---

## 🐛 문제 해결

### 문제 1: "Any-ID가 활성화되지 않았습니다" 오류

**원인**: 환경 변수 미설정 또는 `ANY_ID_ENABLED=false`

**해결**:
```bash
# .env 파일 확인
ANY_ID_ENABLED=true  # ← true로 설정
ANY_ID_CLIENT_ID=your-client-id
ANY_ID_CLIENT_SECRET=your-client-secret
```

### 문제 2: 인증 후 콜백 페이지로 돌아오지 않음

**원인**: 리다이렉트 URI 불일치

**해결**:
1. Any-ID 관리자 페이지에서 등록한 리다이렉트 URI 확인
2. `.env`의 `ANY_ID_REDIRECT_URI`와 일치하는지 확인
3. 로컬 테스트: `http://localhost:5173/auth/anyid/callback`
4. 운영: `https://your-domain.go.kr/auth/anyid/callback`

### 문제 3: "Invalid or expired state" 오류

**원인**: CSRF 토큰 만료 또는 불일치

**해결**:
- 인증 시작부터 콜백까지 5분 이내에 완료
- 브라우저 쿠키/로컬스토리지 활성화 확인

### 문제 4: 사용자 정보 조회 실패

**원인**: API 응답 형식 불일치

**해결**:
- `anyid_service.tsx`의 `getAnyIdUserInfo` 함수 확인
- API 문서에서 실제 응답 필드명 확인
- 매핑 코드 수정

---

## 📞 지원 및 문의

### Any-ID 관련
- **행정안전부 Any-ID 고객센터**: [실제 연락처는 API 문서 참조]
- **개발자 문서**: [API 문서 URL]

### 성남시 담당자
- **도시개발과 김현주 담당관**
- **승인번호**: 5000010820

---

## 📝 체크리스트

API 키 발급 후 아래 체크리스트를 확인하세요:

### API 키 발급
- [ ] 개발자 등록 완료 (승인번호: 5000010820)
- [ ] 클라이언트 ID 받음
- [ ] 클라이언트 시크릿 받음
- [ ] 기관코드 받음
- [ ] API 문서 받음

### 코드 수정
- [ ] `anyid_service.tsx`의 TODO 주석 확인
- [ ] API 엔드포인트 URL 수정
- [ ] 요청 파라미터명 수정
- [ ] 응답 필드명 매핑 수정

### 환경 변수 설정
- [ ] `.env` 파일에 실제 API 키 입력
- [ ] `ANY_ID_ENABLED=true` 설정
- [ ] 리다이렉트 URI 등록 및 확인
- [ ] 테스트 서버 URL 확인

### 테스트
- [ ] 로컬에서 인증 플로우 테스트
- [ ] 모바일 신분증 인증 테스트
- [ ] 콜백 처리 확인
- [ ] 세션 생성 확인
- [ ] 사용자 정보 조회 확인

### 배포
- [ ] 운영 환경 변수 설정
- [ ] HTTPS 적용 확인
- [ ] 운영 서버 URL 변경
- [ ] 운영 리다이렉트 URI 등록

---

## 🎉 완료 후

API 키 발급 및 연동이 완료되면:

1. **홈페이지 방문 시 자동으로 Any-ID 인증 안내 표시**
2. **시민들은 회원가입 없이 본인 인증만으로 서비스 이용 가능**
3. **5가지 인증 방법 중 편한 방법 선택 가능**
4. **익명성 보장 (CI로만 식별, 개인정보 미수집)**

모든 준비가 완료되었습니다! API 키만 발급받으면 바로 사용 가능합니다. 🚀
