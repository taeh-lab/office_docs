# 다음 작업 스프린트 — "거창한 SaaS 껍데기" 확장

목적: 실사용 없는 포트폴리오 데모라, 실용성보다 "오픈소스/최신 UX 패턴을 다 붙여봤다"는 걸 보여주는 게 목표.
순서대로 진행하되, 각 스프린트는 독립적으로 끝나도 앱이 안 죽게 만든다 (지금까지 지켜온 폴백 원칙 유지).

기술 방향: 지금 스택(빌드 없음, CDN 스크립트, 바닐라 JS) 유지. React/npm 컴포넌트 라이브러리는 들여오지 않는다 —
스택이 섞이면 지금까지 만든 것과 안 어울리고, 직접 구현하는 것 자체가 어필 포인트이기도 함.

---

## Sprint 1 — 랜딩 히어로 모션/영상 ✅ 완료

**대상 파일**: `index.html`, `shared/assets/`

- [x] 히어로 배경 소스 결정 — 영상 트랙으로 진행. `shared/assets/hero.mp4` (Big Buck Bunny 발췌, Blender Foundation, CC BY 3.0 — 무료 오픈 라이선스, 788KB로 가벼움)
- [x] `shared/assets/hero-poster.svg` — 브랜드 컬러 그라디언트 포스터(영상 로딩 전/대체용)
- [x] `index.html`의 `.hero` 섹션을 `.wrap` 밖으로 빼서 풀블리드 영상 배경 + 오버레이 그라디언트로 텍스트 가독성 확보
- [x] `prefers-reduced-motion` 대응 — 영상 숨기고 포스터 그라디언트로 대체 + JS로 `pause()`까지 확실히
- [x] 모바일(640px 이하)에서 영상 대신 포스터로 자동 대체 (같은 미디어쿼리로 처리)
- [x] 푸터에 영상 출처/라이선스 크레딧 표기 (CC BY 3.0 요건)

## Sprint 2 — Cmd+K 커맨드 팔레트 ✅ 완료

**대상 파일**: `shared/components/command-palette.js`(신규), `shared/theme.css`, 전 페이지

- [x] `shared/components/command-palette.js` — 라이브러리 없이 직접 구현. `Cmd/Ctrl+K` 전역 리스너, 입력 필터링, 방향키/Enter/Esc 네비게이션
- [x] 기본 명령셋: 로그인 상태에 따라 대시보드/요금제/로그아웃 또는 로그인/가입 자동 구성 + 페이지별 `CommandPalette.register()`로 확장(대시보드는 뷰 전환 3개 등록)
- [x] `shared/theme.css`에 팔레트 오버레이 스타일 추가
- [x] `index.html`, `pricing.html` 상단 네비에 🔍 트리거 버튼, `dashboard.html` 사이드바에도 트리거 버튼
- [x] `index.html`, `login.html`, `signup.html`, `pricing.html`, `dashboard.html`에 스크립트 삽입 (tool.html은 임베드 전용이라 제외)

## Sprint 3 — 정기 리포트 예약 (날짜/시간 피커의 실제 자리) ✅ 완료

**대상 파일**: `dashboard.html`(새 뷰), `shared/components/datetime-picker.js`(신규)

- [x] 날짜/시간 피커 도입 — Flatpickr(CDN, 무의존성) + 한국어 로케일
- [x] 대시보드 사이드바에 "리포트 예약" 뷰 추가 — 검색어 / 반복 주기(한 번만·매일·매주) / 발송 일시(Flatpickr) / 받을 이메일
- [x] 예약 데이터는 `localStorage`(`dwf_reports_{email}`)에 저장, 목록에 카드로 표시 + 삭제 가능
- [x] 스코프 명시: 저장·목록 표시까지만 동작. 실제 이메일 발송은 서버 크론 + 이메일 API가 필요해서 데모 범위 밖 — 폼 하단에 안내 문구로 명시

## Sprint 4 — 다크모드 토글 + 토스트 알림 등 잔장치 ✅ 완료

**대상 파일**: `shared/components/theme-toggle.js`(신규), `shared/components/toast.js`(신규), `shared/theme.css`, `tool.html`

- [x] `shared/theme.css`에 다크 모드 변수 세트 추가 (`prefers-color-scheme` 기본값 + `data-theme` 속성으로 수동 override, 양방향 모두 처리)
- [x] `shared/components/theme-toggle.js` — FOUC 방지를 위해 `<head>`에서 즉시 적용, localStorage(`dwf_theme`)에 선택 저장, `.theme-toggle` 클래스 버튼 자동 연결
- [x] `shared/components/toast.js` — 우측 하단 토스트. 로그인/가입 완료(세션스토리지로 대시보드까지 전달), 플랜 업그레이드 성공, 리포트 예약 저장에 연결
- [x] 커맨드 팔레트에 "다크모드 전환" 명령 자동 등록
- [x] `tool.html`은 자체 `<style>`이라 다크 변수를 별도로 복제하고 하드코딩된 `#fff` 배경들을 `var(--white)`로 교체 — 대시보드에 임베드됐을 때 테마가 어긋나지 않게

## Sprint 5 — 마무리 다듬기 ("뭔가 아쉬운" 부분 채우기) ✅ 완료

**대상 파일**: `shared/assets/favicon.svg`, `shared/assets/og-image.svg`, `index.html`, `shared/components/usage-chart.js`(신규), `dashboard.html`, `changelog.html`(신규), `status.html`(신규)

- [x] 파비콘(SVG) + Open Graph/Twitter 카드 메타태그 — 전 페이지 파비콘, 랜딩에 OG 이미지
- [x] 랜딩에 통계 카운터 섹션 — **실제로 참인 수치만** 사용(지원 형식 5개, 무료 시작 ₩0, 100% 브라우저 처리, 요금제 4단계). 가짜 고객 로고/후기는 의도적으로 넣지 않음 — 실사용자가 없는데 후기를 지어내는 건 다른 데모용 장치(mock 로그인, 테스트 결제)와 달리 "가짜 사회적 증거"라 성격이 달라서 제외. 대신 실제로 쓰는 오픈소스/API 이름을 배지로 나열(정직한 신뢰 신호)
- [x] 대시보드 사용량에 일별 검색 추이 막대 차트 추가 (`shared/components/usage-chart.js`, 순수 SVG, dataviz 스킬 절차 준수 — 단일 시리즈라 accent 한 색, 범례 없음, 마크당 호버 툴팁, 4px 라운드 캡, 2px 갭). `shared/auth.js`의 사용량 카운터를 월합계 하나에서 **일자별 기록**으로 바꿔서 차트가 실제 검색 이력을 그림(가짜 데이터 아님)
- [x] 대시보드 사이드바에 알림 벨 — 플랜 업그레이드/리포트 예약 저장 시 실제로 알림이 쌓임, 안 읽음 표시, 모두 읽음 처리
- [x] `changelog.html`, `status.html` 신설 — 커맨드 팔레트/랜딩 푸터에서 연결. status 페이지는 실제 모니터링 연동이 아님을 페이지 안에 명시(정직성 유지)

---

## 진행 방식

- 스프린트 단위로 하나씩 요청하면 됨 (예: "스프린트 1 시작해줘")
- 각 스프린트 끝나면 이 파일 체크박스 갱신
- 스코프가 애매한 항목(Sprint 3의 실제 이메일 발송 등)은 시작 전에 다시 확인하고 진행
