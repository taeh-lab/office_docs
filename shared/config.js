// shared/config.js
// ─────────────────────────────────────────────────────────────
// 클라이언트에서 쓰는 설정값. GOOGLE_CLIENT_ID는 비밀값이 아니라
// (브라우저에 그대로 노출되는 값) 여기 직접 넣는다 — Vercel 환경변수가
// 아님에 주의. Groq/Stripe 키처럼 진짜 비밀인 값은 절대 여기 넣지 말 것.
// 발급 방법은 SETUP-TODO.md 참고.
// ─────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '800757732783-spmtgjkn5n4nfi56oq8qlqm3bfdtcrmj.apps.googleusercontent.com';

// 구글 드라이브 연결(Picker)용 API 키.
// ★ 공개 리포에 커밋하지 않는다 — client-side 키라 브라우저엔 어차피 노출되지만, GitHub 공개
//    리포에 남기면 시크릿 스캐너(GitGuardian/Google)가 계속 flag한다. 그래서:
//    · 배포: Vercel 환경변수 GOOGLE_API_KEY → /api/public-config 가 런타임에 전달(아래 부트스트랩)
//    · 로컬 개발: window.__GOOGLE_API_KEY = '...' 로 넣거나 gitignore된 로컬 스크립트 사용
// 값이 비면 드라이브 버튼은 '설정 필요'로 비활성 — 업로드·검색·OCR·정리는 그대로 동작.
var GOOGLE_API_KEY = (typeof window !== 'undefined' && window.__GOOGLE_API_KEY) || '';

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

// 요금제 4단계 — 크레딧 번들. ★이 표가 금액의 단일 진실이다.
//
// ★ 금액이 사는 곳은 3자다. 갈라지면 tools/check-credit.mjs가 exit 1 한다(amount-drift):
//     priceLabel  '₩9,900 / 월'  ← pricing.html:133이 읽는 값 = 사용자가 보는 숫자
//     amount      9900           ← 필드. (현재 이걸 읽는 코드는 0곳이지만 대조의 다리다)
//     PLAN_AMOUNTS in api/toss-billing-success.js:13  ← 실제 청구액
//   서버는 shared/를 import 못 한다(shared엔 export 0, api/는 ESM, package.json에 type 없음)
//   → 코드를 공유하는 대신 기계로 대조한다. 값이 아니라 "불일치"를 금지한다.
//   여기 금액을 고치면 서버 PLAN_AMOUNTS도 같이 고쳐야 하고, 안 고치면 커밋 전에 검사가 잡는다.
//
// credits = 매달 지급되는 크레딧. 기능 차등이 아니라 크레딧 양으로만 구분.
//   ⚠️ 지금 구현(shared/credit-rules.js)은 이걸 "이번 달 상한"으로 쓴다. 의도(지급)와 구현(상한)이
//      다르다 — 장부 모델 전환 설계는 CREDIT-MODEL.md. 이번 스프린트 범위 밖.
// 통화는 ₩(원)으로 통일(제품이 한국어).
// (구 주석은 "표시값일 뿐이라 Stripe 실제 청구액과 무관, Price ID가 진실"이라 했다.
//  Stripe 시절엔 맞았지만 32dc9f9에서 토스로 전환하며 금액이 서버 코드로 들어왔다 → 거짓이 됐다.)
const PLANS = {
  free:   { label:'Free',   priceLabel:'₩0 / 월',       rank:0, credits:100,   amount:0 },
  basic:  { label:'Basic',  priceLabel:'₩9,900 / 월',   rank:1, credits:2000,  amount:9900 },
  middle: { label:'Middle', priceLabel:'₩19,900 / 월',  rank:2, credits:6000,  amount:19900 },
  high:   { label:'High',   priceLabel:'₩39,900 / 월',  rank:3, credits:20000, amount:39900 },
};

// 토스페이먼츠 클라이언트 키(공개값·test_ck_.../live_ck_...). GOOGLE_API_KEY처럼 리포에 커밋 안 하고
// /api/public-config에서 런타임 로드. 비면 결제는 데모 업그레이드로 폴백.
var TOSS_CLIENT_KEY = (typeof window !== 'undefined' && window.__TOSS_CLIENT_KEY) || '';

// 배포 환경에선 리포에 없는 GOOGLE_API_KEY를 서버(/api/public-config)에서 받아 채운다.
// 로컬 오버라이드(window.__GOOGLE_API_KEY)가 있으면 스킵. 로드되면 dwf-config-ready 이벤트를 쏴서
// 드라이브 버튼 상태를 갱신하게 한다.
(function(){
  if (typeof window === 'undefined') return;
  if (GOOGLE_API_KEY && TOSS_CLIENT_KEY) return;
  try {
    fetch('/api/public-config')
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if (!d) return;
        if (d.googleApiKey && !GOOGLE_API_KEY) GOOGLE_API_KEY = d.googleApiKey;
        if (d.tossClientKey && !TOSS_CLIENT_KEY) TOSS_CLIENT_KEY = d.tossClientKey;
        document.dispatchEvent(new Event('dwf-config-ready'));
      })
      .catch(function(){});
  } catch(e){}
})();
