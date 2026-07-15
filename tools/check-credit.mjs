// tools/check-credit.mjs
// ─────────────────────────────────────────────────────────────
// 크레딧 경계 기계 검사 — 바닐라 Node · 의존성 0 · 위반 시 exit 1.
// 실행: node tools/check-credit.mjs   (빌드 아님. 매 태스크·커밋 전)
//
// ★ 왜 grep인가 (VoxelCraft check-layers.mjs를 안 옮긴 이유):
//   그 스크립트는 import 사다리를 본다. 이 코드베이스엔 import가 0개(D1 무빌드)라
//   그대로 옮기면 "항상 PASS하는 빈 검사"가 된다. 게다가 원본조차 core→data를 못 막았다
//   (data가 tier 0이라 하향 통과) — 구조를 검사한다고 믿었는데 정작 그 규칙을 못 잡았다.
//   여기선 구조가 아니라 "크레딧이 무슨 글자를 아는가"를 직접 본다. 잡는 게 명시적이라
//   못 잡는 걸 속이지 않는다.
//
// 검사하는 것: 파일에 어떤 글자가 있는가 (정적).
// 검사하지 않는 것: 런타임 동작 · 서버 권위 · 문자열 조립 우회(window['PLA'+'NS']).
//   그건 회귀표와 window.__credit 핸들의 몫이다.
// ─────────────────────────────────────────────────────────────
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return null; } };
const fails = [];
const fail = (code, msg) => fails.push(`FAIL ${code}: ${msg}`);
const lineOf = (src, needle) => src.slice(0, src.indexOf(needle)).split('\n').length;
// 주석은 코드가 아니다 — 주석에서 PLANS를 언급하는 건 위반이 아님(설명은 오히려 권장)
const codeOnly = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

// ── 1) core-purity ── 이 스펙의 심장. 코어는 계정·플랜·금액·무제한을 몰라야 한다.
const CORE_FORBIDDEN = ['PLANS', 'CREDIT_MODEL', 'getUser', 'user.', 'email', 'plan', 'Infinity', 'FREE_BALANCE_CAP', 'dwf_user'];
const core = read('shared/credit.js');
if (!core) {
  fail('core-purity', 'shared/credit.js 없음 — 크레딧 코어가 아직 분리되지 않았다');
} else {
  const c = codeOnly(core);
  for (const w of CORE_FORBIDDEN) {
    if (c.includes(w)) fail('core-purity', `shared/credit.js:${lineOf(core, w)} 금지어 '${w}' — 코어가 계정/플랜을 알면 안 된다`);
  }
}

// ── 2) auth-clean ── 크레딧이 인증을 떠났는가
const AUTH_FORBIDDEN = ['PLANS', 'planCredits', 'canSpend', 'spendCredits', 'creditBalance', 'usageMap', 'getUsage'];
const auth = read('shared/auth.js');
if (!auth) {
  fail('auth-clean', 'shared/auth.js 없음');
} else {
  const a = codeOnly(auth);
  const hit = AUTH_FORBIDDEN.filter((w) => a.includes(w));
  if (hit.length) fail('auth-clean', `shared/auth.js — 크레딧 잔류: ${hit.join(', ')} (인증 파일이 크레딧을 들고 있다)`);
}

