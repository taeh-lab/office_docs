// shared/credit-rules.js
// ─────────────────────────────────────────────────────────────
// 크레딧 규칙 — 계정·요금제·원가를 아는 유일한 층.
//
// 경계: shared/credit.js(코어)는 키와 숫자만 안다. 여기만 getUser()·PLANS·CREDIT_MODEL을 안다.
//   골드는 플레이어의 직업을 모르고, 직업표가 골드를 얼마 줄지 정한다.
//   tools/check-credit.mjs가 이 경계를 기계로 강제한다.
//
// 의존(로드 순서): config.js(PLANS·CREDIT_MODEL) → auth.js(getUser) → credit.js → 이 파일.
//   check-credit.mjs의 load-order 검사가 강제한다.
//
// ★ fail-open이 여기서 소멸한다. 구 auth.js:97은 `typeof PLANS === 'undefined' → return null`
//   (= 무제한)이었다. auth.js가 PLANS 없는 페이지 3곳에도 실려서 가드가 필요했고, 그 가드 값이
//   하필 "무제한"이라 설정 누락이 조용한 과금 해제였다. 이 파일은 tool.html에만 실리고
//   거기엔 PLANS가 항상 있다 → 가드가 필요 없다 → fail-open이 삭제가 아니라 소멸한다.
//   그래도 순서가 깨질 경우를 대비해 아래 planGrant는 0(fail-closed) + console.error로 간다.
// ─────────────────────────────────────────────────────────────

