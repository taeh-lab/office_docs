// shared/components/legal-footer.js
// ─────────────────────────────────────────────────────────────
// 사업자정보 + 법적 링크(이용약관·개인정보처리방침·환불규정) 푸터.
// 전자상거래법 표시의무: 이 정보를 사이트에서 볼 수 있어야 함.
//
// ★ 값은 아래 BUSINESS_INFO 한 곳만 채우면 모든 페이지에 반영된다.
//   [ ] 로 표시된 자리는 라이브 전에 사업자등록증/정부24 조회로 채울 것(SETUP-TODO 10번).
//   페이지에 <div id="legalFooter"></div> 를 두고 이 스크립트를 로드하면 그 자리에 렌더된다.
//   (mount 없으면 body 끝에 자동 추가)
// ─────────────────────────────────────────────────────────────
(function () {
  const BUSINESS_INFO = {
    company:     'citidel (시타델)',
    ceo:         '윤태훈',
    bizNo:       '[사업자등록번호 — 사업자등록증 참고]',
    mailOrderNo: '[통신판매업 신고번호 — 정부24/공정위 조회]',
    address:     '[사업장 주소 — 사업자등록증 소재지]',
    email:       '[고객문의 이메일]',
    phone:       '',   // 있으면 '· 고객센터 000-0000-0000'
  };

  const b = BUSINESS_INFO;
  const phone = b.phone ? ' · ' + b.phone : '';
  const html = `
  <footer class="site-footer">
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
      <a href="terms.html">이용약관</a>
      <a href="privacy.html"><strong>개인정보처리방침</strong></a>
      <a href="refund.html">환불·청약철회</a>
      <a href="changelog.html">업데이트 소식</a>
      <a href="status.html">서비스 상태</a>
    </div>
    <div style="font-size:12px;color:var(--muted);line-height:1.8;">
      상호 ${b.company} · 대표 ${b.ceo} · 사업자등록번호 ${b.bizNo}<br>
      통신판매업신고 ${b.mailOrderNo} · 주소 ${b.address}<br>
      고객문의 ${b.email}${phone}
    </div>
    <div style="margin-top:12px;font-size:12px;color:var(--muted);">© 2026 DocFinder · 개인 포트폴리오 프로젝트</div>
  </footer>`;

  function mount() {
    const slot = document.getElementById('legalFooter');
    if (slot) slot.outerHTML = html;
    else document.body.insertAdjacentHTML('beforeend', html);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
