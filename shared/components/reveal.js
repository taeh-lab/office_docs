// shared/components/reveal.js
// ─────────────────────────────────────────────────────────────
// 스크롤하면 요소가 아래에서 부드럽게 떠오른다. IntersectionObserver, 라이브러리 없음.
// JS가 .js-reveal 클래스를 직접 붙이므로, JS가 없거나 모션 줄이기 설정이면 요소는 그냥 보인다(점진적 향상).
// ─────────────────────────────────────────────────────────────
(function(){
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced || !('IntersectionObserver' in window)) return;

  const targets = [...document.querySelectorAll(
    '.stats, .stack-strip, .features > h2, .features > .lead, .bento-cell, .flow, .roadmap .rhead, .rcard, .cta-band'
  )];
  if(!targets.length) return;

  targets.forEach(el => el.classList.add('js-reveal'));
  // 그리드 셀은 살짝 스태거를 줘서 하나씩 떠오르게
  document.querySelectorAll('.bento-cell').forEach((el, i) => { el.style.transitionDelay = (i * 70) + 'ms'; });
  document.querySelectorAll('.rcard').forEach((el, i) => { el.style.transitionDelay = ((i % 3) * 70) + 'ms'; });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => io.observe(el));
})();