// ── 키 ── 코어에 넘길 문자열. 로그인이면 이메일, 아니면 기기 단위 익명 id.
function creditKey() {
  const u = (typeof getUser === 'function') ? getUser() : null;
  if (u && u.email) return u.email;
  let id = null;
  try { id = localStorage.getItem('dwf_guest_id'); } catch (e) {}
  if (!id) {
    id = 'guest_' + ((typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    try { localStorage.setItem('dwf_guest_id', id); } catch (e) {}
  }
  return id;
}

// ── 요금제 → 숫자 ── 구 planCredits. ★null을 반환하지 않는다.
function planGrant(plan) {
  if (typeof PLANS === 'undefined') {
    // 로드 순서가 깨진 경우. throw하지 않는 이유: CLAUDE.md D1 "독립적으로 끝나도 앱이 안 죽게".
    // 0을 주면 아무것도 못 쓴다(fail-closed) + console.error로 시끄럽다 = 감지된다.
    // 구현체가 null(무제한)이던 게 오늘까지 감지 불가였던 이유는 null이 정상 반환값과 구분이 안 돼서다.
    console.error('[credit] config.js(PLANS) 미로드 — 크레딧 규칙 사용 불가. 스크립트 로드 순서를 확인하라.');
    return 0;
  }
  const p = PLANS[plan] || PLANS.free;
  return (p && typeof p.credits === 'number') ? p.credits : 0;
}

// 이번 달 쓸 수 있는 총량 = 요금제 지급량 + 별도 지급(이벤트 등).
// 비로그인은 오늘 동작 그대로 무제한(config.js:23 "단독 실행은 차감 없이 그대로 동작(데모 편의)").
// 미래에 "비로그인 첫 접속 100"으로 바꿀 땐 이 한 줄만 고치면 된다(CREDIT-MODEL.md).
function creditAllowance() {
  const u = (typeof getUser === 'function') ? getUser() : null;
  if (!u) return Infinity;
  return planGrant(u.plan) + creditGranted(creditKey());
}

// 지금 남은 크레딧
function creditBalanceNow() {
  const allow = creditAllowance();
  if (allow === Infinity) return Infinity;
  return Math.max(0, allow - creditUsed(creditKey()));
}

// ── 원가 ── CREDIT_MODEL을 아는 유일한 곳 (구 tool.html:1552-1554)
function creditCostForDocs(bytes, ocrPages) {
  const per = (typeof CREDIT_MODEL !== 'undefined') ? CREDIT_MODEL.bytesPerCredit : 256000;
  const rate = (typeof CREDIT_MODEL !== 'undefined') ? CREDIT_MODEL.ocrPageSurcharge : 3;
  return Math.max(1, Math.ceil((bytes || 0) / per) + (ocrPages || 0) * rate);
}

// ── 과금 ──
function creditCanCharge(n) {
  const allow = creditAllowance();
  if (allow === Infinity) return true;
  return creditUsed(creditKey()) + n <= allow;
}
function creditCharge(n) {
  if (!creditCanCharge(n)) return false;
  creditSpend(creditKey(), n);
  return true;
}

// ── 지급 규칙 ── 이번 스프린트에 사는 건 grantEvent 하나뿐.
// 나머지는 CREDIT-MODEL.md의 설계이고 구현하지 않는다(범위 밖 — 계획 리스크 7번).
//   grantFirstVisit()     비로그인 첫 접속 1회 +100
//   grantMonthly()        로그인 매달 +100. ★무료 잔액 500 상한은 "여기서" 자른다.
//                         creditGrant() 안에 넣으면 코어가 요금제를 알게 된다 → 금지.
//   grantOnPurchase(plan) 결제 시 +PLANS[plan].credits. 상한 없음.
function grantEvent(n, tag) {
  return creditGrant(creditKey(), n, tag || 'event');
}

// ─────────────────────────────────────────────────────────────
// 하위호환 shim — 구 auth.js의 이름을 그대로 유지한다.
// tool.html의 호출부 9곳(1514·1515·1521·1533·1534·1859·1860·1873·1899)이 이걸 부르므로
// 그 9곳을 0줄도 고치지 않는다. 전역 클래식 스크립트라 호출부는 함수가 어느 파일에 있는지 모른다
// — ES 모듈이 0개인 D1 제약이 여기선 무기다. (이름 이관은 별도 스프린트, 지금은 새 증거 0)
// ─────────────────────────────────────────────────────────────
function planCredits(plan) { return planGrant(plan); }
function getUsage(key) { return creditUsed(key); }
function creditBalance(key, plan) { return Math.max(0, planGrant(plan) - creditUsed(key)); }
function canSpend(key, plan, n) { return creditUsed(key) + n <= planGrant(plan); }
function spendCredits(key, n) { return creditSpend(key, n); }
function incUsage(key) { return creditSpend(key, 1); }
function getUsageHistory(key) { return creditHistory(key); }

// ─────────────────────────────────────────────────────────────
// 핸들 — 콘솔에서 숫자로 실측한다. 게임 로직 무영향(읽기용 + 명시적 테스트용).
// 코어와 규칙을 분리 노출해서 경계가 콘솔에서 눈에 보이게 한다.
// ─────────────────────────────────────────────────────────────
window.__credit = {
  // 코어: 키와 숫자만. 계정 없이 도는지 여기서 증명한다.
  core: {
    used: creditUsed, spend: creditSpend, grant: creditGrant,
    granted: creditGranted, history: creditHistory, reset: creditReset,
  },
  // 규칙: 계정·요금제를 아는 쪽
  key: () => creditKey(),
  who: () => { const u = (typeof getUser === 'function') && getUser(); return u ? { email: u.email, plan: u.plan } : 'guest'; },
  allowance: () => creditAllowance(),
  used: () => creditUsed(creditKey()),
  balance: () => creditBalanceNow(),
  cost: (bytes, ocr = 0) => creditCostForDocs(bytes, ocr),
  charge: (n) => creditCharge(n),
  grant: (n, tag = 'handle') => grantEvent(n, tag),
  history: () => creditHistory(creditKey()),
  reset: () => creditReset(creditKey()),
  // 경계 자체를 실측한다
  knows: () => ({
    coreKnowsPlan: /PLANS/.test(creditUsed.toString()),
    rulesKnowsPlan: typeof planGrant === 'function',
  }),
};
