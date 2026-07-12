/* PWA 부트스트랩 — 서비스워커 등록.
 * HTTPS 또는 localhost 에서만 등록(파일 열기·미지원 브라우저는 조용히 스킵 → 앱 안 죽음).
 * 등록 실패해도 콘솔 경고만 남기고 앱 동작에는 영향 없음. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var host = location.hostname;
  var ok = location.protocol === 'https:' || host === 'localhost' || host === '127.0.0.1';
  if (!ok) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.warn('[PWA] 서비스워커 등록 실패(무시 가능):', err && err.message);
    });
  });
})();
