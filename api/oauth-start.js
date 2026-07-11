// api/oauth-start.js
// ─────────────────────────────────────────────────────────────
// 오프라인 드라이브 접근(refresh token)을 받기 위한 구글 OAuth 동의 화면으로 리다이렉트.
//   access_type=offline + prompt=consent 로 refresh token을 확실히 받는다.
//   scope에 openid email을 포함해 콜백에서 사용자 이메일을 알아낸다(누구 토큰인지 식별).
// 브라우저 GIS 토큰(단기)과 달리, 이 코드 플로우만이 서버가 나중에 쓸 refresh token을 준다.
// ─────────────────────────────────────────────────────────────

export default function handler(req, res) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    || '800757732783-spmtgjkn5n4nfi56oq8qlqm3bfdtcrmj.apps.googleusercontent.com';
  const origin = `https://${req.headers.host}`;
  const redirectUri = origin + '/api/oauth-callback';

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email https://www.googleapis.com/auth/drive.readonly',
    access_type: 'offline',
    prompt: 'consent',                 // refresh token을 매번 확실히 받기
    include_granted_scopes: 'true',
  });

  res.writeHead(302, { Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString() });
  res.end();
}
