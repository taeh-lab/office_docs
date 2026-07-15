/* 법적 문서를 화면 안에서 보여주는 시트(모달). 앱용.
 *
 * 왜 있나: 푸터는 웹 패턴이다. 모바일 앱에선 법적 링크·앱 정보가 설정 안으로 들어간다.
 *   (참고: 모바일에선 끝까지 스크롤할 가능성이 낮아 푸터가 도달 불가능해진다.)
 *   웹 페이지는 그대로 legal-footer.js(푸터)를 쓴다. 이건 앱 화면(tool.html)용이다.
 *
 * ★ 본문을 복사하지 않는다. terms.html / privacy.html / refund.html 이 원본이고,
 *   여기선 그 페이지를 fetch해서 <article> 안쪽만 꺼내 쓴다.
 *   약관이 두 벌이 되면 어긋나고, 어긋난 약관은 법적으로 위험하다. 원본은 하나다.
 *
 * ★ 사업자정보(전자상거래법 표시)는 legal-footer.js가 만든다 — 여기서 다시 안 만든다.
 *   window.LegalFooter.businessHTML()로 가져온다. 없으면 그 항목만 조용히 건너뛴다.
 *
 * ★ CSS를 이 파일이 들고 다닌다 — tool.html은 theme.css를 안 쓴다(그 파일 주석 참조).
 *
 * 쓰는 법:  <button data-legal="terms.html">이용약관</button>  ← 아무 데나. 클릭 위임으로 잡는다.
 *          LegalSheet.open('terms.html')                      ← 직접 호출도 가능
 */
(function () {
  var DOCS = {
    'terms.html':   '이용약관',
    'privacy.html': '개인정보처리방침',
    'refund.html':  '환불·청약철회 규정',
    'business':     '사업자정보',
  };

  var cache = {};     // 한 번 받은 문서는 다시 안 받는다
  var el = null;      // 시트 DOM (처음 열 때 만든다)

  var CSS =
    '.lsheet-ov{position:fixed;inset:0;background:rgba(20,17,10,.45);z-index:200;' +
      'display:grid;place-items:center;padding:16px;}' +
    '.lsheet-ov[hidden]{display:none;}' +
    '.lsheet{width:min(560px,100%);max-height:min(80vh,760px);display:flex;flex-direction:column;' +
      'background:var(--white,#fff);border:1px solid var(--line,#e2ded4);border-radius:16px;' +
      'box-shadow:0 30px 70px -20px rgba(0,0,0,.5);overflow:hidden;}' +
    '.lsheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;' +
      'padding:16px 20px;border-bottom:1px solid var(--line,#e2ded4);flex:none;}' +
    '.lsheet-head h2{font-size:16px;margin:0;font-weight:800;color:var(--ink,#1a1a1a);}' +
    '.lsheet-x{border:none;background:none;font-size:22px;line-height:1;color:var(--muted,#6b6558);' +
      'cursor:pointer;padding:0 4px;min-width:44px;min-height:44px;}' +   /* 앱이니 손가락 크기로 */
    '.lsheet-body{padding:4px 20px 20px;overflow-y:auto;-webkit-overflow-scrolling:touch;}' +
    /* 아래는 terms.html의 .legal 규칙과 같은 값 — 원본 페이지와 같은 모양으로 읽히게 */
    '.lsheet-body h2{font-size:15px;margin:24px 0 8px;padding-top:16px;' +
      'border-top:1px solid var(--line,#e2ded4);color:var(--ink,#1a1a1a);font-weight:800;}' +
    '.lsheet-body h2:first-of-type{border-top:none;padding-top:8px;}' +
    '.lsheet-body p,.lsheet-body li{font-size:14px;line-height:1.85;color:var(--ink,#1a1a1a);}' +
    '.lsheet-body ul,.lsheet-body ol{margin:8px 0;padding-left:20px;}' +
    '.lsheet-body li::marker{color:var(--muted,#6b6558);}' +
    '.lsheet-body a{color:var(--accent,#2f5d50);}' +
    '.lsheet-body .note{background:var(--paper,#faf9f6);border:1px solid var(--line,#e2ded4);' +
      'border-radius:10px;padding:14px 16px;font-size:13px;color:var(--muted,#6b6558);margin-top:14px;}' +
    '.lsheet-msg{font-size:14px;color:var(--muted,#6b6558);padding:24px 0;line-height:1.7;}';

  function build() {
    var s = document.createElement('style');
    s.id = 'legal-sheet-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);

    var ov = document.createElement('div');
    ov.className = 'lsheet-ov';
    ov.hidden = true;
    ov.innerHTML =
      '<div class="lsheet" role="dialog" aria-modal="true" aria-labelledby="lsheetTitle">' +
        '<div class="lsheet-head"><h2 id="lsheetTitle"></h2>' +
          '<button class="lsheet-x" data-lsheet-close aria-label="닫기">&times;</button></div>' +
        '<div class="lsheet-body"></div>' +
      '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-lsheet-close]')) close();
    });
    return { ov: ov, title: ov.querySelector('#lsheetTitle'), body: ov.querySelector('.lsheet-body') };
  }

  function close() { if (el) el.ov.hidden = true; }

  // terms.html 등에서 <article> 안쪽만 꺼낸다. 스크립트는 실행되지 않는다(DOMParser).
  function extract(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var art = doc.querySelector('.legal article') || doc.querySelector('article');
    return art ? art.innerHTML : null;
  }

  function open(key) {
    if (!el) el = build();
    el.title.textContent = DOCS[key] || '';
    el.ov.hidden = false;
    el.body.scrollTop = 0;

    if (cache[key]) { el.body.innerHTML = cache[key]; return; }

    if (key === 'business') {
      var biz = window.LegalFooter && window.LegalFooter.businessHTML;
      if (!biz) { el.body.innerHTML = '<div class="lsheet-msg">사업자정보를 불러올 수 없습니다.</div>'; return; }
      el.body.innerHTML = '<div class="lsheet-msg">불러오는 중…</div>';
      biz().then(function (html) { cache[key] = html; el.body.innerHTML = html; });
      return;
    }

    el.body.innerHTML = '<div class="lsheet-msg">불러오는 중…</div>';
    fetch(key)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (t) {
        var inner = extract(t);
        if (!inner) throw new Error('article 없음');
        cache[key] = inner;
        el.body.innerHTML = inner;
      })
      .catch(function () {
        // 못 받아오면 원문 페이지로 나갈 길은 남긴다 — 법적 문서라 막다른 길이면 안 된다
        el.body.innerHTML = '<div class="lsheet-msg">문서를 불러오지 못했습니다.<br>' +
          '<a href="' + key + '">' + (DOCS[key] || '문서') + ' 페이지에서 보기</a></div>';
      });
  }

  // data-legal="terms.html" 을 가진 아무 요소나 클릭하면 열린다
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-legal]');
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute('data-legal'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && el && !el.ov.hidden) close();
  });

  window.LegalSheet = { open: open, close: close };
})();
