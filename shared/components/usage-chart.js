// shared/components/usage-chart.js
// 일별 검색 사용량 막대 차트 — 라이브러리 없이 순수 SVG로 직접 구현.
// 단일 시리즈(내 검색 횟수)라 accent 색 하나만 쓰고 범례는 없음(카드 제목이 대신함).
// data: [{day:1, count:3}, ...] — shared/auth.js의 getUsageHistory()가 만들어줌.
function renderUsageChart(container, data, opts){
  opts = opts || {};
  const w = opts.width || 440, h = opts.height || 120;
  const padL = 3, padR = 3, padT = 6, padB = 4;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const max = Math.max(1, ...data.map(d => d.count));
  const n = Math.max(1, data.length);
  const slot = plotW / n;
  const gap = Math.min(2, slot * 0.3);
  const barW = Math.max(1, slot - gap);
  const rx = Math.min(3, barW / 2);
  const baselineY = padT + plotH;

  const bars = data.map((d, i) => {
    const bh = Math.max(1, (d.count / max) * plotH);
    const x = padL + i * slot + gap / 2;
    const y = baselineY - bh;
    return `<rect class="uchart-bar" tabindex="0" role="img"
      aria-label="${d.day}일, 검색 ${d.count}회"
      data-day="${d.day}" data-count="${d.count}"
      x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${bh.toFixed(2)}"
      rx="${rx.toFixed(2)}" ry="${rx.toFixed(2)}"></rect>`;
  }).join('');

  container.innerHTML = `
    <div class="uchart-wrap">
      <svg class="uchart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
        <line class="uchart-baseline" x1="${padL}" y1="${baselineY}" x2="${w - padR}" y2="${baselineY}"/>
        ${bars}
      </svg>
      <div class="uchart-tip" hidden></div>
    </div>`;

  const tip = container.querySelector('.uchart-tip');
  const wrap = container.querySelector('.uchart-wrap');
  container.querySelectorAll('.uchart-bar').forEach(rect => {
    const show = () => {
      tip.textContent = `${rect.dataset.day}일 · 검색 ${rect.dataset.count}회`;
      tip.hidden = false;
      const box = rect.getBoundingClientRect();
      const host = wrap.getBoundingClientRect();
      tip.style.left = (box.left - host.left + box.width / 2) + 'px';
      tip.style.top = (box.top - host.top) + 'px';
      rect.classList.add('active');
    };
    const hide = () => { tip.hidden = true; rect.classList.remove('active'); };
    rect.addEventListener('pointerenter', show);
    rect.addEventListener('pointermove', show);
    rect.addEventListener('pointerleave', hide);
    rect.addEventListener('focus', show);
    rect.addEventListener('blur', hide);
  });
}
