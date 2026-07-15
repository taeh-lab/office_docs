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
// 크레딧(토큰) 원장 — 날짜별로 이번 달 사용 크레딧을 기록(dwf_usage_days_{email}).
// 기능 잠금 없이 "쓴 만큼 차감"하는 용량 비례 모델. 과금 방식은 config.js의 CREDIT_MODEL,
// 플랜별 월 지급량은 PLANS[plan].credits.
// tool.html(동작 시 차감)과 dashboard.html(잔액 게이지·일별 차트)이 같이 쓴다.
// getUsage = 이번 달 사용 크레딧 합계(과거 "검색 횟수"에서 의미만 크레딧으로 일반화).
// ─────────────────────────────────────────────────────────────
function usageMapKey(email){ return `dwf_usage_days_${email}`; }
function usageMap(email){
  try { return JSON.parse(localStorage.getItem(usageMapKey(email))) || {}; }
  catch { return {}; }
}
function dateKey(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getUsage(email){
  const ym = dateKey(new Date()).slice(0, 7);
  const map = usageMap(email);
  return Object.entries(map).reduce((sum, [day, count]) => day.startsWith(ym) ? sum + count : sum, 0);
}

// 플랜의 월 지급 크레딧 (null = 무제한). 모르는 플랜이면 free 취급.
function planCredits(plan){
  if(typeof PLANS === 'undefined') return null;
  const p = PLANS[plan] || PLANS.free;
  return p ? p.credits : null;
}
// 이번 달 남은 크레딧 (무제한이면 Infinity)
function creditBalance(email, plan){
  const allow = planCredits(plan);
  if(allow == null) return Infinity;
  return Math.max(0, allow - getUsage(email));
}
// n크레딧을 쓸 수 있는지 (잔액 확인)
function canSpend(email, plan, n){
  const allow = planCredits(plan);
  if(allow == null) return true;
  return getUsage(email) + n <= allow;
}
// n크레딧 차감하고 이번 달 사용 합계 반환
function spendCredits(email, n){
  const map = usageMap(email);
  const key = dateKey(new Date());
  map[key] = (map[key] || 0) + n;
  localStorage.setItem(usageMapKey(email), JSON.stringify(map));
  return getUsage(email);
}
// 하위호환: 기존 incUsage(email) = 1크레딧 차감
function incUsage(email){ return spendCredits(email, 1); }
// 이번 달 1일부터 오늘까지 일별 검색 횟수 — 대시보드 사용량 차트용
function getUsageHistory(email){
  const map = usageMap(email);
  const now = new Date();
  const out = [];
  for(let d = 1; d <= now.getDate(); d++){
    const key = dateKey(new Date(now.getFullYear(), now.getMonth(), d));
    out.push({ day: d, count: map[key] || 0 });
  }
  return out;
}

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
