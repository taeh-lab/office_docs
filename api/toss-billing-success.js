// api/toss-billing-success.js
// ─────────────────────────────────────────────────────────────
// 토스페이먼츠 자동결제(빌링) — 카드 등록 성공 후 콜백.
//   1) authKey → billingKey 발급 (Client Secret 필요)
//   2) 빌링키로 첫 달 결제 승인
//   3) subscriptions 테이블에 구독(빌링키·플랜·결제키) 저장 → 매월은 크론(B3)이 청구
//   끝나면 dashboard.html?upgraded=<plan> 로 리다이렉트(프론트가 플랜 반영).
//
// successUrl에 ?plan=&email= 을 실어 보냈고, 토스가 여기에 customerKey·authKey를 붙여준다.
// 금액은 서버에서 고정(클라 조작 방지). TOSS_SECRET_KEY 없으면 데모 안내로 폴백.
// ─────────────────────────────────────────────────────────────

// ★ 이건 shared/config.js의 PLANS[x].amount / priceLabel의 명시된 복제다. 단일 진실은 config.js.
//   서버는 shared/를 import 못 한다(shared엔 export가 0개 — 클래식 스크립트, 여긴 ESM) →
//   코드를 공유하는 대신 tools/check-credit.mjs가 기계로 대조한다. 갈라지면 exit 1.
//   여길 고치면 config.js도 같이 고칠 것. 안 하면 커밋 전에 검사가 잡는다.
//   (금액을 서버에 두는 것 자체는 옳다 — 클라 조작 방지. 문제는 "복제"이지 "서버 보유"가 아니다.)
const PLAN_AMOUNTS = { basic: 9900, middle: 19900, high: 39900 };

export default async function handler(req, res) {
  const redirect = (loc) => { res.writeHead(302, { Location: loc }); res.end(); };

  const plan = req.query?.plan;
  const email = (req.query?.email || '').toLowerCase();
  const customerKey = req.query?.customerKey;
  const authKey = req.query?.authKey;
  if (!authKey || !customerKey || !plan || !email) return redirect('/pricing.html?billing=bad');

  const SECRET = process.env.TOSS_SECRET_KEY;
  if (!SECRET) return redirect('/pricing.html?billing=notconfigured');

  const amount = PLAN_AMOUNTS[plan];
  if (!amount) return redirect('/pricing.html?billing=badplan');

  const auth = 'Basic ' + Buffer.from(SECRET + ':').toString('base64');
  try {
    // 1) authKey → billingKey
    const ir = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey, customerKey }),
    });
    const issued = await ir.json();
    if (!ir.ok || !issued.billingKey) {
      console.error('billing issue failed:', ir.status, issued);
      return redirect('/pricing.html?billing=issuefail');
    }
    const billingKey = issued.billingKey;

    // 2) 첫 달 결제 승인
    const orderId = 'sub_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
    const cr = await fetch('https://api.tosspayments.com/v1/billing/' + billingKey, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerKey, amount, orderId, orderName: `DocFinder ${plan} 월 구독`, customerEmail: email }),
    });
    const paid = await cr.json();
    if (!cr.ok || paid.status !== 'DONE') {
      console.error('billing charge failed:', cr.status, paid);
      return redirect('/pricing.html?billing=chargefail');
    }

    // 3) Supabase에 구독 저장 (매월 청구·해지·환불에 사용)
    const SUPA_URL = process.env.SUPABASE_URL, SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (SUPA_URL && SUPA_KEY) {
      const next = new Date(); next.setMonth(next.getMonth() + 1);
      await fetch(SUPA_URL + '/rest/v1/subscriptions', {
        method: 'POST',
        headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          email, plan, billing_key: billingKey, customer_key: customerKey, amount,
          status: 'active', last_payment_key: paid.paymentKey,
          last_paid_at: new Date().toISOString(), next_bill_date: next.toISOString().slice(0, 10),
        }),
      }).catch(e => console.error('supabase sub upsert:', e));
    }

    return redirect('/dashboard.html?upgraded=' + plan);
  } catch (err) {
    console.error('toss-billing-success error:', err);
    return redirect('/pricing.html?billing=error');
  }
}
