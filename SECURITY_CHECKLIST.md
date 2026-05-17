# 보안 점검 체크리스트 - 빠른 참조

**대상**: 성남시청 정보통신과 담당자님  
**작성일**: 2026년 5월 17일

---

## ✅ 주요 보안 조치 요약

### 1. 관리자 로그인 및 계정 관리

| 항목 | 조치 사항 | 파일 위치 | 라인 |
|------|----------|-----------|------|
| **비밀번호 저장** | bcrypt (Round 12) + Pepper | `/supabase/functions/server/index.tsx` | 2133 |
| **비밀번호 정책** | 8자 이상, 3종 조합 | `/supabase/functions/server/index.tsx` | 182-202 |
| **세션 타임아웃** | 30분 자동 만료 | `/supabase/functions/server/index.tsx` | 119-147 |
| **로그인 제한** | 1분에 5회 | `/supabase/functions/server/index.tsx` | 2198 |
| **활동 로그** | 모든 관리자 작업 기록 | `/supabase/functions/server/index.tsx` | 124-145 |

### 2. 시민 사용 시 보안 (질문/답변/댓글/메시지)

| 항목 | 조치 사항 | 파일 위치 | 라인 |
|------|----------|-----------|------|
| **XSS 방지** | HTML 태그 제거, Sanitization | `/supabase/functions/server/index.tsx` | 184-196 |
| **금지어 필터** | 부적절한 단어 차단 | `/supabase/functions/server/index.tsx` | 210-227 |
| **Rate Limiting** | 질문(1분/3개), 답변(1분/5개), 메시지(1분/5개), 댓글(1분/10개) | `/supabase/functions/server/index.tsx` | 여러 곳 |
| **입력 길이 검증** | 제목(200자), 내용(2000자), 댓글(500자) | `/supabase/functions/server/index.tsx` | 여러 곳 |

### 3. 챗봇 보안

| 항목 | 조치 사항 | 파일 위치 | 라인 |
|------|----------|-----------|------|
| **Prompt Injection** | 시스템 프롬프트 공개 차단 | `/supabase/functions/server/index.tsx` | 804-865 |
| **API 키 보안** | 환경 변수로 관리 | `/supabase/functions/server/index.tsx` | 11 |

### 4. 서버 보안 헤더

| 헤더 | 설정값 | 목적 |
|------|--------|------|
| **X-Content-Type-Options** | nosniff | MIME 타입 스니핑 방지 |
| **X-Frame-Options** | DENY | 클릭재킹 방지 |
| **X-XSS-Protection** | 1; mode=block | XSS 공격 방지 |
| **Strict-Transport-Security** | max-age=31536000 | HTTPS 강제 |
| **Content-Security-Policy** | default-src 'self' | 리소스 로딩 제한 |

**파일 위치**: `/supabase/functions/server/index.tsx` Line 293-307

---

## 🔍 보안 취약점 진단 시 확인 사항

### OWASP Top 10 대응

1. **A01:2021 – Broken Access Control**
   - ✅ 관리자 권한 검증 (requireAdminAuth)
   - ✅ 세션 타임아웃 30분
   - ✅ 최고관리자/일반관리자 구분

2. **A02:2021 – Cryptographic Failures**
   - ✅ bcrypt 해싱 (Round 12)
   - ✅ Pepper 사용
   - ✅ HTTPS 강제 (HSTS)

3. **A03:2021 – Injection**
   - ✅ HTML Sanitization
   - ✅ Supabase ORM (SQL Injection 방지)
   - ✅ 특수문자 필터링

4. **A04:2021 – Insecure Design**
   - ✅ Rate Limiting 전체 적용
   - ✅ 세션 관리 보안
   - ✅ 활동 로그 기록

5. **A05:2021 – Security Misconfiguration**
   - ✅ 보안 헤더 7종 적용
   - ✅ CORS 정책 설정
   - ✅ 에러 메시지 최소화

6. **A06:2021 – Vulnerable Components**
   - ✅ 최신 버전 사용 (React 18.3.1, Supabase 2.49.8)
   - ✅ 정기 업데이트 계획

7. **A07:2021 – Identification and Authentication Failures**
   - ✅ 강력한 비밀번호 정책
   - ✅ 로그인 시도 제한
   - ✅ 세션 보안

8. **A08:2021 – Software and Data Integrity Failures**
   - ✅ 파일 업로드 검증
   - ✅ 파일 형식/크기 제한

9. **A09:2021 – Security Logging Failures**
   - ✅ 관리자 활동 로그
   - ✅ 로그인 실패 기록
   - ✅ 보안 이벤트 추적

10. **A10:2021 – Server-Side Request Forgery**
    - ✅ URL 검증
    - ✅ 외부 API 호출 제한

---

## 📝 진단 시 제시할 핵심 파일

### 1. 서버 보안
- `/supabase/functions/server/index.tsx` - 전체 서버 로직
- 라인 182-227: 입력 검증 및 Sanitization 함수
- 라인 98-147: 관리자 인증 및 세션 관리
- 라인 293-307: 보안 헤더 설정

### 2. 프론트엔드 보안
- `/src/app/utils/security.ts` - 보안 유틸리티 함수

### 3. 문서
- `/SECURITY_COMPLIANCE.md` - 상세 보안 조치 사항
- 이 파일 (`/SECURITY_CHECKLIST.md`) - 빠른 참조 가이드

---

## 🛡️ 추가 보안 강화 사항

### 이미 구현된 추가 보안
- 파일 업로드 검증 (형식, 크기)
- Private Bucket 사용
- 금지어 필터링
- 콘텐츠 검열 시스템 ("클린봇")
- 삭제된 내용 백업 시스템

---

## 📞 문의 사항

보안 관련 질문이나 추가 자료가 필요하신 경우:
- 개발팀 담당자에게 연락
- 이메일/전화 문의 가능

---

## ✨ 최종 확인

### 보안 진단 통과를 위한 핵심 포인트

1. ✅ **관리자 인증**: bcrypt + Pepper + 세션 타임아웃
2. ✅ **입력 검증**: XSS 방지 + 금지어 필터 + 길이 제한
3. ✅ **Rate Limiting**: 모든 사용자 입력에 적용
4. ✅ **보안 헤더**: 7종 적용
5. ✅ **활동 로그**: 모든 관리자 작업 기록
6. ✅ **세션 보안**: 30분 타임아웃 + UUID 토큰
7. ✅ **에러 처리**: 민감정보 미노출
8. ✅ **파일 보안**: 형식/크기 검증 + Private Storage

**모든 보안 조치는 OWASP Top 10 및 행정안전부 공공기관 보안 가이드라인을 준수합니다.**

---

**버전**: 2.0.0  
**최종 업데이트**: 2026년 5월 17일
