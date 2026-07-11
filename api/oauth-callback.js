// api/oauth-callback.js
// ─────────────────────────────────────────────────────────────
// 구글이 준 인증 code를 토큰으로 교환하고, refresh token을 Supabase에 저장한다.
//   1) code → {access_token, refresh_token, id_token} (Client Secret 필요)
//   2) id_token(JWT)에서 이메일 추출 → "누구의 토큰인지" 식별(브라우저가 주장한 값 대신 실제 동의한 계정)
//   3) automations 테이블에 refresh_token 업서트
// 끝나면 tool.html?automation=<상태> 로 리다이렉트해 프론트가 결과를 안내한다.
// 주의(데모 한계): refresh token을 평문으로 저장한다 — 프로덕션이라면 암호화(KMS 등) 권장.
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const code = req.query?.code;
  if (!code) return redirect(res, '/tool.html?automation=denied');

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    || '800757732783-spmtgjkn5n4nfi56oq8qlqm3bfdtcrmj.apps.googleusercontent.com';
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!CLIENT_SECRET || !SUPA_URL || !SUPA_KEY) return redirect(res, '/tool.html?automation=notconfigured');

  const origin = `https://${req.headers.host}`;
  const redirectUri = origin + '/api/oauth-callback';

  try {
    // 1) code → token
    const tr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const tok = await tr.json();
    if (!tr.ok || !tok.refresh_token) {
      console.error('token exchange failed:', tr.status, tok);
      return redirect(res, '/tool.html?automation=norefresh');
    }

    // 2) id_token에서 이메일
    let email = '';
    try {
      const payload = JSON.parse(Buffer.from(tok.id_token.split('.')[1], 'base64').toString('utf8'));
      email = (payload.email || '').toLowerCase();
    } catch (e) {}
    if (!email) return redirect(res, '/tool.html?automation=noemail');

    // 3) refresh_token 저장(업서트)
    const r = await fetch(SUPA_URL + '/rest/v1/automations', {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ email, refresh_token: tok.refresh_token, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) {
      console.error('supabase store refresh_token failed:', r.status, await r.text());
      return redirect(res, '/tool.html?automation=storefail');
    }

    return redirect(res, '/tool.html?automation=ok');
  } catch (err) {
    console.error('oauth-callback error:', err);
    return redirect(res, '/tool.html?automation=error');
  }
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
