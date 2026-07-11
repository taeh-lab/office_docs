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

## 3. ~~Stripe 테스트 모드 키~~ → **8번 토스페이먼츠로 교체됨**

> ⚠️ 요금제 결제는 이제 **토스페이먼츠 정기결제(8번)**를 쓴다. 아래 Stripe 안내는 참고용으로 남겨두지만, `pricing.html`은 더 이상 Stripe를 호출하지 않는다. (한국 결제 + 정기구독 + 카드사 심사까지 가려면 토스가 맞음.) **8번을 진행하세요.**

<details><summary>(구) Stripe 안내 — 접어둠</summary>

### 3. Stripe 테스트 모드 키 (결제 페이지) — Basic/Middle/High 3개

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

</details>

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
- [ ] "사용자 인증 정보 → 사용자 인증 정보 만들기 → **API 키**" 생성 (또는 노출된 키는 **키 순환**으로 새 값 발급)
  - API 제한 = "Google Picker API" + "Google Drive API"
- [ ] 2번에서 만든 **OAuth 클라이언트 ID**의 "승인된 자바스크립트 원본"에 `http://localhost:3000` 와 배포 도메인이 들어가 있는지 확인(로그인과 공유)
- [ ] ⚠️ **API 키는 config.js에 커밋하지 않는다**(공개 리포 노출 방지). 대신:
  - **배포**: Vercel 환경변수에 `GOOGLE_API_KEY` = 발급/순환한 키 값 → `api/public-config.js`가 런타임에 프론트로 전달
  - **로컬 개발**: `shared/config.local.js`(gitignore됨) 파일을 만들어 `window.__GOOGLE_API_KEY = '키값';` 한 줄 넣고, 필요한 페이지에서 `<script src="shared/config.local.js"></script>`를 config.js보다 먼저 로드 (또는 브라우저 콘솔에서 임시 설정)
  - (client-side 키라 브라우저엔 어차피 노출되지만, "공개 GitHub 리포에 커밋된 시크릿"은 없앤다)

> 안 넣으면: "구글 드라이브에서 가져오기" 버튼이 "설정 필요"로 비활성만 됨. 내 컴퓨터에서 파일 올리기·검색·OCR·엑셀은 전부 그대로 동작.
> 불러온 문서도 서버로 안 나감 — 브라우저가 드라이브에서 직접 받아 브라우저 안에서만 처리한다. (Google 문서→PDF, Google 시트→xlsx로 자동 변환해서 가져옴)

## 6. 리포트 이메일 발송 (Resend) — B1

> 아침 리포트의 "이메일로 받기"를 살리는 설정. 서버리스 함수 `api/send-report.js`가 Resend로 엑셀을 첨부해 발송한다.

