/* DocFinder 서비스워커 — 보수적 전략(앱 로직 안 깨지게)
 * - 같은 출처(GET)만 처리. 외부 CDN·구글·토스 SDK·서버리스(/api/)는 절대 가로채지 않음(네트워크 그대로).
 * - 같은 출처는 "네트워크 우선"(온라인이면 항상 최신) + 오프라인 시 캐시 폴백.
 * - 내비게이션 오프라인이면 /offline.html 로 폴백.
 * 배포마다 최신을 보장하려고 network-first를 씀 — 캐시는 오프라인 안전망 역할만.
 */
const VERSION = 'df-v1';
const CACHE = VERSION + '-shell';
const PRECACHE = [
  '/', '/index.html', '/tool.html', '/offline.html',
  '/manifest.webmanifest', '/shared/assets/favicon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // 외부 출처(CDN·구글·토스 등)는 손대지 않는다 — 브라우저 기본 동작.
  if (url.origin !== self.location.origin) return;
  // 서버리스 함수는 항상 네트워크로.
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      // 정상 동일출처 응답만 오프라인용으로 캐시.
      if (res && res.ok && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
      }
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const offline = await caches.match('/offline.html');
        if (offline) return offline;
      }
      return Response.error();
    }
  })());
});
