// shared/components/legal-footer.js
// ─────────────────────────────────────────────────────────────
// 사업자정보 + 법적 링크(이용약관·개인정보처리방침·환불규정) 푸터.
// 전자상거래법 표시의무: 이 정보를 사이트에서 볼 수 있어야 함.
//
// ★ 값은 Vercel 환경변수에서 읽어온다(/api/public-config → business).
//   BIZ_NO(사업자등록번호) · BIZ_ADDRESS(주소) · BIZ_EMAIL(고객문의) ·
//   BIZ_MAIL_ORDER_NO(통신판매업신고번호) · BIZ_COMPANY · BIZ_CEO · BIZ_PHONE.
//   → 리포에 개인정보를 커밋하지 않고, 비어 있으면 "[…준비중]"으로 표시.
//   페이지에 <div id="legalFooter"></div> 를 두고 이 스크립트를 로드하면 그 자리에 렌더된다.
// ─────────────────────────────────────────────────────────────
(function () {
  // 사업자정보(법정 공개 표시값). env(/api/public-config)로 덮어쓸 수 있으나, 없으면 이 값이 표시된다.
  const DEFAULTS = {
    company:     '시티델(citidel)',
    ceo:         '윤태훈',
    bizNo:       '771-26-02153',
    mailOrderNo: '',   // 통신판매업 신고번호 — 나오면 채움
    address:     '서울특별시 금천구 시흥대로 291',
    email:       's01090533790@gmail.com',
    phone:       '',
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  // 값 있으면 이스케이프해서, 없으면 흐린 "[라벨 준비중]" 플레이스홀더.
  function soft(v, label) {
    return (v && String(v).trim()) ? esc(v) : `<span style="opacity:.55">[${label} 준비중]</span>`;
  }

  // 빈 문자열/누락 값이 실제 기본값을 덮지 않도록, 값이 있는 필드만 override.
  function merge(info) {
    const b = Object.assign({}, DEFAULTS);
    if (info) for (const k in info) { if (info[k] != null && String(info[k]).trim() !== '') b[k] = info[k]; }
    return b;
  }

  // 사업자정보(전자상거래법 표시항목) 본문. 푸터와 앱 설정 시트가 같은 이 함수를 쓴다 — 두 벌 금지.
  function bizLines(b) {
    const phone = (b.phone && b.phone.trim()) ? ' · 고객센터 ' + esc(b.phone) : '';
    return `상호 ${esc(b.company)} · 대표 ${esc(b.ceo)} · 사업자등록번호 ${soft(b.bizNo, '사업자등록번호')}<br>
        통신판매업신고 ${soft(b.mailOrderNo, '통신판매업 신고번호')} · 주소 ${soft(b.address, '주소')}<br>
        고객문의 ${soft(b.email, '고객문의 이메일')}${phone}`;
  }

  function build(info) {
    const b = merge(info);
    return `
    <footer class="site-footer">
      <div class="footer-links">
        <a href="terms.html">이용약관</a>
        <a href="privacy.html"><strong>개인정보처리방침</strong></a>
        <a href="refund.html">환불·청약철회</a>
        <a href="changelog.html">업데이트 소식</a>
        <a href="status.html">서비스 상태</a>
      </div>
      <div style="font-size:12px;color:var(--muted);line-height:1.8;">${bizLines(b)}</div>
      <div style="margin-top:12px;font-size:12px;color:var(--muted);">© 2026 DocFinder · 개인 포트폴리오 프로젝트</div>
    </footer>`;
  }

  // ★ 이 컴포넌트는 자기 CSS를 들고 다닌다 — theme.css에 의존하지 않는다.
  //   tool.html처럼 theme.css를 안 쓰는 페이지가 있어서(그 파일 주석 참조), 의존하면
  //   그 페이지에선 스타일 없는 맨 텍스트로 렌더된다. usage-chart.js가 같은 문제를
  //   "CSS를 tool.html에 복제"로 때웠는데, 복제는 또 어긋난다. 컴포넌트가 자급자족한다.
  //   색은 디자인시스템 변수를 쓰되, 변수조차 없는 페이지를 대비해 폴백값을 둔다.
  const CSS = `
    .site-footer{
      max-width:960px; margin:0 auto; padding:20px 20px 40px;
      font-size:12px; color:var(--muted,#6b6558); border-top:1px solid var(--line,#e2ded4);
    }
    .site-footer .footer-links{ display:flex; gap:16px; flex-wrap:wrap; margin-bottom:14px; }
    .site-footer .footer-links a{
      /* WCAG 2.2 §2.5.8(AA) = 최소 24×24. 맨 텍스트 링크는 19px라 미달 → 세로 패딩으로 띄운다. */
      display:inline-flex; align-items:center; min-height:24px; padding:3px 0;
    }`;

  function injectCSS() {
    if (document.getElementById('legal-footer-css')) return;   // 두 번 로드돼도 안전
    const s = document.createElement('style');
    s.id = 'legal-footer-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // 슬롯이 있을 때만 푸터를 렌더한다.
  // 앱 화면(tool.html)은 이 파일을 "사업자정보 데이터 소스"로만 쓰고 푸터는 안 단다
  // (푸터는 웹 패턴 — 앱에선 legal-sheet.js가 설정 안에서 보여준다).
  function mount(html) {
    const slot = document.getElementById('legalFooter');
    if (!slot) return;
    injectCSS();
    slot.outerHTML = html;
  }

  function config() {
    return fetch('/api/public-config')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null);          // 설정 못 받아도 기본값으로 계속 간다
  }

  // legal-sheet.js(앱 설정 시트)가 가져다 쓴다. 푸터와 같은 bizLines를 쓴다 — 두 벌 금지.
  window.LegalFooter = {
    businessHTML: function () {
      return config().then(d =>
        `<p style="font-size:14px;line-height:1.9;">${bizLines(merge(d && d.business))}</p>`);
    }
  };

  function go() { config().then(d => mount(build(d && d.business))); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
