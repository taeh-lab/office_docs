// shared/config.js
// ─────────────────────────────────────────────────────────────
// 클라이언트에서 쓰는 설정값. GOOGLE_CLIENT_ID는 비밀값이 아니라
// (브라우저에 그대로 노출되는 값) 여기 직접 넣는다 — Vercel 환경변수가
// 아님에 주의. Groq/Stripe 키처럼 진짜 비밀인 값은 절대 여기 넣지 말 것.
// 발급 방법은 SETUP-TODO.md 참고.
// ─────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '800757732783-spmtgjkn5n4nfi56oq8qlqm3bfdtcrmj.apps.googleusercontent.com';

// 구글 드라이브 연결(Picker)용 API 키. Client ID와 마찬가지로 브라우저에 노출되는 공개값이라
// 여기 직접 넣어도 되지만, 반드시 Google Cloud에서 "Picker API 사용 설정 + 키 제한(HTTP 리퍼러)"을
// 걸어 둘 것. 안 넣으면(YOUR_ 로 시작) 드라이브 버튼이 '설정 필요'로 비활성 — 앱은 그대로 동작.
// 발급/설정 방법은 SETUP-TODO.md의 "5. 구글 드라이브 연결" 참고.
const GOOGLE_API_KEY = 'AIzaSyCO0G-InXdGlpB6fjjD9nc5XXadurQBLo4';

// ── 크레딧(토큰) 모델 · 용량 비례 ──────────────────────────────
// 기능 잠금 없음: 모든 기능 전 플랜 공통. 차이는 "월 크레딧" 양뿐.
// 업로드는 무료·무제한. 문서를 "처음 처리할 때"(첫 검색/정리/리포트) 용량만큼 딱 한 번 차감하고,
// 그 뒤로 같은 문서를 몇 번을 재검색·재정리해도 추가 차감 없음.
// 넉넉하게 잡음(브라우저 안에서 돌고, AI는 무료 등급이라 많이 받을 이유가 없음).
// 로그인 안 된 단독 실행(getUser()=null)에서는 차감 없이 그대로 동작(데모 편의).
const CREDIT_MODEL = {
  bytesPerCredit:   250 * 1024, // 250KB당 1 크레딧 (용량 비례)
  ocrPageSurcharge: 3,          // OCR(스캔 이미지→글자)한 페이지당 가산 — 실제 연산이 무거움
};

// 요금제 4단계 — 크레딧 번들. key는 서버(api/create-checkout-session.js)의 화이트리스트,
// dashboard.html의 플랜 배지, pricing.html의 카드가 전부 이 값을 그대로 씀.
// credits = 매달 지급되는 크레딧(null이면 무제한). 기능 차등이 아니라 크레딧 양으로만 구분.
// priceLabel은 pricing.html 카드의 표시용 문자열 — '{금액} / 월' 형식.
// 통화는 ₩(원)으로 통일(제품이 한국어). 표시값일 뿐이라 Stripe 실제 청구액과는 무관하며,
// 실제 결제 금액은 각 Price ID에 설정된 값을 따른다(테스트 모드면 청구 안 됨).
const PLANS = {
  free:   { label:'Free',   priceLabel:'₩0 / 월',       rank:0, credits:100 },
  basic:  { label:'Basic',  priceLabel:'₩9,900 / 월',   rank:1, credits:2000 },
  middle: { label:'Middle', priceLabel:'₩19,900 / 월',  rank:2, credits:6000 },
  high:   { label:'High',   priceLabel:'₩39,900 / 월',  rank:3, credits:20000 },
};
