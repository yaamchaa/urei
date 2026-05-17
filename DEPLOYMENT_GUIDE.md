# 성남시 개발 톡톡 - 배포 및 접근 가이드

## 🚨 현재 발생한 문제

### 문제 상황
- **에러**: `Failed to load resource: 404` 및 `Failed to fetch dynamically imported module`
- **증상**: 성남시 내부 네트워크에서 `urel.figma.site` 도메인 접근 불가
- **원인**: 공공기관 방화벽 정책 및 SPA(Single Page Application) 라우팅 이슈

---

## ✅ 해결 방법

### 1. 네트워크/방화벽 설정 (성남시 IT 담당자 협조 필요)

#### 필수 허용 도메인
```
✓ urel.figma.site (현재 배포 도메인)
✓ *.figma.site (Figma 관련 리소스)
✓ *.supabase.co (백엔드 서버)
```

#### 확인 방법
1. **방화벽 확인**
   ```bash
   # Windows CMD에서 실행
   ping urel.figma.site
   curl https://urel.figma.site
   ```

2. **보안 정책 확인**
   - 성남시 보안 담당 부서에 Figma 도메인 화이트리스트 등록 요청
   - CSP (Content Security Policy) 설정 확인

### 2. 브라우저 캐시 삭제
- Chrome: Ctrl + Shift + Delete → 전체 기간 → 캐시 삭제
- Edge: 설정 → 개인정보 → 검색 데이터 지우기

### 3. 다른 네트워크에서 테스트
- **모바일 핫스팟**: 개인 휴대폰 테더링으로 접속 테스트
- **외부 네트워크**: 성남시 내부망이 아닌 곳에서 접속

---

## 🔧 기술적 변경 사항 (2026.04.23)

### Hash Router 적용
기존 URL 구조가 변경되었습니다:

| 기존 (Browser Router) | 변경 (Hash Router) |
|---------------------|-------------------|
| urel.figma.site/dashboard | urel.figma.site/#/dashboard |
| urel.figma.site/community | urel.figma.site/#/community |
| urel.figma.site/news | urel.figma.site/#/news |

**변경 이유**: 
- 서버 설정 없이 모든 경로 접근 가능
- 404 에러 해결
- 북마크 시 정확한 페이지 저장

---

## 🌐 접속 URL

### 메인 페이지
```
https://urel.figma.site/
또는
https://urel.figma.site/#/
```

### 주요 페이지 직접 링크
```
대시보드: https://urel.figma.site/#/dashboard
커뮤니티: https://urel.figma.site/#/community
뉴스피드: https://urel.figma.site/#/news
관리자: https://urel.figma.site/#/admin/login
```

---

## 🔐 보안 설정 체크리스트

### 성남시 IT 부서 확인 사항
- [ ] 방화벽에서 *.figma.site 허용
- [ ] 방화벽에서 *.supabase.co 허용 (백엔드 서버)
- [ ] 프록시 서버 예외 설정
- [ ] SSL/TLS 인증서 신뢰 (HTTPS)
- [ ] Content Security Policy (CSP) 확인
- [ ] CORS (Cross-Origin Resource Sharing) 허용

### 사용자 브라우저 설정
- [ ] JavaScript 활성화
- [ ] 쿠키 허용
- [ ] 팝업 차단 해제 (주소 검색 기능)
- [ ] 최신 브라우저 사용 (Chrome 90+, Edge 90+, Safari 14+)

---

## 📞 문제 지속 시 확인 사항

### 1. 에러 메시지 스크린샷
- F12 → Console 탭 → 빨간색 에러 메시지
- F12 → Network 탭 → Failed 항목

### 2. 접속 환경 정보
```
브라우저: Chrome / Edge / Safari / 기타
버전: (도움말 → 정보에서 확인)
OS: Windows 10 / 11 / macOS
네트워크: 성남시 내부망 / 외부망 / 모바일
```

### 3. 네트워크 테스트 결과
```bash
# Windows CMD에서 실행
tracert urel.figma.site
nslookup urel.figma.site
```

---

## 🚀 최종 확인 권장 사항

1. **IT 담당자 협조**: 방화벽 화이트리스트 등록
2. **외부 접속 테스트**: 모바일 핫스팟으로 정상 작동 확인
3. **브라우저 업데이트**: 최신 버전 사용
4. **캐시 삭제**: 이전 버전 캐시 제거

---

## 📌 추가 정보

### Apache + PHP + MySQL 환경 이관 계획
현재 **React + Supabase** 환경으로 개발되어 있으며,
성남시 요구사항인 **Apache + PHP + MySQL** 환경으로 이관하려면:

1. **백엔드 재개발 필요**
   - Supabase Edge Functions → PHP 스크립트 변환
   - Supabase Database → MySQL 마이그레이션

2. **프론트엔드 빌드 배포**
   - React 빌드 파일 (npm run build) → Apache 서버 배포
   - .htaccess 설정으로 SPA 라우팅 지원

3. **예상 작업 기간**: 2-3주

**권장**: 우선 현재 환경에서 안정화 후 단계적 이관

---

작성일: 2026년 4월 23일  
버전: 1.0  
최종 수정: Hash Router 적용
