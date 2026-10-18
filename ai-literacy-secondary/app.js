'use strict';
(function(){
  const S = window.SITE;
  if(!S){document.body.innerHTML='<p>內容載入失敗。</p>';return;}
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = S.storageKey;

  function fresh(){
    return {
      version:1, view:'home', lesson:0, game:null,
      lessons: S.lessons.map(()=>({answer:null, correct:false, done:false})),
      games: {},
      challenge: {answers:{}, score:null, rank:null, done:false},
      shortNotes: {}
    };
  }
  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return fresh();
      const x = JSON.parse(raw);
      if(!x || x.version!==1 || !Array.isArray(x.lessons) || x.lessons.length!==S.lessons.length) return fresh();
      const n = fresh();
      n.view = S.tabs.some(t=>t.id===x.view)?x.view:'home';
      n.lesson = Number.isInteger(x.lesson)&&x.lesson>=0&&x.lesson<S.lessons.length?x.lesson:0;
      n.lessons = x.lessons.map((r,i)=>({
        answer: (r.answer===null||Number.isInteger(r.answer))?r.answer:null,
        correct: r.correct===true,
        done: r.done===true && r.correct===true && r.answer===S.lessons[i].answer
      }));
      n.games = (x.games && typeof x.games==='object')?x.games:{};
      n.challenge = Object.assign(n.challenge, x.challenge||{});
      n.shortNotes = (x.shortNotes && typeof x.shortNotes==='object')?x.shortNotes:{};
      return n;
    }catch{return fresh();}
  }
  let state = load();
  let toastTimer;
  function toast(msg){
    const t=$('#toast'); t.textContent=msg;
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.textContent='',4000);
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(state)); }
    catch{ toast('無法儲存進度，請匯出備份。'); }
  }
  function download(name, text, type='text/plain'){
    const url=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement('a'); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),800);
  }
  function progressPct(){
    const L = state.lessons.filter(r=>r.done).length;
    const G = S.games.filter(g=>state.games[g.id]&&state.games[g.id].done).length;
    const C = state.challenge.done?1:0;
    const total = S.lessons.length + S.games.length + 1;
    const done = L + G + C;
    return {done, total, pct: Math.round(done/total*100), L, G, C};
  }
  function renderTabs(){
    $('#main-tabs').innerHTML = S.tabs.map(t=>
      '<button type="button" data-view="'+t.id+'" '+(state.view===t.id?'aria-current="page"':'')+'>'+esc(t.label)+'</button>'
    ).join('');
  }
  function renderSide(){
    const p = progressPct();
    $('#progress-text').textContent = p.pct + '%';
    $('#progress').value = p.pct;
    let html = '<h3>關卡</h3>';
    html += S.lessons.map((l,i)=>
      '<button type="button" data-go-lesson="'+i+'" '+(state.view==='learn'&&state.lesson===i?'aria-current="true"':'')+'><span>'+(state.lessons[i].done?'✓':String(i+1).padStart(2,'0'))+'</span>'+esc(l.title)+'</button>'
    ).join('');
    html += '<h3>遊戲</h3>';
    html += S.games.map(g=>
      '<button type="button" data-go-game="'+esc(g.id)+'"><span>'+(state.games[g.id]&&state.games[g.id].done?'✓':'○')+'</span>'+esc(g.title)+'</button>'
    ).join('');
    html += '<h3>挑戰</h3><button type="button" data-view-jump="challenge"><span>'+(state.challenge.done?'✓':'★')+'</span>總結大挑戰</button>';
    $('#side-nav').innerHTML = html;
  }
  function caseHTML(c){
    if(!c) return '';
    const region = c.region ? ' · '+esc(c.region) : '';
    return '<div class="case-card"><span class="tag">真實世界 · '+esc(c.id)+'</span>'+
      '<strong>'+esc(c.title)+'</strong>'+
      '<p class="fine">'+esc(c.source)+' · '+esc(c.date)+region+'</p>'+
      '<p>'+esc(c.note||'')+'</p>'+
      (c.url?'<p><a href="'+esc(c.url)+'" target="_blank" rel="noopener">來源連結 ↗</a></p>':'')+
      '</div>';
  }

  function renderHome(){
    const p = progressPct();
    const whyP = '澳門科學館與教青局推動同學認識 AI。這裡用生活場景練習：查證語音、問同意、誠實做功課、管好短影音時間。';
    const whyS = '對接教青局 AI 專題課時建議（初中／高中每學年不少於 10 課時）與科學館學生科技教育計劃。練習辨識深偽、學術誠信、私隱同意與版權。';
    const fourth = S.kind==='primary'?'parents':'resources';
    const fourthLabel = S.kind==='primary'?'給家長／老師':'案例資源';
    return '<section class="mast"><div>'+
      '<p class="eyebrow">'+esc(S.audience)+' · 互動學習站</p>'+
      '<h1>'+esc(S.title)+'<br><em>'+esc(S.subtitle)+'</em></h1>'+
      '<p>'+(S.kind==='primary'?whyP:whyS)+'</p></div>'+
      '<div class="mast-stats">'+
      '<span><b>'+S.lessons.length+'</b>學習關卡</span>'+
      '<span><b>'+S.games.length+'</b>互動遊戲</span>'+
      '<span><b>1</b>總結挑戰</span>'+
      '<span><b>'+p.pct+'%</b>目前進度</span></div></section>'+
      '<div class="home-grid">'+
      '<a class="home-tile" href="#" data-view-jump="learn"><strong>① 學習關卡</strong><span class="muted">短說明 → 情境 → 選擇 → 真實案例卡</span></a>'+
      '<a class="home-tile" href="#" data-view-jump="games"><strong>② 互動遊戲</strong><span class="muted">本地規則，不連線真實 AI</span></a>'+
      '<a class="home-tile" href="#" data-view-jump="challenge"><strong>③ 總結大挑戰</strong><span class="muted">綜合評分與可複製結果</span></a>'+
      '<a class="home-tile" href="#" data-view-jump="'+fourth+'"><strong>④ '+fourthLabel+'</strong><span class="muted">查證日期 2026-10-18</span></a>'+
      '</div>'+
      '<div class="card" style="margin-top:16px"><p class="eyebrow">為什麼要學？</p>'+
      '<p>教青局課程指引把人工智能納入資訊科技科（C04）；並與澳門科學館推行學生科技教育普及計劃（C05）。本站用<strong>已查證真實案例</strong>，不捏造新聞。</p>'+
      '<p class="fine">操作：左側可跳關；上方切換分區。匯出進度可備份到檔案。</p></div>';
  }

  function renderLesson(){
    const i = state.lesson, L = S.lessons[i], r = state.lessons[i];
    const opts = L.options.map((o,j)=>
      '<label class="choice"><input type="radio" name="ans" value="'+j+'" '+(r.answer===j?'checked':'')+'><span>'+esc(o)+'</span></label>'
    ).join('');
    let fb = '';
    if(r.answer!==null){
      const ok = r.answer===L.answer;
      fb = '<div class="feedback '+(ok?'ok':'bad')+'" role="status">'+(ok?'做得好！ ':'再想想。 ')+esc(L.why)+'</div>';
    }
    const note = state.shortNotes[L.id]||'';
    const shortBlock = S.kind==='secondary' ?
      '<div class="short-ans card" style="border-style:dashed"><label>短答筆記（只存本機，選填）<textarea id="short-note" maxlength="2000" placeholder="例如：我們班可以怎麼寫 AI 使用聲明？">'+esc(note)+'</textarea></label></div>' : '';
    return '<div class="lesson-top"><div>'+
      '<p class="eyebrow">第 '+(i+1)+' / '+S.lessons.length+' 關 · '+esc(L.scene)+'</p>'+
      '<h2>'+esc(L.title)+'</h2></div>'+
      '<div class="actions">'+
      '<button type="button" id="prev-l" '+(i===0?'disabled':'')+'>← 上一關</button>'+
      '<button type="button" id="next-l" '+(i===S.lessons.length-1?'disabled':'')+'>下一關 →</button>'+
      '</div></div>'+
      '<div class="card"><p>'+esc(L.intro)+'</p>'+
      '<div class="story"><strong>情境</strong><br>'+esc(L.story)+'</div>'+
      '<div class="qbox"><fieldset><legend>'+esc(L.q)+'</legend>'+opts+'</fieldset>'+
      '<p style="margin-top:12px"><button type="button" class="primary" id="check-ans">看看回饋</button> '+
      (r.done?'<button type="button" id="mark-done" disabled>本關已完成 ✓</button>':'<button type="button" id="mark-done">完成本關</button>')+
      '</p>'+fb+'</div>'+caseHTML(L.case)+'</div>'+shortBlock;
  }

  function ensureGame(id){
    if(!state.games[id]) state.games[id]={step:0,done:false,score:0,picks:{}};
    return state.games[id];
  }

  function gameVoice(){
    const g = ensureGame('g_voice');
    const items = S.kind==='primary' ? [
      {t:'語音：「我是校長，十分鐘內轉 $500 到這個帳戶。」', ans:1, opts:['立刻轉','先打給學校／家長查證','把帳戶轉給同學一起轉']},
      {t:'語音：「我是媽媽，把手機驗證碼讀給我。」（但媽媽在隔壁屋）', ans:1, opts:['讀出驗證碼','走到隔壁親口問媽媽','在群組公開驗證碼']},
      {t:'文字：「老師叫大家點這個短連結交功課。」連結很奇怪。', ans:1, opts:['先點再說','用學校平常渠道確認','轉發連結到所有班群']}
    ] : [
      {t:'社團群語音：很像顧問老師，索取活動經費「先墊付再報銷」的個人轉帳。', ans:1, opts:['先轉帳','向真老師用另一渠道確認，並走正式報銷','在群裡公開銀行卡']},
      {t:'電競語音：假冒隊長索取帳號二次驗證碼。', ans:1, opts:['貼上代碼','密語／私訊真隊長確認','嘲笑後仍給碼']}
    ];
    if(g.step>=items.length){
      g.done=true; save();
      return '<div class="card"><h2>偵探任務完成</h2><p class="score-big">'+g.score+' / '+items.length+'</p>'+
        '<p>記住：<strong>眼見耳聽未必為實</strong>。澳門已有 AI 深偽騙案（C01／C02）。</p>'+
        '<button type="button" class="primary" data-view-jump="games">回遊戲區</button></div>';
    }
    const it=items[g.step];
    g._ans = it.ans;
    return '<div class="card"><p class="eyebrow">真假語音偵探 · '+(g.step+1)+'/'+items.length+'</p>'+
      '<h2>'+esc(it.t)+'</h2><div class="qbox">'+
      it.opts.map((o,j)=>'<button type="button" data-voice="'+j+'" style="display:block;width:100%;margin:8px 0;text-align:left">'+esc(o)+'</button>').join('')+
      '</div><p class="fine">已得分：'+g.score+'</p></div>';
  }

  function gamePhoto(){
    const g = ensureGame('g_photo');
    const classmates = [
      {name:'小明', agree:true},{name:'小美', agree:false},{name:'小東', agree:true},{name:'小玲', agree:false}
    ];
    const selected = g.picks.sel || [];
    return '<div class="card"><p class="eyebrow">同意發相</p><h2>班遊合照要發到公開平台</h2>'+
      '<p>只有<strong>同意</strong>的同學可以出現在公開相。點選你認為可以公開的名字，再提交。</p>'+
      '<div class="traffic">'+classmates.map((c,i)=>
        '<button type="button" data-photo="'+i+'" aria-pressed="'+(selected.includes(i)?'true':'false')+'">'+esc(c.name)+' '+(c.agree?'（已說可以）':'（未同意）')+'</button>'
      ).join('')+'</div>'+
      '<button type="button" class="primary" id="photo-submit">提交</button><div id="photo-fb"></div>'+
      '<div class="case-card" style="margin-top:14px"><span class="tag">真實世界 · C14</span>'+
      '<p>香港私隱公署（2025-12-17）提醒：慎發子女／同學清晰人臉照片，以防被濫用作深偽素材。地區：香港（鄰近）。</p></div></div>';
  }

  function gameBrake(){
    const g = ensureGame('g_brake');
    const clips = g.picks.clips||0;
    const limit = 5;
    return '<div class="card"><p class="eyebrow">短影音剎車</p><h2>推薦一直推「再睇一條」</h2>'+
      '<p>你設定今天只睇 <strong>'+limit+'</strong> 條溫習休息短片。現在已睇 <strong>'+clips+'</strong> 條。</p>'+
      '<div class="brake-meter"><span style="width:'+Math.min(100,clips/limit*100)+'%"></span></div>'+
      '<div class="actions">'+
      '<button type="button" id="brake-more" '+(clips>=limit?'disabled':'')+'>再睇一條</button>'+
      '<button type="button" class="primary" id="brake-stop">時間到，放下！</button></div>'+
      '<div id="brake-fb"></div>'+
      '<p class="fine">對接研究 C11（香港學生樣本，2025-08-22）與課程「我與短視頻」概念（C04）。澳門本地大型統計待查證。</p></div>';
  }

  function gameHW(){
    const g = ensureGame('g_hw');
    const items = [
      {t:'老師說可以用 AI 查難字，你查完自己造句。', light:'green', why:'綠燈：在准許範圍，自己完成。'},
      {t:'整篇作文叫 AI 寫，明天要交，還沒問老師。', light:'red', why:'紅燈：未獲許可的代寫。'},
      {t:'用 AI 改文法，準備在功課寫「AI 協助潤飾」，老師曾說過可以。', light:'yellow', why:'黃燈：要標註，並確認校本／老師規則。'},
      {t:'把聊天記錄裡同學私隱貼進 AI 問「幫我回覆」。', light:'red', why:'紅燈：勿把他人私隱貼進工具。'}
    ];
    if(g.step>=items.length){
      g.done=true; save();
      return '<div class="card"><h2>紅綠燈完成</h2><p class="score-big">'+g.score+'/'+items.length+'</p>'+
        '<p>對接教青局建議（C03）：許可、誠信、私隱。</p>'+
        '<button type="button" class="primary" data-view-jump="games">回遊戲區</button></div>';
    }
    const it=items[g.step];
    g._light = it.light; g._why = it.why;
    return '<div class="card"><p class="eyebrow">AI 功課紅綠燈 · '+(g.step+1)+'/'+items.length+'</p>'+
      '<h2>'+esc(it.t)+'</h2><p>這是紅燈、黃燈還是綠燈？</p>'+
      '<div class="traffic">'+
      '<button type="button" class="red" data-light="red">紅燈</button>'+
      '<button type="button" class="yellow" data-light="yellow">黃燈</button>'+
      '<button type="button" class="green" data-light="green">綠燈</button></div>'+
      '<div id="hw-fb"></div></div>';
  }

  function gameDeepfake(){
    const g = ensureGame('g_deepfake');
    const items = [
      {t:'短片畫面像新聞台，內容卻是「行政長官推介加密貨幣穩賺」。', ans:1, opts:['可信，因為像新聞','需查證：可能是深偽新聞樣影片','立刻投資']},
      {t:'學校官網＋班主任電郵同時通知明天活動改期。', ans:0, opts:['較可信（官方多渠道）','一定是深偽','轉發投資連結']},
      {t:'陌生人傳「名人換臉短片」叫你下載不明 App。', ans:1, opts:['下載看看','不下載、不輕信、可向家長／防詐渠道查','轉給全班下載']}
    ];
    if(g.step>=items.length){ g.done=true; save();
      return '<div class="card"><h2>查證練習完成</h2><p class="score-big">'+g.score+'/'+items.length+'</p>'+
        '<button type="button" class="primary" data-view-jump="games">回遊戲區</button></div>'; }
    const it=items[g.step]; g._ans=it.ans;
    return '<div class="card"><p class="eyebrow">深偽新聞查證 · '+(g.step+1)+'/'+items.length+'</p><h2>'+esc(it.t)+'</h2>'+
      it.opts.map((o,j)=>'<button type="button" data-df="'+j+'" style="display:block;width:100%;margin:8px 0;text-align:left">'+esc(o)+'</button>').join('')+
      '<p class="fine">得分 '+g.score+'</p></div>';
  }

  function gameIntegrity(){
    const g = ensureGame('g_integrity');
    const order = ['向老師確認是否准許本次用途','用 AI 做腦力激盪／大綱（若准許）','自己撰寫與核對事實','寫上 AI 使用聲明後提交'];
    const user = g.picks.order || [];
    return '<div class="card"><p class="eyebrow">學術誠信 · 排序</p><h2>把步驟排成負責任順序（點選加入）</h2>'+
      '<div class="drag-list" id="int-pool">'+order.map((t,i)=> user.includes(i)?'':'<button type="button" class="drag-item" data-add="'+i+'">'+esc(t)+'</button>').join('')+'</div>'+
      '<h3>你的順序</h3><ol id="int-user">'+user.map(i=>'<li>'+esc(order[i])+'</li>').join('')+'</ol>'+
      '<div class="actions"><button type="button" id="int-undo" '+(!user.length?'disabled':'')+'>復原</button>'+
      '<button type="button" class="primary" id="int-check" '+(user.length!==4?'disabled':'')+'>檢查</button></div>'+
      '<div id="int-fb"></div><p class="fine">對接 C03、C07：許可、禁止冒充、聲明。</p></div>';
  }

  function gameFace(){
    const g = ensureGame('g_face');
    const qs = [
      {q:'可以把同學照片丟進換臉 App「玩吓」再傳群嗎？', ans:1, opts:['可以，好玩就好','不可以：沒有明確同意就不要改、不要傳','只有班長可以']},
      {q:'若已有人轉發疑似改圖，你應？', ans:0, opts:['停止轉發，告知師長／家長，支援當事人','再製梗圖擴散','私下蒐集更多照片']},
      {q:'預防方面，較合適的是？', ans:1, opts:['公開所有清晰人臉自拍','減少公開清晰人臉、檢查私隱設定、活動拍照先問同意','把同學相冊整包上傳雲端公開']}
    ];
    if(g.step>=qs.length){ g.done=true; save();
      return '<div class="card"><h2>倫理練習完成</h2><p class="score-big">'+g.score+'/'+qs.length+'</p>'+
        '<p>本站<strong>不提供</strong>任何深偽製作教學，只談辨識、同意、勿轉發與求助。鄰近地區校園深偽傷害事件（韓國 C09）提醒：換臉不是玩笑。</p>'+
        '<button type="button" class="primary" data-view-jump="games">回遊戲區</button></div>'; }
    const it=qs[g.step]; g._ans=it.ans;
    return '<div class="card"><p class="eyebrow">換臉 App 倫理 · '+(g.step+1)+'/'+qs.length+'</p><h2>'+esc(it.q)+'</h2>'+
      it.opts.map((o,j)=>'<button type="button" data-face="'+j+'" style="display:block;width:100%;margin:8px 0;text-align:left">'+esc(o)+'</button>').join('')+'</div>';
  }

  function gameAlgo(){
    const g = ensureGame('g_algo');
    return '<div class="card"><p class="eyebrow">演算法與短影音</p><h2>為什麼會「再睇一條」？</h2>'+
      '<p>把原因與對策配對（選擇每項的對策）。</p><div class="match-grid">'+
      '<div class="match-pair"><span>推薦一直推相似片</span><span>→</span><select data-algo="0"><option value="">選對策…</option><option value="a">設定時間上限／休息提醒</option><option value="b">把所有推播打開</option><option value="c">通宵刷完熱門榜</option></select></div>'+
      '<div class="match-pair"><span>為流量跟爭議標籤</span><span>→</span><select data-algo="1"><option value="">選對策…</option><option value="a">考慮觀眾年齡與影響</option><option value="b">忽略低年級觀眾</option><option value="c">只看播放量</option></select></div>'+
      '<div class="match-pair"><span>情緒低落時越刷越久</span><span>→</span><select data-algo="2"><option value="">選對策…</option><option value="a">暫停、找信任的人聊聊／做其他活動</option><option value="b">再刷一小時「療癒」</option><option value="c">刪掉所有功課提醒</option></select></div>'+
      '</div><button type="button" class="primary" id="algo-check">檢查配對</button><div id="algo-fb"></div>'+
      '<p class="fine">研究參考：C11（香港，2025-08-22）。澳門本地統計待查證（T02）。</p></div>';
  }

  function gameCopyright(){
    const g = ensureGame('g_copyright');
    const items = [
      {t:'用 AI 產生「很像某歌手」的歌報名比賽，不讀規則。', ans:1, opts:['沒問題','高風險：先讀規則／標示與版權爭議','只要自用上傳就一定合法']},
      {t:'AI 輸出段落極似某報報道，你當作業原文貼上。', ans:1, opts:['可以','不可：需查證、改寫、引用並守規定','刪引號即可']},
      {t:'比賽要求標示 AI 輔助，你誠實標示並說明自己貢獻。', ans:0, opts:['良好示範','多此一舉','等於承認抄襲']}
    ];
    if(g.step>=items.length){ g.done=true; save();
      return '<div class="card"><h2>版權判斷完成</h2><p class="score-big">'+g.score+'/'+items.length+'</p>'+
        '<button type="button" class="primary" data-view-jump="games">回遊戲區</button></div>'; }
    const it=items[g.step]; g._ans=it.ans;
    return '<div class="card"><p class="eyebrow">版權與 AI 圖／歌 · '+(g.step+1)+'/'+items.length+'</p><h2>'+esc(it.t)+'</h2>'+
      it.opts.map((o,j)=>'<button type="button" data-cr="'+j+'" style="display:block;width:100%;margin:8px 0;text-align:left">'+esc(o)+'</button>').join('')+'</div>';
  }

  function renderGameList(){
    return '<section class="mast"><div><p class="eyebrow">遊戲區</p><h1>動手練習<em>本地規則</em></h1>'+
      '<p>不連線真實 AI。可重複遊玩；完成會記入進度。</p></div></section>'+
      '<div class="game-grid">'+S.games.map(g=>
        '<article class="game-card"><span class="chip">'+(state.games[g.id]&&state.games[g.id].done?'已完成':'未完成')+'</span>'+
        '<h3>'+esc(g.icon||'')+' · '+esc(g.title)+'</h3><p>'+esc(g.desc)+'</p>'+
        '<button type="button" class="primary" data-open-game="'+esc(g.id)+'">開始</button></article>'
      ).join('')+'</div>';
  }

  function renderGame(){
    if(!state.game) return renderGameList();
    const map = {
      g_voice: gameVoice, g_photo: gamePhoto, g_brake: gameBrake, g_hw: gameHW,
      g_deepfake: gameDeepfake, g_integrity: gameIntegrity, g_face: gameFace,
      g_algo: gameAlgo, g_copyright: gameCopyright
    };
    const fn = map[state.game];
    return '<p><button type="button" data-view-jump="games">← 回遊戲列表</button></p>'+(fn?fn():'<div class="card">未知遊戲</div>');
  }

  function renderChallenge(){
    const C = S.challenge;
    const qs = C.questions;
    if(state.challenge.done){
      const score = state.challenge.score;
      const rank = C.ranks.find(r=>score>=r.min) || C.ranks[C.ranks.length-1];
      const text = S.title+'｜總結大挑戰結果\n分數：'+score+' / 100\n評級：'+rank.name+'\n建議：'+rank.tip+'\n查證日期：2026-10-18\n澳門科學館 · Oscar 製作';
      return '<div class="card"><p class="eyebrow">總結大挑戰</p><h2>'+esc(C.title)+'</h2>'+
        '<div class="score-big">'+score+' 分</div><div class="rank">'+esc(rank.name)+'</div>'+
        '<div class="tips"><strong>給你的建議</strong><p>'+esc(rank.tip)+'</p>'+
        (S.kind==='secondary'?'<p class="fine">班規草案提示：寫清（1）何時可用 AI（2）如何標註（3）人臉／私隱紅線（4）違規如何處理（5）求助誰。</p>':'')+
        '</div><div class="actions" style="margin-top:14px">'+
        '<button type="button" class="primary" id="copy-result">複製結果文字</button>'+
        '<button type="button" id="dl-result">下載結果</button>'+
        '<button type="button" id="retry-challenge">再挑戰一次</button></div>'+
        '<pre class="fine" id="result-text" style="white-space:pre-wrap;background:var(--soft);padding:12px;border-radius:10px">'+esc(text)+'</pre></div>';
    }
    const answers = state.challenge.answers||{};
    return '<div class="card"><p class="eyebrow">總結大挑戰</p><h2>'+esc(C.title)+'</h2><p>'+esc(C.intro)+'</p>'+
      qs.map((q,i)=>'<div class="qbox" style="margin-top:12px"><fieldset><legend>'+(i+1)+'. '+esc(q.q)+'</legend>'+
        q.options.map((o,j)=>'<label class="choice"><input type="radio" name="cq'+i+'" value="'+j+'" '+(answers[i]===j?'checked':'')+'><span>'+esc(o)+'</span></label>').join('')+
        '</fieldset></div>').join('')+
      '<button type="button" class="primary gold" id="submit-challenge">交卷並看評語</button></div>';
  }

  function renderParents(){
    const P = S.parents;
    if(!P) return '<div class="card">無內容</div>';
    return '<div class="card"><h2>'+esc(P.title)+'</h2><ul>'+P.bullets.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>'+
      '<p class="fine">案例來源詳見研究檔；查證日期 2026-10-18。</p></div>';
  }

  function renderResources(){
    const rows = (S.resources||[]).map(r=>'<tr><td><strong>'+esc(r.id)+'</strong></td><td>'+esc(r.title)+'</td><td>'+esc(r.region)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.source)+'</td><td>'+(r.url?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener">開啟</a>':'')+'</td></tr>').join('');
    return '<div class="card"><h2>引用案例簡表</h2>'+
      '<p class="fine">只列已查證案例。非澳門地區已標明。查證日期：2026-10-18。</p>'+
      '<div style="overflow:auto"><table class="resource-table"><thead><tr><th>編號</th><th>標題</th><th>地區</th><th>日期</th><th>來源</th><th>連結</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<p class="fine">待查證：T01 澳門學生 ChatGPT 具名處分個案；T02 澳門短影音成癮官方統計——寧可標待查證，不捏造。</p></div>';
  }

  function render(){
    renderTabs(); renderSide();
    const host = $('#view-host');
    if(state.view==='home') host.innerHTML = renderHome();
    else if(state.view==='learn') host.innerHTML = renderLesson();
    else if(state.view==='games') host.innerHTML = renderGame();
    else if(state.view==='challenge') host.innerHTML = renderChallenge();
    else if(state.view==='parents') host.innerHTML = renderParents();
    else if(state.view==='resources') host.innerHTML = renderResources();
    else host.innerHTML = renderHome();
    save();
  }

  function setView(v){
    if(!S.tabs.some(t=>t.id===v)) return;
    state.view=v;
    if(v!=='games') state.game=null;
    render();
    $('#main').scrollIntoView({block:'start'});
  }

  document.addEventListener('click', e=>{
    const tab = e.target.closest('#main-tabs [data-view]');
    if(tab){ setView(tab.dataset.view); return; }
    const jump = e.target.closest('[data-view-jump]');
    if(jump){ e.preventDefault(); setView(jump.dataset.viewJump); return; }
    const gl = e.target.closest('[data-go-lesson]');
    if(gl){ state.lesson=+gl.dataset.goLesson; setView('learn'); return; }
    const gg = e.target.closest('[data-go-game]');
    if(gg){ state.game=gg.dataset.goGame; ensureGame(state.game); setView('games'); render(); return; }
    const og = e.target.closest('[data-open-game]');
    if(og){
      state.game=og.dataset.openGame;
      const g=ensureGame(state.game);
      if(g.done){ g.step=0; g.done=false; g.score=0; g.picks={}; }
      render(); return;
    }

    if(e.target.id==='prev-l'){ state.lesson=Math.max(0,state.lesson-1); render(); return; }
    if(e.target.id==='next-l'){ state.lesson=Math.min(S.lessons.length-1,state.lesson+1); render(); return; }
    if(e.target.id==='check-ans'){
      const choice = document.querySelector('input[name=ans]:checked');
      if(!choice){ toast('請先選一個答案'); return; }
      const r=state.lessons[state.lesson], L=S.lessons[state.lesson];
      r.answer=+choice.value; r.correct=r.answer===L.answer; r.done=false; render(); return;
    }
    if(e.target.id==='mark-done'){
      const r=state.lessons[state.lesson], L=S.lessons[state.lesson];
      if(r.answer!==L.answer){ toast('請先選對再完成本關（可看回饋後重選）'); return; }
      r.done=true; r.correct=true; toast('本關完成！'); render(); return;
    }

    const vv = e.target.closest('[data-voice]');
    if(vv && state.game==='g_voice'){
      const g=ensureGame('g_voice');
      if(+vv.dataset.voice===g._ans) g.score++;
      g.step++; render(); return;
    }
    const ph = e.target.closest('[data-photo]');
    if(ph && state.game==='g_photo'){
      const g=ensureGame('g_photo');
      const sel=new Set(g.picks.sel||[]);
      const i=+ph.dataset.photo;
      if(sel.has(i)) sel.delete(i); else sel.add(i);
      g.picks.sel=[...sel]; render(); return;
    }
    if(e.target.id==='photo-submit'){
      const g=ensureGame('g_photo');
      const sel=new Set(g.picks.sel||[]);
      const ok = sel.has(0)&&sel.has(2)&&!sel.has(1)&&!sel.has(3);
      const fb=document.getElementById('photo-fb');
      if(ok){ g.done=true; g.score=1; fb.innerHTML='<div class="feedback ok">正確！只公開已同意的同學。</div>'; toast('遊戲完成'); }
      else fb.innerHTML='<div class="feedback bad">再檢查：未同意的同學不能公開發。</div>';
      save(); return;
    }
    if(e.target.id==='brake-more'){
      const g=ensureGame('g_brake'); g.picks.clips=(g.picks.clips||0)+1; render(); return;
    }
    if(e.target.id==='brake-stop'){
      const g=ensureGame('g_brake'); const clips=g.picks.clips||0;
      const fb=document.getElementById('brake-fb');
      if(clips<=5){ g.done=true; g.score=1; fb.innerHTML='<div class="feedback ok">漂亮！你在限額內踩了剎車。</div>'; toast('遊戲完成'); }
      else { fb.innerHTML='<div class="feedback bad">已超過限額。下次時間到就要放下。</div>'; g.done=true; }
      save(); render(); return;
    }
    const lt = e.target.closest('[data-light]');
    if(lt && state.game==='g_hw'){
      const g=ensureGame('g_hw');
      const ok = lt.dataset.light===g._light;
      if(ok) g.score++;
      const fb=document.getElementById('hw-fb');
      if(fb) fb.innerHTML='<div class="feedback '+(ok?'ok':'bad')+'">'+(ok?'正確。':'應該是另一盞燈。')+esc(g._why||'')+'</div>';
      setTimeout(()=>{ g.step++; render(); }, 650);
      return;
    }
    const df=e.target.closest('[data-df]');
    if(df && state.game==='g_deepfake'){
      const g=ensureGame('g_deepfake');
      if(+df.dataset.df===g._ans) g.score++;
      g.step++; render(); return;
    }
    const ad=e.target.closest('[data-add]');
    if(ad && state.game==='g_integrity'){
      const g=ensureGame('g_integrity'); g.picks.order=g.picks.order||[];
      g.picks.order.push(+ad.dataset.add); render(); return;
    }
    if(e.target.id==='int-undo'){
      const g=ensureGame('g_integrity'); g.picks.order.pop(); render(); return;
    }
    if(e.target.id==='int-check'){
      const g=ensureGame('g_integrity'); const o=g.picks.order||[];
      const ok = o.length===4 && o[0]===0&&o[1]===1&&o[2]===2&&o[3]===3;
      const fb=document.getElementById('int-fb');
      if(ok){ g.done=true; g.score=1; fb.innerHTML='<div class="feedback ok">順序正確：先許可，再使用，自己寫，最後聲明。</div>'; toast('遊戲完成'); }
      else fb.innerHTML='<div class="feedback bad">再排一次：確認許可應在最前，聲明在提交前。</div>';
      save(); return;
    }
    const fa=e.target.closest('[data-face]');
    if(fa && state.game==='g_face'){
      const g=ensureGame('g_face');
      if(+fa.dataset.face===g._ans) g.score++;
      g.step++; render(); return;
    }
    if(e.target.id==='algo-check'){
      const g=ensureGame('g_algo');
      const vals=[0,1,2].map(i=>document.querySelector('select[data-algo="'+i+'"]')?.value);
      const ok=vals.every(v=>v==='a');
      const fb=document.getElementById('algo-fb');
      if(ok){ g.done=true; g.score=1; fb.innerHTML='<div class="feedback ok">配對正確。推薦系統會放大習慣——主動管理時間與內容影響。</div>'; toast('遊戲完成'); }
      else fb.innerHTML='<div class="feedback bad">每項都選「較負責任」的那一個再試。</div>';
      save(); return;
    }
    const cr=e.target.closest('[data-cr]');
    if(cr && state.game==='g_copyright'){
      const g=ensureGame('g_copyright');
      if(+cr.dataset.cr===g._ans) g.score++;
      g.step++; render(); return;
    }

    if(e.target.id==='submit-challenge'){
      const qs=S.challenge.questions; let correct=0; const answers={};
      for(let i=0;i<qs.length;i++){
        const c=document.querySelector('input[name=cq'+i+']:checked');
        if(!c){ toast('請答完所有題再交卷'); return; }
        answers[i]=+c.value;
        if(answers[i]===qs[i].answer) correct++;
      }
      state.challenge.answers=answers;
      state.challenge.score=Math.round(correct/qs.length*100);
      state.challenge.done=true;
      toast('已評分！'); render(); return;
    }
    if(e.target.id==='retry-challenge'){
      state.challenge={answers:{},score:null,rank:null,done:false}; render(); return;
    }
    if(e.target.id==='copy-result'){
      const t=document.getElementById('result-text')?.textContent||'';
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(t).then(()=>toast('已複製'),()=>toast('請手動複製文字框內容'));
      } else toast('請手動複製文字框內容');
      return;
    }
    if(e.target.id==='dl-result'){
      download('ai-literacy-challenge-result.txt', document.getElementById('result-text')?.textContent||''); return;
    }
  });

  document.addEventListener('change', e=>{
    if(e.target.id==='short-note'){
      state.shortNotes[S.lessons[state.lesson].id]=e.target.value; save();
    }
  });

  document.getElementById('btn-export').onclick=()=>download(KEY+'-progress.json', JSON.stringify(state,null,2), 'application/json');
  document.getElementById('btn-reset').onclick=()=>{
    if(!confirm('重設本站所有進度？建議先匯出。')) return;
    state=fresh(); localStorage.removeItem(KEY); render(); toast('已重設');
  };

  render();
})();