- [ ] [resend.com](https://resend.com) 가입 → **API 키** 발급 (`re_...`)
- [ ] Vercel 프로젝트 → Settings → Environment Variables 에 추가:
  - `RESEND_API_KEY` = `re_...`
  - `RESEND_FROM` = (선택) `DocFinder <no-reply@내도메인>` — 도메인을 Resend에서 검증한 경우. 안 넣으면 `onboarding@resend.dev`로 발송(이 경우 Resend 정책상 **가입한 본인 이메일로만** 감 — 테스트엔 충분)
- [ ] 환경변수 추가 후 **재배포**(Deployments → 최신 → Redeploy)해야 반영됨

> 안 넣으면: "이메일로 받기"가 "메일 발송 설정 필요" 안내만 뜸. 미리보기·엑셀 다운로드는 그대로 동작.
> ⚠️ 로컬(localhost)에선 서버리스 함수가 안 돌아서 메일 발송은 **배포 환경에서만** 확인 가능.

## 7. 자동 발송 준비 — 오프라인 드라이브 접근 + 스케줄 저장 (B2)

> "매일 자동으로 받기(베타)"를 살리는 설정. 서버가 나 없을 때도 드라이브를 읽으려면 **refresh token**이 필요하고, 스케줄과 함께 **Supabase**에 저장한다. (실제 무인 발송 스케줄러는 B3)

**7-1. Supabase 프로젝트 + 테이블**
- [ ] [supabase.com](https://supabase.com) → 새 프로젝트 생성
- [ ] SQL Editor에서 아래 실행 (스케줄·토큰 저장 테이블):
  ```sql
  create table if not exists automations (
    email        text primary key,
    refresh_token text,
    work_time    text,
    categories   text,
    report_email text,
    timezone     text default 'Asia/Seoul',
    last_run_date text,
    updated_at   timestamptz default now()
  );
  alter table automations enable row level security;  -- service_role 키(서버)만 접근, 클라이언트 차단
  ```
- [ ] Project Settings → API 에서 값 복사 → Vercel 환경변수:
  - `SUPABASE_URL` = `https://xxxx.supabase.co`
  - `SUPABASE_SERVICE_KEY` = **service_role** 키 (⚠️ 절대 비밀 — 서버 함수만 씀. anon 키 말고 service_role)

**7-2. Google OAuth (오프라인/코드 플로우)**
- [ ] Vercel 환경변수에 `GOOGLE_CLIENT_SECRET` = `GOCSPX-...` (2번에서 만든 OAuth 클라이언트의 시크릿. `.env` 주석에 있음)
- [ ] Google 콘솔 → 2번 OAuth 클라이언트 → **"승인된 리디렉션 URI"** 에 추가:
  - `https://office-docs.vercel.app/api/oauth-callback`
  - (자바스크립트 원본과 다른 항목임 — "리디렉션 URI"에 넣어야 함)
- [ ] 동의 화면 범위에 `.../auth/drive.readonly` 가 이미 있으면 됨(5번에서 추가). `openid`·`email`은 기본 포함.

**7-3. 재배포**
- [ ] 위 환경변수(SUPABASE_URL / SUPABASE_SERVICE_KEY / GOOGLE_CLIENT_SECRET) 추가 후 **Redeploy**

> 안 넣으면: "자동 발송 켜기"가 "서버 설정 전" 안내만 뜸. 미리보기·이메일로 받기는 그대로 동작.
> 검증: 켠 뒤 `https://office-docs.vercel.app/api/test-offline?email=<본인이메일>` 를 열면, 서버가 저장된 토큰으로 드라이브 최근 파일을 읽어 `offline_access: works` 를 돌려준다(= 무인 접근 가능 증명).
> ⚠️ 데모 한계: refresh token을 평문 저장한다 — 프로덕션이라면 암호화(KMS 등) 필요.

## 8. 토스페이먼츠 정기결제 (실제 결제 + 환불) — ★ 현재 결제 방식

> 요금제 구독을 **실제 토스 결제**로 처리한다. Free는 그대로 무료, 유료 플랜을 고르면 **카드 등록 → 빌링키 발급 → 첫 달 결제**가 일어나고, 매월 자동 청구된다(무인 매월 청구 = 크론은 후속 B3). 해지 시 **10일 이내 & 크레딧 500 미만 사용이면 전액 환불**(전자상거래법 제17조 + 우리 약관).
> **테스트 키만 있으면 사업자 계약 전에도 결제 흐름 전체가 동작**한다(실제 청구 없음). 진짜 청구는 9번(라이브 심사) 후.

**8-1. 토스 개발자센터 가입 + 테스트 키**
- [ ] [developers.tosspayments.com](https://developers.tosspayments.com) 가입 (사업자 계약 없이 테스트 키 바로 발급)
- [ ] "내 개발정보 / API 키"에서 **테스트** 키 2개 복사:
  - **클라이언트 키** `test_ck_...` (공개값 — 브라우저에서 씀)
  - **시크릿 키** `test_sk_...` (⚠️ 비밀 — 서버만)
- [ ] (선택) "상점 관리 → 결제 위젯/도메인"에 배포 도메인 등록 (테스트는 대체로 없어도 되지만, 막히면 여기 등록)

**8-2. Vercel 환경변수**
- [ ] `TOSS_CLIENT_KEY` = `test_ck_...` (→ `/api/public-config`가 런타임에 프론트로 전달. 리포에 커밋 안 함 — GOOGLE_API_KEY와 같은 방식)
- [ ] `TOSS_SECRET_KEY` = `test_sk_...` (서버 함수만 사용: 빌링키 발급·결제 승인·환불)

**8-3. Supabase 구독 테이블** (7번 Supabase 프로젝트 그대로 사용)
- [ ] SQL Editor에서 실행:
  ```sql
  create table if not exists subscriptions (
    email            text primary key,
    plan             text,
    billing_key      text,          -- 토스 빌링키(매월 청구·해지에 사용)
    customer_key     text,
    amount           int,
    status           text default 'active',   -- active | canceled
    last_payment_key text,          -- 최근 결제키(환불에 사용)
    last_paid_at     timestamptz,
    next_bill_date   date,
    created_at       timestamptz default now()
  );
  alter table subscriptions enable row level security;  -- 서버(service_role)만 접근
  ```
- [ ] (7번에서 이미 넣은 `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` 재사용 — 추가 등록 불필요)

**8-4. 재배포 후 확인**
- [ ] 환경변수 추가 후 **Redeploy**
- [ ] 요금제 페이지 → 유료 플랜 "시작하기" → 토스 카드 등록창 → **테스트 카드**로 등록
  - 토스 테스트 카드: 개발자센터 "테스트 카드" 안내 참고(아무 카드번호로 등록되는 테스트 모드). 실제 청구 없음.
- [ ] 등록 성공 → 대시보드로 돌아오며 플랜이 올라가면 성공
- [ ] 해지 테스트: 설정 → 구독 해지 → (10일 이내·크레딧 500 미만이면) "전액 환불 완료" 토스트

> 안 넣으면: 유료 플랜 클릭 시 실제 결제 대신 **데모 업그레이드**(로컬 반영)로 대체됨. 앱은 안 죽음.
> ⚠️ 로컬(localhost)에선 서버 함수가 안 돌아 **배포 환경에서만** 결제가 실제로 동작.
> ⚠️ 데모 한계: 사용자 "플랜"은 아직 브라우저(localStorage)에 저장된다. 결제·구독·빌링키·환불은 실제(토스+Supabase)지만, 플랜을 서버가 최종 확정(웹훅 검증)하는 건 후속 과제.

## 9. (라이브 전환) 카드사 심사 — 실제 청구 켜기

> 여기까지(8번)는 테스트라 카드에서 돈이 안 빠진다. **진짜 청구**하려면:

- [ ] 토스페이먼츠 **실 계약**(사업자등록증·정산계좌 제출) → **카드사 심사(~2주)**
- [ ] 심사 통과 후 **라이브 키**(`live_ck_...` / `live_sk_...`)로 `TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` 교체 → Redeploy
- [ ] ⚠️ **통신판매업 신고 확인 필수** — [정부24](https://www.gov.kr) "나의 신청내역" 또는 [공정위 통신판매사업자 조회](https://www.ftc.go.kr)에서 본인 사업자번호로 조회.
  - 안 돼 있으면: 정부24에서 **통신판매업 신고**(사업자등록 + 구매안전서비스이용확인증 필요). PG 실계약·전자상거래법상 필수.
  - 신고번호 나오면 → 법적 페이지(다음 단계 Phase 3)의 사업자정보에 기입.

## 10. 법적 페이지 — 사업자정보 채우기 (Phase 3, 라이브 전)

> 이용약관·개인정보처리방침·환불규정 페이지(`terms.html`/`privacy.html`/`refund.html`)는 만들어 뒀고, 푸터에 사업자정보가 표시된다. **사업자정보는 Vercel 환경변수로 관리**(개인정보를 공개 리포에 커밋하지 않기 위해) → `/api/public-config`가 런타임에 푸터로 전달.

- [ ] Vercel 환경변수에 **아래 이름 그대로** 추가(있는 것만 넣어도 됨, 나머지는 "[…준비중]"으로 표시):

  | 변수 이름 (정확히) | 값 |
  |---|---|
  | `BIZ_NO` | 사업자등록번호 (사업자등록증) |
  | `BIZ_ADDRESS` | 사업장 주소 |
  | `BIZ_EMAIL` | 고객문의 이메일 (스팸 대비 별도 주소 권장) |
  | `BIZ_MAIL_ORDER_NO` | 통신판매업 신고번호 (나중에 나오면 — 9번) |
  | `BIZ_COMPANY` | (선택) 상호 — 비우면 `citidel (시타델)` |
  | `BIZ_CEO` | (선택) 대표자 — 비우면 `윤태훈` |
  | `BIZ_PHONE` | (선택) 고객센터 전화 |

- [ ] 추가 후 **Redeploy** → 사이트 아무 페이지나 맨 아래 푸터에 값이 뜨는지 확인
- [ ] (선택) 실제 상업 운영이면 약관·방침을 사업 형태에 맞게 법률 검토 권장 — 지금은 우리 서비스 사실관계(크레딧 모델·브라우저 처리·10일/500 환불)에 맞춰 작성해둠

> 안 넣으면: 페이지는 정상 동작하고 해당 항목만 `[사업자등록번호 준비중]`처럼 표시됨. 라이브(실제 판매) 전엔 반드시 채울 것(전자상거래법 표시의무).
> 참고: 사업자정보는 어차피 법상 사이트에 **공개 표시가 의무**라 노출돼도 되는 값 — env에 두는 건 "공개 리포 커밋 방지"가 목적.

---

체크리스트 위에서부터 순서대로 안 해도 됨 — 각 항목은 서로 독립적이고, 안 넣은 항목은 전부 자동으로 데모/폴백 동작으로 대체되도록 만들어 놨음.
