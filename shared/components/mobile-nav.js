/* 모바일/설치앱 하단 탭 내비 + 문서 업로드 FAB + 바텀시트.
 * - 탭(홈/검색/정리/리포트)은 window.DF.setMode()로 전환 → 데스크톱 스위처와 상태 공유.
 * - 우하단 FAB(＋)는 문서 시트를 연다(내PC/드라이브/자동수집 = 기존 .rail 재사용).
 * - 데스크톱(≥861px)에선 CSS로 전부 숨겨져 영향 없음. 기능/ID/로직 무손상, 표현만 앱처럼. */
(function () {
  var app = document.querySelector('.app');
  if (!app || document.querySelector('.bottom-nav')) return;

  var TABS = [
    { nav: 'home',    label: '홈',     icon: 'i-home' },
    { nav: 'search',  label: '검색',   icon: 'i-search' },
    { nav: 'digest',  label: '정리',   icon: 'i-list-checks' },
    { nav: 'morning', label: '리포트', icon: 'i-calendar-clock' }
  ];

  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }

  // 시트 배경(스크림)
  var scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  scrim.addEventListener('click', closeSheet);
  app.appendChild(scrim);

  // 문서 올리기 FAB
  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'fab';
  fab.setAttribute('aria-label', '문서 올리기');
  fab.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg>';
  fab.addEventListener('click', function () { buzz(); toggleSheet(); });
  app.appendChild(fab);

  // 하단 탭 내비
  var nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', '앱 내비게이션');
  nav.innerHTML = TABS.map(function (t) {
    return '<button type="button" class="bnav-item" data-nav="' + t.nav + '">' +
      '<svg class="icon" aria-hidden="true"><use href="#' + t.icon + '"></use></svg>' +
      t.label + '</button>';
  }).join('');
  app.appendChild(nav);

  nav.addEventListener('click', function (e) {
    var b = e.target.closest('.bnav-item');
    if (!b) return;
    buzz();
    closeSheet();
    if (window.DF) window.DF.setMode(b.getAttribute('data-nav'));
  });

  function openSheet()   { app.classList.add('sheet-open'); sync(); }
  function closeSheet()  { app.classList.remove('sheet-open'); sync(); }
  function toggleSheet() { app.classList.toggle('sheet-open'); sync(); }

  document.addEventListener('df:opendocs', openSheet);
  document.addEventListener('df:modechange', sync);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  function currentMode() { return (window.DF && window.DF.getMode) ? window.DF.getMode() : 'search'; }

  function sync() {
    var cm = currentMode();
    var open = app.classList.contains('sheet-open');
    nav.querySelectorAll('.bnav-item').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-nav') === cm && !open);
    });
    fab.classList.toggle('on', open);
  }

  // 모바일에서 앱 진입 시 '홈'을 기본 화면으로(전환 애니메이션 없이 즉시)
  if (window.matchMedia('(max-width:860px)').matches && window.DF) {
    window.DF.setMode('home', { instant: true });
  }
  sync();
})();
