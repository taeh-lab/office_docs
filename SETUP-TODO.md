# 배포 전 준비물 체크리스트

내가 코드는 다 만들어 놨는데, 아래 4개는 각자 계정으로 발급받아야 하는 값이라 대신 못 만들어줘.
하나씩 받아서 표시된 자리에 넣으면 실제로 동작해. 안 넣어도 앱은 안 죽고(폴백/데모 처리) 돌아가니 급할 거 없음.

## 1. Groq API 키 (AI 유사어 제안용) — 기존에 안내했던 것

- [ ] [console.groq.com](https://console.groq.com) 가입 (카드 불필요, 무료)
- [ ] API 키 발급
- [ ] Vercel 프로젝트 → Settings → Environment Variables 에 추가
  - `GROQ_API_KEY` = 발급받은 키
  - `GROQ_MODEL` = (선택) 기본값 `llama-3.3-70b-versatile`

> 안 넣으면: AI 동의어 대신 내장 사전으로 조용히 대체됨. 앱은 정상 동작.

## 2. Google 로그인 (Client ID)

- [ ] [console.cloud.google.com](https://console.cloud.google.com) 에서 프로젝트 생성
- [ ] "API 및 서비스 → OAuth 동의 화면" 설정 (External, 앱 이름/이메일만 넣으면 됨 — 심사 필요 없음, 테스트 상태로 충분)
- [ ] "사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID" → 애플리케이션 유형 **웹 애플리케이션**
- [ ] **승인된 자바스크립트 원본**에 추가:
  - `http://localhost:3000` (로컬 테스트용, 포트는 실제 쓰는 포트로)
  - 실제 배포 도메인 (예: `https://your-app.vercel.app`)
- [ ] 발급된 **클라이언트 ID**(`....apps.googleusercontent.com` 형태)를 복사
- [ ] [shared/config.js](shared/config.js) 열어서 `GOOGLE_CLIENT_ID` 값 교체

> 안 넣으면: "Google로 계속하기" 버튼이 자리는 있지만 클릭 시 오류 안내만 뜸. 이메일 로그인은 그대로 동작.
> 참고: Client ID는 비밀값이 아니라 브라우저에 그대로 노출되는 값이라 코드에 직접 넣어도 괜찮음. Client Secret은 여기서 안 씀(백엔드 검증 없는 데모 로그인이라).

## 3. Stripe 테스트 모드 키 (결제 페이지) — Basic/Middle/High 3개

- [ ] [dashboard.stripe.com/register](https://dashboard.stripe.com/register) 가입 (실사업자 정보 없어도 테스트 모드는 바로 사용 가능)
- [ ] 대시보드 왼쪽 아래 **테스트 모드**가 켜져 있는지 확인 (진짜 결제 안 되게)
- [ ] "개발자 → API 키"에서 **비밀 키(Secret key)** 복사 (`sk_test_...`로 시작)
- [ ] 상품 3개(`basic`/`middle`/`high`) 각각 상세 페이지 → **"가격 정보(Pricing)"** 섹션에서 **Price ID**(`price_...`로 시작) 복사
  - ⚠️ 상품 목록에 보이는 `prod_...` ID는 **다른 값**임 — Checkout에는 못 씀. 반드시 상품 상세 페이지 안의 "가격" 항목 옆 `price_...`를 복사해야 함
- [ ] Vercel 환경변수(또는 로컬 `.env`)에 추가
  - `STRIPE_SECRET_KEY` = `sk_test_...`
  - `STRIPE_PRICE_BASIC` = `price_...`
  - `STRIPE_PRICE_MIDDLE` = `price_...`
  - `STRIPE_PRICE_HIGH` = `price_...`

> 안 넣으면: 요금제 페이지에서 아무 플랜이나 눌러도 실제 결제창 대신 로컬에서 바로 해당 플랜으로 처리하는 데모 업그레이드로 대체됨. 앱은 안 죽음. (플랜별로 개별 설정 가능 — 예를 들어 `STRIPE_PRICE_BASIC`만 넣으면 Basic만 실제 결제창으로 연결되고 나머지는 데모 처리됨)
> 테스트 모드라 실제로 결제창까지 가더라도 카드 청구는 절대 안 됨 — 테스트 카드 번호(`4242 4242 4242 4242`, 아무 미래 날짜/CVC)로 결제 흐름 전체를 눈으로 확인할 수 있음.

## 4. (선택) Vercel 배포

- [ ] 이 폴더를 GitHub 저장소로 push
- [ ] [vercel.com](https://vercel.com) 에서 Import
- [ ] 위 환경변수들을 프로젝트 Settings에 등록 후 재배포

## 5. 구글 드라이브 연결 (문서 직접 불러오기)

> 문서 검색 도구의 "구글 드라이브에서 가져오기" + "최근 바뀐 문서 자동 수집"을 살리는 설정. **2번(구글 로그인)과 같은 구글 클라우드 프로젝트**를 그대로 쓰면 된다.
> 스코프는 `drive.readonly`(드라이브 읽기) — **자동 수집(최근 바뀐 문서 목록 훑기)에는 드라이브를 읽을 권한이 필요**하기 때문(고른 파일만 보는 `drive.file`로는 목록 조회가 안 됨). 대신 내려받은 **문서 본문은 브라우저 안에서만** 처리되고 서버로 나가지 않는다.

- [ ] [console.cloud.google.com](https://console.cloud.google.com) → 2번에서 만든 **같은 프로젝트** 선택
- [ ] "API 및 서비스 → 라이브러리"에서 **Google Picker API** 와 **Google Drive API** 둘 다 "사용 설정"
- [ ] "API 및 서비스 → OAuth 동의 화면 → 데이터 액세스(범위)"에서 범위 추가:
  - `.../auth/drive.readonly` (드라이브 읽기 — 자동 수집에 필요. 구글이 "민감한 범위"로 표시하지만, **테스트 상태 + 본인이 테스트 사용자**면 심사 없이 바로 됨)
  - 동의 화면이 "테스트" 상태면 "테스트 사용자"에 **본인 구글 계정**을 추가해야 팝업이 뜬다
  - ⚠️ 스코프를 바꾸면 **다음 접속 때 동의를 한 번 더** 받는다(기존 허용은 좁은 범위였으므로). "안전하지 않은 페이지" 경고가 떠도 본인 테스트 앱이라 정상 — 고급→계속 진행
- [ ] "사용자 인증 정보 → 사용자 인증 정보 만들기 → **API 키**" 생성
  - 생성 후 **키 제한** 권장: 애플리케이션 제한 = "HTTP 리퍼러", 웹사이트에 `http://localhost:3000/*` 와 실제 배포 도메인 추가 / API 제한 = "Google Picker API"
- [ ] 2번에서 만든 **OAuth 클라이언트 ID**의 "승인된 자바스크립트 원본"에 `http://localhost:3000` 와 배포 도메인이 들어가 있는지 확인(로그인과 공유)
- [ ] 발급된 **API 키**를 [shared/config.js](shared/config.js) 의 `GOOGLE_API_KEY` 값에 넣기 (Client ID처럼 브라우저에 노출되는 공개값 — 대신 위의 키 제한을 꼭 걸 것)

> 안 넣으면: "구글 드라이브에서 가져오기" 버튼이 "설정 필요"로 비활성만 됨. 내 컴퓨터에서 파일 올리기·검색·OCR·엑셀은 전부 그대로 동작.
> 불러온 문서도 서버로 안 나감 — 브라우저가 드라이브에서 직접 받아 브라우저 안에서만 처리한다. (Google 문서→PDF, Google 시트→xlsx로 자동 변환해서 가져옴)

---

체크리스트 위에서부터 순서대로 안 해도 됨 — 각 항목은 서로 독립적이고, 안 넣은 항목은 전부 자동으로 데모/폴백 동작으로 대체되도록 만들어 놨음.
