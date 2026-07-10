// shared/components/theme-toggle.js
// 다크모드 수동 토글. localStorage에 선택을 저장하고 <html data-theme="dark|light">를 세팅한다.
// 아무 선택도 안 했으면 OS 설정(prefers-color-scheme)을 그대로 따른다(shared/theme.css가 처리).
//
// FOUC(테마 깜빡임) 방지를 위해 이 스크립트는 <head>에서 최대한 일찍 실행되도록
// 각 페이지에 배치한다 — body가 그려지기 전에 data-theme을 미리 세팅해야 깜빡임이 없다.
(function(){
  const KEY = 'dwf_theme'; // 'light' | 'dark' | 없음(=시스템 따름)

  function saved(){ return localStorage.getItem(KEY); }

  function apply(theme){
    if(theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
  }

  function isDarkNow(){
    const s = saved();
    if(s === 'dark') return true;
    if(s === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function toggle(){
    const next = isDarkNow() ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
    updateButtons();
  }

  function updateButtons(){
    const dark = isDarkNow();
    document.querySelectorAll('.theme-toggle').forEach(btn=>{
      const icon = dark ? 'i-sun' : 'i-moon';
      const label = dark ? '라이트 모드' : '다크 모드';
      btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#'+icon+'"></use></svg>'+label;
    });
  }

  apply(saved()); // body 렌더 전에 즉시 적용

  // 다른 same-origin 문서(특히 대시보드에 embed된 tool.html iframe)에서 테마가 바뀌면
  // 여기로 storage 이벤트가 온다 — 부모가 토글하면 iframe도 실시간으로 따라간다.
  // (storage 이벤트는 값을 바꾼 당사자 문서엔 안 오고, 나머지 same-origin 문서에만 온다)
  window.addEventListener('storage', function(e){
    if(e.key === KEY){ apply(saved()); updateButtons(); }
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    updateButtons();
    document.querySelectorAll('.theme-toggle').forEach(btn=>btn.addEventListener('click', toggle));
    if(window.CommandPalette){
      CommandPalette.register([{ label:'다크모드 전환', hint:'테마', action: toggle }]);
    }
  });

  window.ThemeToggle = { toggle, isDarkNow };
})();
