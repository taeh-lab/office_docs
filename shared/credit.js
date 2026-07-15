// shared/credit.js
// ─────────────────────────────────────────────────────────────
// 크레딧 코어 — 재화 그 자체. 키(문자열)와 숫자만 안다.
//
// ★ 이 파일은 계정도, 요금제도, 금액도, 상한도 모른다.
//   "누가" 쓰는지, "얼마나 줄지", "언제 막을지"는 전부 shared/credit-rules.js의 몫이다.
//   게임의 골드가 플레이어의 직업을 모르는 것과 같다 — 골드는 그냥 숫자다.
//   이 경계는 tools/check-credit.mjs가 기계로 강제한다(금지어가 등장하면 exit 1).
//
// ★ 판정하지 않는다. creditSpend는 잔액이 부족해도 그냥 기록한다.
//   "부족" 개념 자체가 여기 없다 — 그건 규칙이 아는 것이다.
//
// ★ 이 파일은 config.js·auth.js 없이 혼자 돈다. 그게 "아무것도 모른다"의 증거다.
//   콘솔에서 creditUsed('아무키나') → 0 이 나오면 증명 끝.
//
// 저장 키는 기존 것을 글자 그대로 재사용한다(구 auth.js:81) → 마이그레이션 0줄, 기존 이력 무손상.
// ─────────────────────────────────────────────────────────────

const CREDIT_SPEND_NS = 'dwf_usage_days_';     // 구 auth.js와 동일. 절대 바꾸지 말 것(이력 유실)
const CREDIT_GRANT_NS = 'dwf_credit_grants_';  // 신규. 없으면 0으로 읽힌다 → 기존 사용자 무영향

// 'YYYY-MM-DD' (구 auth.js:86 dateKey 이동)
function creditDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 일자별 사용 기록 { '2026-07-15': 12, ... }
function creditSpendMap(key) {
  try { return JSON.parse(localStorage.getItem(CREDIT_SPEND_NS + key)) || {}; }
  catch { return {}; }
}

// 이번 달 사용 합계 (구 auth.js:89 getUsage와 동일 계산)
function creditUsed(key) {
  const ym = creditDateKey(new Date()).slice(0, 7);
  const map = creditSpendMap(key);
  return Object.entries(map).reduce((sum, [day, n]) => (day.startsWith(ym) ? sum + n : sum), 0);
}

// n만큼 기록하고 이번 달 합계 반환 (구 auth.js:114와 동일).
// 판정하지 않는다 — 부족해도 기록한다. 막는 건 규칙의 일이다.
function creditSpend(key, n) {
  const map = creditSpendMap(key);
  const today = creditDateKey(new Date());
  map[today] = (map[today] || 0) + n;
  localStorage.setItem(CREDIT_SPEND_NS + key, JSON.stringify(map));
  return creditUsed(key);
}

// 이번 달 1일~오늘 일별 사용량 (구 auth.js:124). usage-chart.js가 그대로 먹는 형식.
function creditHistory(key) {
  const map = creditSpendMap(key);
  const now = new Date();
  const out = [];
  for (let d = 1; d <= now.getDate(); d++) {
    const k = creditDateKey(new Date(now.getFullYear(), now.getMonth(), d));
    out.push({ day: d, count: map[k] || 0 });
  }
  return out;
}

// ── 지급 원장 ── 씨앗. 지금은 핸들과 이벤트 지급만 쓴다.
// 미래 모델(CREDIT-MODEL.md)의 착지점: 잔액 = 지급 총합 − 사용 총합.
function creditGrantLog(key) {
  try { return JSON.parse(localStorage.getItem(CREDIT_GRANT_NS + key)) || []; }
  catch { return []; }
}

// n만큼 지급 원장에 더하고 총합 반환. tag는 감사용 라벨(자유 문자열).
// ★ 상한을 여기서 자르지 않는다 — 자르는 순간 코어가 요금제를 알게 된다.
//   이미 잘린 숫자만 받는다. (CREDIT-MODEL.md 참조)
function creditGrant(key, n, tag) {
  const log = creditGrantLog(key);
  log.push({ at: creditDateKey(new Date()), n, tag: tag || '' });
  localStorage.setItem(CREDIT_GRANT_NS + key, JSON.stringify(log));
  return creditGranted(key);
}

// 지급 총합. 원장이 없으면 0 (= 기존 사용자 기본값)
function creditGranted(key) {
  return creditGrantLog(key).reduce((s, e) => s + (e.n || 0), 0);
}

// 핸들·테스트 전용. 이 키의 사용/지급 기록을 지운다.
function creditReset(key) {
  localStorage.removeItem(CREDIT_SPEND_NS + key);
  localStorage.removeItem(CREDIT_GRANT_NS + key);
}
