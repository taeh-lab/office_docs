// shared/components/command-palette.js
// ─────────────────────────────────────────────────────────────
// Cmd/Ctrl+K로 여는 커맨드 팔레트. 외부 라이브러리 없이 직접 구현.
//
// 사용법:
//   - shared/auth.js 다음에 이 스크립트를 불러오면 Cmd/Ctrl+K로 어디서든 열림
//   - CommandPalette.open() / .close() 로 버튼 클릭 등에서도 열 수 있음
//   - CommandPalette.register([{label, hint, action}, ...]) 로 페이지별 명령 추가 가능
//     (예: 대시보드에서 "다크모드 전환", "리포트 예약" 같은 페이지 전용 명령)
// ─────────────────────────────────────────────────────────────
(function(){
  const extraCommands = [];

  function baseCommands(){
    const u = typeof getUser === 'function' ? getUser() : null;
    const list = [];
    if(u){
      list.push(
        { label:'대시보드로 이동', hint:'문서 검색 도구', action:()=>location.href='dashboard.html' },
        { label:'요금제 보기', hint:'플랜 업그레이드/변경', action:()=>location.href='pricing.html' },
        { label:'로그아웃', hint:u.email, action:()=>{ if(typeof logout==='function') logout(); } }
      );
    } else {
      list.push(
        { label:'로그인', hint:'', action:()=>location.href='login.html' },
        { label:'무료로 시작하기', hint:'회원가입', action:()=>location.href='signup.html' },
        { label:'요금제 보기', hint:'', action:()=>location.href='pricing.html' }
      );
    }
    list.push(
      { label:'홈으로', hint:'랜딩페이지', action:()=>location.href='index.html' },
      { label:'업데이트 소식', hint:'체인지로그', action:()=>location.href='changelog.html' },
      { label:'서비스 상태', hint:'상태 페이지', action:()=>location.href='status.html' },
    );
    return list;
  }

  function allCommands(){ return [...baseCommands(), ...extraCommands]; }

  let overlay, input, listEl, activeIndex = 0, filtered = [];

  function build(){
    overlay = document.createElement('div');
    overlay.className = 'cmdk-overlay';
    overlay.innerHTML = `
      <div class="cmdk-box" role="dialog" aria-modal="true" aria-label="커맨드 팔레트">
        <input class="cmdk-input" type="text" placeholder="명령 검색 또는 이동할 페이지 입력…" autocomplete="off">
        <div class="cmdk-list"></div>
        <div class="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd>이동</span>
          <span><kbd>Enter</kbd>실행</span>
          <span><kbd>Esc</kbd>닫기</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    input = overlay.querySelector('.cmdk-input');
    listEl = overlay.querySelector('.cmdk-list');

    overlay.addEventListener('click', e=>{ if(e.target === overlay) close(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', onKey);
  }

  function render(){
    const q = input.value.trim().toLowerCase();
    filtered = allCommands().filter(c =>
      !q || c.label.toLowerCase().includes(q) || (c.hint||'').toLowerCase().includes(q)
    );
    activeIndex = 0;
    listEl.innerHTML = filtered.length
      ? filtered.map((c,i)=>`
          <button type="button" class="cmdk-item${i===0?' active':''}" data-i="${i}">
            <span>${c.label}</span>${c.hint ? `<span class="cmdk-hint">${c.hint}</span>` : ''}
          </button>`).join('')
      : `<div class="cmdk-empty">일치하는 명령이 없어요</div>`;
    [...listEl.querySelectorAll('.cmdk-item')].forEach(el=>{
      el.addEventListener('click', ()=>run(+el.dataset.i));
      el.addEventListener('mouseenter', ()=>{ activeIndex = +el.dataset.i; highlight(); });
    });
  }

  function highlight(){
    [...listEl.querySelectorAll('.cmdk-item')].forEach((el,i)=>el.classList.toggle('active', i===activeIndex));
    const activeEl = listEl.querySelector('.cmdk-item.active');
    if(activeEl) activeEl.scrollIntoView({block:'nearest'});
  }

  function run(i){
    const cmd = filtered[i];
    if(!cmd) return;
    close();
    cmd.action();
  }

  function onKey(e){
    if(e.key === 'ArrowDown'){ e.preventDefault(); activeIndex = Math.min(activeIndex+1, filtered.length-1); highlight(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); activeIndex = Math.max(activeIndex-1, 0); highlight(); }
    else if(e.key === 'Enter'){ e.preventDefault(); run(activeIndex); }
    else if(e.key === 'Escape'){ close(); }
  }

  function open(){
    if(!overlay) build();
    overlay.classList.add('show');
    input.value = '';
    render();
    setTimeout(()=>input.focus(), 0);
  }
  function close(){
    if(overlay) overlay.classList.remove('show');
  }

  document.addEventListener('keydown', e=>{
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      (overlay && overlay.classList.contains('show')) ? close() : open();
    }
  });

  window.CommandPalette = {
    open, close,
    register(cmds){ extraCommands.push(...(Array.isArray(cmds) ? cmds : [cmds])); }
  };
})();
