// api/save-schedule.js
// ─────────────────────────────────────────────────────────────
// 아침 리포트 자동 발송 스케줄을 Supabase에 저장(업서트)한다.
//   저장값: email(PK), work_time(출근 시각), categories(정리 항목), report_email, timezone
//   refresh_token(오프라인 드라이브 접근)은 oauth-callback.js가 따로 채운다.
// SDK 없이 Supabase REST(PostgREST) + service_role 키(서버 전용)로 호출.
// 환경변수(SUPABASE_URL / SUPABASE_SERVICE_KEY) 없으면 503 + fallback.
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 허용됩니다' });

  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPA_URL || !SUPA_KEY) return res.status(503).json({ error: 'supabase_not_configured', fallback: true });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'bad_request' }); }

  const email = (body?.email || '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const row = {
    email,
    work_time: (body?.work_time || '').trim() || null,
    categories: (body?.categories || '').trim() || null,
    report_email: (body?.report_email || '').trim() || email,
    timezone: body?.timezone || 'Asia/Seoul',
    updated_at: new Date().toISOString(),
  };

  try {
    const r = await fetch(SUPA_URL + '/rest/v1/automations', {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('supabase upsert failed:', r.status, t);
      return res.status(502).json({ error: 'supabase_failed', status: r.status });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('save-schedule error:', err);
    return res.status(500).json({ error: 'internal' });
  }
}
