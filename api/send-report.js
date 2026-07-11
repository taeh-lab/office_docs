// api/send-report.js
// ─────────────────────────────────────────────────────────────
// 정리 리포트(엑셀)를 이메일로 발송한다 — Resend API.
//
// 하는 일:
//   1. 브라우저가 만든 엑셀(base64) + 받는 사람 + 요약 HTML을 받는다
//   2. Resend REST API로 엑셀을 첨부해 메일을 보낸다 (SDK 없이 fetch — 기존 함수들과 같은 패턴)
//
// 설계:
//   - RESEND_API_KEY가 없으면 503 + fallback 신호 → 프론트가 "메일 설정 필요"로 안내
//   - 발신자는 RESEND_FROM(검증된 도메인). 없으면 Resend 온보딩 발신자(onboarding@resend.dev)로
//     — 이 경우 Resend 정책상 "본인(계정 소유) 이메일로만" 발송돼서 테스트엔 충분함.
//   - 이 단계(B1)는 브라우저가 이미 만든 엑셀을 서버는 "발송만" 한다. 무인 자동화(B3)에서는
//     서버가 직접 문서를 수집·정리해 만든다.
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 허용됩니다' });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'resend_not_configured', fallback: true });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'bad_request' }); }

  const to = (body?.to || '').trim();
  const subject = (body?.subject || 'DocFinder 정리 리포트').trim();
  const html = body?.html || '<p>DocFinder 정리 리포트입니다.</p>';
  const filename = (body?.filename || 'report.xlsx').trim();
  const excelBase64 = body?.excelBase64 || '';

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const from = process.env.RESEND_FROM || 'DocFinder <onboarding@resend.dev>';
  const payload = {
    from,
    to: [to],
    subject,
    html,
  };
  if (excelBase64) {
    payload.attachments = [{ filename, content: excelBase64 }];
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Resend error:', r.status, data);
      return res.status(502).json({ error: 'resend_failed', status: r.status, detail: data });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('send-report handler error:', err);
    return res.status(500).json({ error: 'internal' });
  }
}
