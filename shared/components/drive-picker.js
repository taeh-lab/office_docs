// shared/components/drive-picker.js
// ─────────────────────────────────────────────────────────────
// 구글 드라이브 연동 (Google Picker + Drive API, drive.readonly 스코프).
//
// · 두 가지 방식 제공:
//   - open()        : Picker로 문서를 "직접 골라" 불러오기(수동)
//   - listRecent()  : "최근 바뀐 문서"를 자동으로 찾아 목록으로 반환(자동 수집)
//   - downloadPicked(): 고른/찾은 문서들을 File로 내려받기
// · 스코프는 drive.readonly — 자동 수집(목록 조회)에는 드라이브 읽기 권한이 필요하기 때문.
//   대신 내려받은 문서 "내용"은 File로 감싸 tool.html의 기존 파싱/OCR/검색 파이프라인에서
//   브라우저 안에서만 처리된다 → 문서 본문은 서버로 나가지 않는다.
// · Google Docs/Sheets 같은 네이티브 문서는 PDF/xlsx로 export해서 가져온다.
// · GOOGLE_CLIENT_ID / GOOGLE_API_KEY 가 설정 안 돼 있으면 조용히 비활성(isConfigured=false).
//   스크립트 로드 실패·인증 취소도 예외로 처리 → 앱은 절대 안 죽는다(폴백 원칙).
//
// 사용법:
//   if(DrivePicker.isConfigured()) { ... 버튼 활성 ... }
//   DrivePicker.open(files => addFiles(files), err => showError(err));
//   const docs = await DrivePicker.listRecent(sinceIso);
//   const { files } = await DrivePicker.downloadPicked(selectedDocs);
// ─────────────────────────────────────────────────────────────
(function(){
  // 자동 수집(목록 조회)에는 파일 목록을 볼 수 있어야 해서 readonly가 필요하다.
  // (drive.file은 앱이 직접 연 파일만 보여서 "최근 바뀐 문서 훑기"가 불가능)
  var SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
  var loaded = { gis:false, gapi:false, picker:false };
  var tokenClient = null, accessToken = null;

  // config.js는 const로 선언해 window 속성이 아니지만, 같은 클래식 스크립트 전역 스코프라
  // 전역 식별자로 직접 읽을 수 있다. (typeof 가드로 미정의여도 안전)
  function cfg(name){
    try {
      if(name === 'GOOGLE_CLIENT_ID') return (typeof GOOGLE_CLIENT_ID !== 'undefined') ? GOOGLE_CLIENT_ID : undefined;
      if(name === 'GOOGLE_API_KEY')   return (typeof GOOGLE_API_KEY   !== 'undefined') ? GOOGLE_API_KEY   : undefined;
    } catch(e){}
    return undefined;
  }

  function isConfigured(){
    var cid = cfg('GOOGLE_CLIENT_ID'), key = cfg('GOOGLE_API_KEY');
    return !!cid && cid.indexOf('YOUR_') !== 0 &&
           !!key && key.indexOf('YOUR_') !== 0;
  }

  function loadScript(src){
    return new Promise(function(res, rej){
      var exists = Array.prototype.some.call(document.scripts, function(s){ return s.src === src; });
      if(exists){ res(); return; }
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function(){ res(); };
      s.onerror = function(){ rej(new Error('스크립트 로드 실패: ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function ensureLibs(){
    if(!loaded.gis){ await loadScript('https://accounts.google.com/gsi/client'); loaded.gis = true; }
    if(!loaded.gapi){ await loadScript('https://apis.google.com/js/api.js'); loaded.gapi = true; }
    if(!loaded.picker){
      await new Promise(function(res, rej){
        try { gapi.load('picker', { callback: res, onerror: function(){ rej(new Error('Picker 로드 실패')); } }); }
        catch(e){ rej(e); }
      });
      loaded.picker = true;
    }
  }

  // GIS 토큰 클라이언트로 access token 발급.
  // 로그인(신원)과 드라이브 권한(scope)은 구글에서 별개 흐름이라, 로그인해도 드라이브는 따로 인가받아야 한다.
  // 마찰 최소화: (1) 로그인한 계정으로 바로(hint → 계정 선택 스킵) (2) 이전에 허용했으면 팝업 없이 조용히(prompt:'')
  // → 최초 1회만 "드라이브 접근 허용"이 뜨고, 그 뒤 세션은 로그인만 하면 드라이브가 바로 열린다.
  function getToken(){
    return new Promise(function(res, rej){
      var hint = '';
      try { if(typeof getUser === 'function'){ var u = getUser(); hint = (u && u.email) || ''; } } catch(e){}

      if(!tokenClient){
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: cfg('GOOGLE_CLIENT_ID'),
          scope: SCOPE,
          callback: function(){},
          error_callback: function(){}
        });
      }

      var triedConsent = false;
      function attempt(prompt){
        var opts = { prompt: prompt };
        if(hint) opts.hint = hint;   // 로그인한 계정으로 바로 (계정 선택 스킵)
        tokenClient.requestAccessToken(opts);
      }
      tokenClient.callback = function(resp){
        if(resp && resp.access_token){ accessToken = resp.access_token; res(accessToken); }
        else if(!triedConsent){ triedConsent = true; attempt('consent'); }
        else rej(new Error('토큰 발급 실패'));
      };
      tokenClient.error_callback = function(err){
        var t = (err && (err.type || err.message)) || '';
        if(/closed|cancel|dismiss/i.test(t)){ rej(new Error('__CANCELLED__')); return; }
        // 조용히 시도했다가 동의가 필요해서 막힌 경우 → 동의 팝업으로 한 번 더
        if(!triedConsent){ triedConsent = true; attempt('consent'); return; }
        rej(new Error((err && err.message) || '드라이브 인증 실패'));
      };

      attempt('');   // 우선 팝업 없이 조용히 시도 (이전에 허용했으면 그대로 통과)
    });
  }

  // Picker 띄우고 고른 문서 배열 반환
  function showPicker(token){
    return new Promise(function(res){
      var supported = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // .xlsx
        'application/vnd.ms-excel',
        'text/csv', 'text/plain',
        'application/vnd.google-apps.document',    // Google 문서
        'application/vnd.google-apps.spreadsheet'  // Google 스프레드시트
      ].join(',');

      var view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false)
        .setMimeTypes(supported);

      var builder = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setOAuthToken(token)
        .setDeveloperKey(cfg('GOOGLE_API_KEY'))
        .addView(view)
        .setTitle('불러올 문서 선택 (여러 개 가능)')
        .setCallback(function(data){
          var A = google.picker.Action;
          if(data.action === A.PICKED) res(data.docs || []);
          else if(data.action === A.CANCEL) res([]);
        });

      // appId(프로젝트 번호)는 client_id 앞부분. drive.file 스코프에서 권장됨.
      try {
        var appId = String(cfg('GOOGLE_CLIENT_ID')).split('-')[0];
        if(appId) builder.setAppId(appId);
      } catch(e){}

      builder.build().setVisible(true);
    });
  }

  // Google 네이티브 문서는 export, 그 외는 alt=media 로 원본 다운로드
  var EXPORT = {
    'application/vnd.google-apps.document':    { mime:'application/pdf', ext:'.pdf' },
    'application/vnd.google-apps.spreadsheet': { mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext:'.xlsx' }
  };
  function ensureExt(name, ext){
    return name.toLowerCase().slice(-ext.length) === ext ? name : (name + ext);
  }
  async function downloadDoc(doc, token){
    var id = doc.id, name = doc.name || 'drive-file', mt = doc.mimeType || '';
    var url, outName, outType;
    if(EXPORT[mt]){
      url = 'https://www.googleapis.com/drive/v3/files/' + id + '/export?mimeType=' + encodeURIComponent(EXPORT[mt].mime);
      outName = ensureExt(name, EXPORT[mt].ext);
      outType = EXPORT[mt].mime;
    } else {
      url = 'https://www.googleapis.com/drive/v3/files/' + id + '?alt=media';
      outName = name;
      outType = mt;
    }
    var r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if(!r.ok) throw new Error('다운로드 실패: ' + name + ' (' + r.status + ')');
    var buf = await r.arrayBuffer();
    return new File([buf], outName, { type: outType });
  }

  // 공개 API: 드라이브에서 문서 골라 File[] 로 onFiles 콜백. 실패는 onError로.
  async function open(onFiles, onError){
    try{
      if(!isConfigured()){ throw new Error('드라이브 연결이 아직 설정되지 않았습니다. (SETUP-TODO.md 5번 참고)'); }
      await ensureLibs();
      var token = await getToken();
      var docs = await showPicker(token);
      if(!docs.length){ if(onFiles) onFiles([]); return; }

      var files = [], errors = [];
      for(var i=0;i<docs.length;i++){
        try { files.push(await downloadDoc(docs[i], token)); }
        catch(e){ console.error(e); errors.push(e); }
      }
      if(onFiles) onFiles(files);
      if(errors.length && onError) onError(new Error(errors.length + '개 문서를 불러오지 못했습니다.'));
    }catch(e){
      // 사용자가 창을 닫은 취소(__CANCELLED__)는 정상 행동이라 콘솔 에러로 남기지 않는다
      if(!(e && e.message === '__CANCELLED__')) console.error('DrivePicker', e);
      if(onError) onError(e);
    }
  }

  // ── 자동 수집: 최근 바뀐 문서 목록 조회 ──
  // sinceIso 이후 수정된, 지원 형식의 문서를 최신순으로 반환. (drive.readonly 필요)
  async function listRecent(sinceIso){
    if(!isConfigured()) throw new Error('드라이브 연결이 설정되지 않았습니다. (SETUP-TODO.md 5번 참고)');
    await ensureLibs();
    var token = await getToken();

    var mimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel', 'text/csv', 'text/plain',
      'application/vnd.google-apps.document', 'application/vnd.google-apps.spreadsheet'
    ];
    var mimeQ = mimes.map(function(m){ return "mimeType='" + m + "'"; }).join(' or ');
    var q = "trashed=false and modifiedTime > '" + sinceIso + "' and (" + mimeQ + ")";

    var out = [], pageToken = null, guard = 0;
    do {
      var params = new URLSearchParams({
        q: q,
        orderBy: 'modifiedTime desc',
        pageSize: '100',
        fields: 'nextPageToken, files(id,name,mimeType,modifiedTime,size)',
        spaces: 'drive'
      });
      if(pageToken) params.set('pageToken', pageToken);
      var r = await fetch('https://www.googleapis.com/drive/v3/files?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + token }
      });
      if(!r.ok) throw new Error('드라이브 목록 조회 실패 (' + r.status + ')');
      var data = await r.json();
      out = out.concat(data.files || []);
      pageToken = data.nextPageToken;
      guard++;
    } while(pageToken && guard < 5 && out.length < 300); // 폭주 방지: 최대 5페이지 / 300건
    return out;
  }

  // 고른(또는 자동 수집한) 문서들을 File[] 로 내려받기. onEach(file, err)로 진행 알림.
  async function downloadPicked(docs, onEach){
    if(!isConfigured()) throw new Error('드라이브 연결이 설정되지 않았습니다.');
    await ensureLibs();
    var token = await getToken();
    var files = [], errors = [];
    for(var i=0;i<docs.length;i++){
      try { var f = await downloadDoc(docs[i], token); files.push(f); if(onEach) onEach(f, null); }
      catch(e){ console.error(e); errors.push(e); if(onEach) onEach(null, e); }
    }
    return { files: files, errors: errors };
  }

  window.DrivePicker = {
    open: open,
    isConfigured: isConfigured,
    listRecent: listRecent,
    downloadPicked: downloadPicked
  };
})();
