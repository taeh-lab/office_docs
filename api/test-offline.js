// api/test-offline.js?email=<이메일>
// ─────────────────────────────────────────────────────────────
// 검증용: Supabase에 저장된 refresh token으로 access token을 새로 발급받아
//   드라이브 파일 목록을 읽어본다 → "서버가 사용자 없이도 드라이브 접근 가능"함을 증명.
//   (실제 문서 파싱·정리·발송은 B3에서. 여기선 오프라인 접근이 되는지만 확인)
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const email = (req.query?.email || '').toLowerCase();

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    || '800757732783-spmtgjkn5n4nfi56oq8qlqm3bfdtcrmj.apps.googleusercontent.com';
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!CLIENT_SECRET || !SUPA_URL || !SUPA_KEY) return res.status(503).json({ error: 'not_configured' });
  if (!email) return res.status(400).json({ error: 'email_required' });

  try {
    // 저장된 refresh token 조회
    const gr = await fetch(
      SUPA_URL + '/rest/v1/automations?email=eq.' + encodeURIComponent(email) + '&select=refresh_token,work_time,categories,report_email',
      { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } }
    );
    const rows = await gr.json();
    const rec = rows[0];
    if (!rec || !rec.refresh_token) return res.status(404).json({ error: 'no_refresh_token' });

    // refresh token → access token
    const tr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: rec.refresh_token,
        grant_type: 'refresh_token',
      }).toString(),
    });
    const tok = await tr.json();
    if (!tok.access_token) {
      console.error('refresh failed:', tr.status, tok);
      return res.status(502).json({ error: 'token_refresh_failed', detail: tok });
    }

    // 드라이브 최근 파일 5개 (오프라인 접근 증명)
    const dr = await fetch(
      'https://www.googleapis.com/drive/v3/files?orderBy=modifiedTime%20desc&pageSize=5&fields=files(name,modifiedTime)',
      { headers: { Authorization: 'Bearer ' + tok.access_token } }
    );
    const data = await dr.json();
    return res.status(200).json({
      ok: true,
      offline_access: 'works',
      schedule: { work_time: rec.work_time, categories: rec.categories, report_email: rec.report_email },
      recent_files: (data.files || []).map(f => f.name),
    });
  } catch (err) {
    console.error('test-offline error:', err);
    return res.status(500).json({ error: 'internal' });
  }
}
