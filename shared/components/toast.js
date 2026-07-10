// shared/components/toast.js
// 우측 하단에 잠깐 떴다 사라지는 알림. 라이브러리 없이 직접 구현.
// 사용법: Toast.show('메시지'), Toast.show('완료!', { variant:'success', duration:4000 })
(function(){
  let container;
  function ensureContainer(){
    if(container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  function show(message, opts){
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'toast' + (opts.variant ? ' ' + opts.variant : '');
    el.textContent = message;
    ensureContainer().appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));

    const duration = opts.duration || 3200;
    setTimeout(()=>{
      el.classList.remove('show');
      el.addEventListener('transitionend', ()=>el.remove(), { once:true });
    }, duration);
  }

  window.Toast = { show };
})();
