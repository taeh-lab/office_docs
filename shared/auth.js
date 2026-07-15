// shared/auth.js
// ─────────────────────────────────────────────────────────────
// 데모용 로그인 상태 관리.
// 이 프로젝트는 포트폴리오 데모라 실제 서버 인증/DB가 없다 —
// localStorage에 "로그인된 사용자"를 흉내 내서 로그인 → 대시보드 →
// 요금제 업그레이드로 이어지는 SaaS 흐름 자체를 보여주는 용도.
// 실제 서비스라면 이 파일 전체가 서버 세션/JWT 검증으로 대체되어야 한다.
// ─────────────────────────────────────────────────────────────

const AUTH_KEY = 'dwf_user';

function getUser(){
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}

function setUser(user){
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function logout(){
  localStorage.removeItem(AUTH_KEY);
  location.href = 'index.html';
}

// 로그인 안 되어 있으면 login.html로 보내고, 로그인 후 원래 페이지로 돌아오게 next를 남긴다.
function requireAuth(){
  const u = getUser();
  if(!u){
    const next = encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html');
    location.href = `login.html?next=${next}`;
    return null;
  }
  return u;
}

// ─────────────────────────────────────────────────────────────
// Google Identity Services (진짜 구글 로그인 팝업).
// shared/config.js의 GOOGLE_CLIENT_ID가 채워져 있어야 동작한다.
// 주의: 백엔드가 없어서 ID 토큰 서명을 서버에서 검증하지 않는다 — 데모용
// 로그인이라 클라이언트에서 payload만 읽어 세션(localStorage)을 만든다.
// 실제 서비스라면 credential을 서버로 보내 Google 공개키로 검증해야 한다.
// ─────────────────────────────────────────────────────────────
function initGoogleSignIn(buttonElId, onSuccess){
  const el = document.getElementById(buttonElId);
  if(!el) return;
  const notConfigured = typeof GOOGLE_CLIENT_ID === 'undefined' || GOOGLE_CLIENT_ID.startsWith('YOUR_');
  if(notConfigured){
    el.innerHTML = `<button type="button" class="btn btn-ghost btn-block" disabled
      title="SETUP-TODO.md 참고 — Google Client ID 설정 필요">Google로 계속하기 (설정 필요)</button>`;
    return;
  }
  if(typeof google === 'undefined' || !google.accounts){
    el.innerHTML = `<button type="button" class="btn btn-ghost btn-block" disabled>Google 스크립트 로딩 실패</button>`;
    return;
  }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (resp)=>{
      const payload = decodeJwt(resp.credential);
      if(!payload || !payload.email) return;
      onSuccess({ email: payload.email, name: payload.name || payload.email.split('@')[0], picture: payload.picture || '' });
    }
  });
  // GSI의 width는 px 고정값만 받는다(퍼센트 불가) → 컨테이너 폭에 맞춰 계산한다.
  //   320 고정이었을 때: 375px 화면의 가용 폭이 270px이라 버튼이 카드를 22px 넘쳐 잘렸다
  //   (.authcard가 overflow-x:hidden이라 스크롤이 아니라 잘림. 실측: 버튼 right 373 vs 카드 right 351).
  //   라이브 실측 검증: width 270 → 버튼 right 323, 잘림 0.
  // GSI 허용 범위 200~400. 컨테이너 폭을 못 재면(0) 기존 값 320으로 폴백.
  const w = Math.max(200, Math.min(400, Math.round(el.getBoundingClientRect().width) || 320));
  google.accounts.id.renderButton(el, { theme:'outline', size:'large', width:w, text:'continue_with' });
}

// ─────────────────────────────────────────────────────────────
// 크레딧은 이 파일을 떠났다 → shared/credit.js(코어) + shared/credit-rules.js(규칙).
//
// 왜 옮겼나: 크레딧이 계정(email)과 요금제(plan)를 알고 있었다. 그래서 판정에 user가 필요했고,
//   user가 없으면 예외처리가 필요했고, 그게 UI의 로그인 게이팅(.acct)으로 번져
//   앱에서 비로그인 사용자가 법적 문서에 도달 못 하는 구멍을 만들었다(057e633에서 급히 막음).
//   골드는 플레이어의 직업을 몰라야 한다.
// 그리고 여기 있던 `typeof PLANS === 'undefined' → return null`(= 무제한)은
//   설정 누락을 조용한 과금 해제로 만들었다. auth.js가 PLANS 없는 페이지에도 실려서 생긴 가드였다.
//   크레딧이 tool.html에만 실리는 파일로 나가면서 그 가드는 삭제가 아니라 소멸했다.
//
// 이 파일에 크레딧을 다시 넣지 말 것 — tools/check-credit.mjs가 exit 1 한다.
// ─────────────────────────────────────────────────────────────

function decodeJwt(token){
  try{
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g,'+').replace(/_/g,'/'))
        .split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  }catch{ return null; }
}
