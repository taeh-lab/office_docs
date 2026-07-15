/* 앱(설치형 standalone)과 웹의 차이를 만드는 단일 지점. (구 app-entry.js)
 *
 * 하는 일 두 가지:
 *  1) standalone이면 <html>에 .is-app 을 단다 → CSS로 앱/웹 차이를 낸다.
 *       class="web-only"  = 웹에서만 보임. 앱에선 숨김.  ← 외부 결제 진입점이 여기.
 *  2) <script ... data-redirect-to="tool.html"> 로 실으면 그리로 보낸다.
 *       랜딩(index.html)에만 붙인다. 앱에서 마케팅 랜딩이 뜨는 걸 막는 용도:
 *         - 로고(tool.html의 .brand)로 랜딩에 들어왔을 때
 *         - start_url이 "/"였던 구버전 설치본이 랜딩으로 시작할 때
 *       정상 실행에선 안 돈다 — manifest의 start_url이 /tool.html이라 앱은 도구로 바로 시작한다.
 *       (web.dev/MDN 권고: start_url은 랜딩이 아니라 앱 진입점을 가리켜야 한다.)
 *
 * ★ 앱에서 결제를 빼는 이유:
 *   구글 플레이는 디지털 상품 결제를 Play 결제로 받길 원한다. 앱에 외부 결제(토스) 진입점이
 *   아예 없으면 그 논쟁 자체가 생기지 않는다. 나중에 Play 결제를 붙일 땐 그 버튼만
 *   .web-only 없이 넣으면 된다. 웹은 지금 그대로 토스로 결제한다.
 *
 * ★ 로그인은 강제하지 않는다. 도구는 웹과 똑같이 비로그인으로 쓸 수 있고,
 *   로그인은 추가 기능을 여는 열쇠일 뿐이다. (예전 app-entry.js는 앱에서만 login.html로 튕겼음.)
 *
 * ★ CSS를 이 파일이 들고 다닌다 — tool.html은 theme.css를 안 쓴다(그 파일 주석 참조).
 *   theme.css에 두면 tool.html에서 .web-only가 안 먹어서 앱에 결제 버튼이 그대로 남는다.
 *
 * 일반 웹 브라우저 방문에는 영향 없음. 렌더 전에 실행돼야 깜빡임이 없으므로
 * <head>에서 defer 없이 로드한다(숨길 요소가 잠깐 보였다 사라지면 안 됨). */
(function () {
  var standalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;

  // currentScript는 실행 중에만 읽을 수 있다 — 리다이렉트보다 먼저 읽어둔다.
  var to = document.currentScript && document.currentScript.getAttribute('data-redirect-to');

  if (!standalone) return;                      // 웹 → 아무것도 안 함

  document.documentElement.classList.add('is-app');

  if (to) { location.replace(to); return; }     // 랜딩 → 도구. 아래는 볼 필요 없음

  var s = document.createElement('style');
  s.id = 'app-mode-css';
  s.textContent = '.is-app .web-only{display:none !important;}';
  (document.head || document.documentElement).appendChild(s);
})();
