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
  const DEFAULTS = { company: 'citidel (시타델)', ceo: '윤태훈', bizNo: '', mailOrderNo: '', address: '', email: '', phone: '' };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  // 값 있으면 이스케이프해서, 없으면 흐린 "[라벨 준비중]" 플레이스홀더.
  function soft(v, label) {
    return (v && String(v).trim()) ? esc(v) : `<span style="opacity:.55">[${label} 준비중]</span>`;
  }

  function build(info) {
    const b = Object.assign({}, DEFAULTS, info || {});
    const phone = (b.phone && b.phone.trim()) ? ' · 고객센터 ' + esc(b.phone) : '';
    return `
    <footer class="site-footer">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
        <a href="terms.html">이용약관</a>
        <a href="privacy.html"><strong>개인정보처리방침</strong></a>
        <a href="refund.html">환불·청약철회</a>
        <a href="changelog.html">업데이트 소식</a>
        <a href="status.html">서비스 상태</a>
      </div>
      <div style="font-size:12px;color:var(--muted);line-height:1.8;">
        상호 ${esc(b.company)} · 대표 ${esc(b.ceo)} · 사업자등록번호 ${soft(b.bizNo, '사업자등록번호')}<br>
        통신판매업신고 ${soft(b.mailOrderNo, '통신판매업 신고번호')} · 주소 ${soft(b.address, '주소')}<br>
        고객문의 ${soft(b.email, '고객문의 이메일')}${phone}
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--muted);">© 2026 DocFinder · 개인 포트폴리오 프로젝트</div>
    </footer>`;
  }

  function mount(html) {
    const slot = document.getElementById('legalFooter');
    if (slot) slot.outerHTML = html;
    else document.body.insertAdjacentHTML('beforeend', html);
  }

  function go() {
    fetch('/api/public-config')
      .then(r => r.ok ? r.json() : null)
      .then(d => mount(build(d && d.business)))
      .catch(() => mount(build(null)));   // 설정 못 받아도 플레이스홀더 푸터는 뜬다
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
