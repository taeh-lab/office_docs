/* 설치앱(standalone)으로 열렸을 때의 진입 라우팅 — "앱 답안지":
 *  - 로그인돼 있으면  → 바로 홈(도구, tool.html)
 *  - 로그인 안 됐으면 → 로그인(login.html), 로그인 후 홈으로
 * 일반 웹 브라우저 방문에는 영향 없음(랜딩 그대로 노출).
 * 세션당 최초 실행 1회만 라우팅 → 앱 안에서 로고로 랜딩 재방문 시엔 가로막지 않음.
 * 랜딩 렌더 전에 실행돼야 깜빡임이 없으므로 <head>에서 defer 없이 즉시 로드한다. */
(function () {
  var standalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  if (!standalone) return;
  try {
    if (sessionStorage.getItem('df_entry_routed')) return;
    sessionStorage.setItem('df_entry_routed', '1');
  } catch (e) { /* 프라이빗 모드 등 — 라우팅은 계속 진행 */ }
  var user = null;
  try { user = JSON.parse(localStorage.getItem('dwf_user')); } catch (e) {}
  location.replace(user ? 'tool.html' : 'login.html?next=tool.html');
})();
