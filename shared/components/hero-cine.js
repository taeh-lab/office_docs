// shared/components/hero-cine.js
// ─────────────────────────────────────────────────────────────
// 랜딩 시네마틱 히어로. 문서 카드들이 화면 가득 흩어져 있다가,
// 가운데서 단어가 타이핑되면 관련 문서의 해당 부분이 형광빛을 내며
// 가운데로 모여 정렬되고, 아래에 "바로 써보기" CTA가 떠오른다.
// 라이브러리 없이 바닐라 JS. prefers-reduced-motion이면 정적 표시.
// #scatter 해시로 열면 흩어진 상태에서 멈춘다(연출 확인용).
// ─────────────────────────────────────────────────────────────
(function(){
  const cine = document.getElementById('cine');
  if(!cine) return;
  const qEl = document.getElementById('cineQuery');
  const verdictText = document.getElementById('verdictText');
  const verdict = document.getElementById('verdict');
  const replay = document.getElementById('replay');
  if(!qEl || !verdict) return;

  // 샘플 문서 6개 — 검색어 "계약금"이 그중 3개에 걸린다
  const DOCS = [
    { tag:'PDF',  fn:'2024년_공급계약서.pdf', term:'계약금', pre:'', post:' 지급은 착수일로부터 7일', x:-360,y:-140,r:-10, gx:-780,gy:-260,gr:-24, sx:0,sy:-84, match:true },
    { tag:'DOCX', fn:'표준계약_개정본.docx',   term:'계약금', pre:'', post:' 30% 선지급 후 잔금', x:365,y:-135,r:9,  gx:820,gy:-230,gr:20,  sx:0,sy:0,   match:true },
    { tag:'PDF',  fn:'발주_계약서_final.pdf',  term:'계약금', pre:'', post:' 및 잔금 분할 지급', x:-300,y:150,r:8,  gx:-760,gy:320,gr:18,  sx:0,sy:84,  match:true },
    { tag:'XLSX', fn:'견적서_3분기.xlsx',       term:'단가',   pre:'', post:' 45,000원 / 개당',   x:360,y:150,r:-9, gx:840,gy:300,gr:-22, sx:0,sy:0,   match:false },
    { tag:'TXT',  fn:'회의록_0521.txt',          term:'',       pre:'일정 협의 및 담당자 배정', post:'', x:-285,y:-190,r:13, gx:-560,gy:-460,gr:26, sx:0,sy:0, match:false },
    { tag:'XLSX', fn:'품목명세_초안.xlsx',        term:'',       pre:'수량 · 규격 · 비고 정리', post:'', x:150,y:255,r:-12, gx:560,gy:520,gr:-26, sx:0,sy:0, match:false },
  ];
  const QUERY = '계약금';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s){ return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

  // 카드 DOM 생성 (verdict 앞에 삽입)
  DOCS.forEach(d=>{
    const el = document.createElement('div');
    el.className = 'doc';
    el.style.cssText = `--x:${d.x}px;--y:${d.y}px;--r:${d.r}deg;--gx:${d.gx}px;--gy:${d.gy}px;--gr:${d.gr}deg;--sx:${d.sx}px;--sy:${d.sy}px`;
    const line = d.term
      ? `<div class="tl">${esc(d.pre)}<mark>${esc(d.term)}</mark>${esc(d.post)}</div>`
      : `<div class="tl">${esc(d.pre)}${esc(d.post)}</div>`;
    el.innerHTML =
      `<div class="dh"><span class="chip">${d.tag}</span><span class="fn">${esc(d.fn)}</span></div>
       <span class="ln m"></span>
       ${line}
       <span class="ln s"></span>`;
    d.el = el;
    cine.insertBefore(el, verdict);
  });

  const matchCount = DOCS.filter(d=>d.match).length;
  if(verdictText) verdictText.textContent = `${matchCount}개 문서에서 찾음`;

  const T = [];
  function at(ms, fn){ T.push(setTimeout(fn, ms)); }
  function clearAll(){ T.forEach(clearTimeout); T.length = 0; }

  function typeQuery(word, cb){
    if(reduced){ qEl.textContent = word; cb && cb(); return; }
    qEl.textContent = '';
    let i = 0;
    const id = setInterval(()=>{
      qEl.textContent = word.slice(0, ++i);
      if(i >= word.length){ clearInterval(id); cb && cb(); }
    }, 105);
    T.push(()=>clearInterval(id));
  }

  function reset(){
    clearAll();
    cine.classList.remove('in','float','gathered');
    DOCS.forEach(d=>d.el.classList.remove('hit','dim','gone'));
    qEl.textContent = '';
  }

  function play(){
    reset();
    at(60,  ()=>cine.classList.add('in'));      // 흩어진 카드 등장
    at(900, ()=>cine.classList.add('float'));   // 부유

    // 흩어진 상태에서 멈추는 디버그 모드
    if(location.hash.indexOf('scatter') >= 0) return;

    at(reduced ? 200 : 1500, ()=>typeQuery(QUERY, ()=>{
      at(reduced ? 0 : 350, ()=>{               // 형광빛 / 흐려짐
        cine.classList.remove('float');
        DOCS.forEach((d,i)=> at(i*90, ()=> d.el.classList.add(d.match ? 'hit' : 'dim')));
      });
      at(reduced ? 200 : 1250, ()=>{            // 수렴 + 정리 + CTA
        DOCS.forEach(d=>{ if(!d.match) d.el.classList.add('gone'); });
        cine.classList.add('gathered');
      });
    }));
    // 한 번 재생 후 정렬된 상태로 멈춘다.
  }

  if(replay) replay.addEventListener('click', play);
  play();
})();