// ── 3) no-fail-open ── 설정 누락이 '무제한'으로 새면 안 된다 (구 auth.js:97)
for (const f of readdirSync(join(ROOT, 'shared')).filter((f) => f.endsWith('.js'))) {
  const s = codeOnly(read(`shared/${f}`) || '');
  if (/typeof\s+PLANS\s*===?\s*['"]undefined['"]\s*\)\s*return\s+null/.test(s)) {
    fail('no-fail-open', `shared/${f} — 'typeof PLANS undefined → return null'(=무제한). 설정 누락이 과금을 조용히 푼다`);
  }
}

// ── 4) load-order ── credit-rules.js를 싣는 HTML은 config/auth/credit을 먼저 실어야 한다
for (const f of readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const h = read(f) || '';
  const at = (n) => h.indexOf(`shared/${n}`);
  if (at('credit-rules.js') < 0) continue;
  for (const dep of ['config.js', 'auth.js', 'credit.js']) {
    if (at(dep) < 0 || at(dep) > at('credit-rules.js')) {
      fail('load-order', `${f} — credit-rules.js보다 ${dep}가 먼저 로드돼야 한다 (없거나 순서 역전)`);
    }
  }
}

// ── 5) amount-drift ── 3자 대조: priceLabel(표시) ↔ amount ↔ PLAN_AMOUNTS(청구)
//   ★ amount만 대조하면 안 된다 — pricing.html:133이 읽는 건 priceLabel이고,
//     .amount를 읽는 코드는 0곳이다(죽은 필드). 사용자가 보는 숫자를 검사해야 한다.
//   서버는 shared/를 import 못 한다(shared엔 export 0, api/는 ESM) → 공유 대신 대조한다.
const cfg = read('shared/config.js') || '';
const srv = read('api/toss-billing-success.js') || '';
const parseWon = (s) => { const m = String(s).replace(/[,\s]/g, '').match(/₩(\d+)/); return m ? +m[1] : null; };

const truth = {};   // key → { label:number|null, amount:number|null }
for (const m of cfg.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
  const [, key, body] = m;
  const pl = body.match(/priceLabel:\s*'([^']*)'/);
  const am = body.match(/amount:\s*(\d+)/);
  if (!pl && !am) continue;
  truth[key] = { label: pl ? parseWon(pl[1]) : null, amount: am ? +am[1] : null };
}
if (!Object.keys(truth).length) fail('amount-drift', 'shared/config.js — PLANS를 못 찾음 (포맷이 바뀌었나?)');

const copy = {};    // key → number (서버 청구액)
const block = srv.match(/PLAN_AMOUNTS\s*=\s*\{([^}]*)\}/);
if (!block) {
  fail('amount-drift', 'api/toss-billing-success.js — PLAN_AMOUNTS를 못 찾음 (이름이 바뀌었나?)');
} else {
  for (const m of block[1].matchAll(/(\w+):\s*(\d+)/g)) copy[m[1]] = +m[2];
}

for (const [k, t] of Object.entries(truth)) {
  // 표시(priceLabel) ↔ 필드(amount)
  if (t.label !== null && t.amount !== null && t.label !== t.amount) {
    fail('amount-drift', `${k} — priceLabel(₩${t.label}, 사용자가 보는 값) ≠ amount(${t.amount})`);
  }
  // 표시 ↔ 청구(서버). 유료 플랜만.
  if (t.amount !== null && t.amount > 0) {
    if (!(k in copy)) fail('amount-drift', `${k} — 유료 플랜인데 서버 PLAN_AMOUNTS에 없다 (결제 badplan)`);
    else if (copy[k] !== t.amount) fail('amount-drift', `${k} — config.js=${t.amount} vs toss-billing-success.js=${copy[k]} (보이는 값과 청구액이 갈렸다)`);
  }
}

// ── 6) plan-keys ── 유료 플랜 키 집합 일치
const paid = Object.keys(truth).filter((k) => truth[k].amount > 0).sort().join(',');
const srvKeys = Object.keys(copy).sort().join(',');
if (paid && srvKeys && paid !== srvKeys) {
  fail('plan-keys', `유료 플랜 키 불일치 — config.js=[${paid}] vs 서버=[${srvKeys}]`);
}

// ── 결과 ──
if (fails.length) {
  console.error(fails.join('\n'));
  console.error(`\n${fails.length}건 위반 — 크레딧 경계가 깨졌다.`);
  process.exit(1);
}
console.log('OK — 크레딧 경계 6/6 통과 (core-purity · auth-clean · no-fail-open · load-order · amount-drift · plan-keys)');
