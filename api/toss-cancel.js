// api/toss-cancel.js
// ─────────────────────────────────────────────────────────────
// 구독 해지 + 환불. 설정 화면 "구독 해지" 버튼이 POST { email, creditsUsed } 로 호출.
//
// 환불 규칙(전자상거래법 제17조 + 우리 약관, PAYMENTS-PLAN.md):
//   · 마지막 결제 후 10일 이내  AND  이번 결제분 크레딧 500 미만 사용  → 전액 환불(토스 결제취소)
//   · 그 외 → 환불 없음. 단 어느 경우든 구독 status=canceled → 다음 달 청구 중단.
//
// creditsUsed는 아직 클라이언트(localStorage)가 관리 → body로 받는다(서버 사용량 집계는 후속 과제).
// TOSS_SECRET_KEY / Supabase 미설정이면 503.
// ─────────────────────────────────────────────────────────────

const REFUND_WINDOW_DAYS = 10;
const REFUND_CREDIT_LIMIT = 500;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'bad_request' }); }

  const email = String(body.email || '').toLowerCase();
  const creditsUsed = Number(body.creditsUsed || 0);
  if (!email) return res.status(400).json({ error: 'email_required' });

  const SECRET = process.env.TOSS_SECRET_KEY;
  const SUPA_URL = process.env.SUPABASE_URL, SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SECRET || !SUPA_URL || !SUPA_KEY) return res.status(503).json({ error: 'not_configured' });

  const supaHead = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };
  try {
    // 구독 조회
    const gr = await fetch(SUPA_URL + '/rest/v1/subscriptions?email=eq.' + encodeURIComponent(email) + '&select=*', { headers: supaHead });
    const rows = await gr.json();
    const sub = Array.isArray(rows) ? rows[0] : null;
    if (!sub || sub.status !== 'active') return res.status(404).json({ error: 'no_active_subscription' });

    // 환불 자격 판정
    const daysSince = (Date.now() - new Date(sub.last_paid_at).getTime()) / 86400000;
    const eligible = daysSince <= REFUND_WINDOW_DAYS && creditsUsed < REFUND_CREDIT_LIMIT;

    let refunded = false, refundError = null;
    if (eligible && sub.last_payment_key) {
      const auth = 'Basic ' + Buffer.from(SECRET + ':').toString('base64');
      const cr = await fetch('https://api.tosspayments.com/v1/payments/' + sub.last_payment_key + '/cancel', {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: '구독 해지 — 10일 이내·크레딧 500 미만 전액환불' }),
      });
      const cd = await cr.json();
      if (cr.ok && cd.status === 'CANCELED') refunded = true;
      else { refundError = cd?.message || ('status ' + cr.status); console.error('toss cancel failed:', cr.status, cd); }
    }

    // 구독 해지 처리(다음 달 청구 중단)
    await fetch(SUPA_URL + '/rest/v1/subscriptions?email=eq.' + encodeURIComponent(email), {
      method: 'PATCH',
      headers: { ...supaHead, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'canceled' }),
    });

    return res.status(200).json({ ok: true, canceled: true, eligible, refunded, refundError });
  } catch (err) {
    console.error('toss-cancel error:', err);
    return res.status(500).json({ error: 'internal' });
  }
}
