// api/create-checkout-session.js
// ─────────────────────────────────────────────────────────────
// Stripe Checkout(테스트 모드) 세션 생성 — 결제 페이지로 넘어가기 전 단계.
//
// 하는 일:
//   1. 프론트에서 사용자 이메일 + 원하는 플랜(basic/middle/high)을 받는다
//   2. 플랜별 Price ID(STRIPE_PRICE_BASIC/MIDDLE/HIGH)로 Stripe REST API에
//      구독형 Checkout 세션을 만든다 (SDK 없이 fetch로 직접 호출 — synonyms.js와 같은 패턴)
//   3. 결제 페이지 URL을 돌려주면 프론트가 그리로 리다이렉트한다
//
// 핵심 설계:
//   - STRIPE_SECRET_KEY가 없거나 해당 플랜의 Price ID가 없으면 503으로 신호만 주고,
//     프론트가 로컬에서 바로 "데모 업그레이드" 처리하도록 폴백한다
//     (synonyms.js의 "AI 실패 시 내장 사전" 폴백과 같은 패턴)
//   - 이 프로젝트는 백엔드 DB/웹훅이 없는 포트폴리오 데모라, 결제 성공 여부를
//     서버에서 검증하지 않는다. 실제 서비스라면 Stripe 웹훅으로 결제 완료를
//     확인한 뒤 DB에 구독 상태를 기록해야 한다.
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // 키가 아예 없으면 프론트가 로컬 데모 업그레이드로 폴백하도록 신호
    return res.status(503).json({ error: 'stripe_not_configured', fallback: true });
  }

  // 유료 플랜 3단계 → 각각 Stripe 대시보드에서 만든 Price ID로 매핑.
  // plan 값을 그대로 env var 이름 조립에 쓰면 임의 문자열 주입이 되므로 화이트리스트로만 허용.
  const PLAN_PRICE_ENV = {
    basic: 'STRIPE_PRICE_BASIC',
    middle: 'STRIPE_PRICE_MIDDLE',
    high: 'STRIPE_PRICE_HIGH',
  };

  let email = '';
  let plan = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    email = (body?.email || '').trim();
    plan = (body?.plan || '').trim();
  } catch {
    return res.status(400).json({ error: 'bad_request' });
  }

  if (!Object.prototype.hasOwnProperty.call(PLAN_PRICE_ENV, plan)) {
    return res.status(400).json({ error: 'invalid_plan' });
  }
  const priceId = process.env[PLAN_PRICE_ENV[plan]];
  if (!priceId) {
    // 해당 플랜의 Price ID가 아직 설정 안 됐으면 프론트가 로컬 데모 업그레이드로 폴백
    return res.status(503).json({ error: 'plan_not_configured', fallback: true });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const params = new URLSearchParams({
    'mode': 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'success_url': `${origin}/dashboard.html?upgraded=${plan}`,
    'cancel_url': `${origin}/pricing.html?canceled=1`,
  });
  if (email) params.set('customer_email', email);

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Stripe error:', r.status, detail);
      return res.status(502).json({ error: 'stripe_failed', status: r.status, fallback: true });
    }

    const data = await r.json();
    return res.status(200).json({ url: data.url });

  } catch (err) {
    console.error('handler error:', err);
    return res.status(500).json({ error: 'internal', fallback: true });
  }
}
