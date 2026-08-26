/* ===== 喵咪备考 · 六级看板 前端逻辑（数据由生成器自动注入） ===== */
var D = window.SITE_DATA || {};
var WORDS = D.words || [], WRONG = D.wrong || [], SKILLS = D.skills || [];
var MATS = D.materials || [], KBS = D.kb || [];
var IMGS = D.images || {bg:{}, av:{}};

/* ---------- 工具 ---------- */
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function setModal(html){ document.getElementById("modalBody").innerHTML = html; document.getElementById("modal").classList.add("show"); }
function closeModal(){ document.getElementById("modal").classList.remove("show"); }
var toastTimer=null;
function toast(msg){ var t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove("show");},2200); }

/* ---------- 首页：备考看板 ---------- */
function renderHome(){
  var st = D.stats||{};
  document.getElementById("statDays").textContent = st.days||"0";
  document.getElementById("statCheck").textContent = st.checkin||0;
  document.getElementById("statWords").textContent = st.words||0;
  document.getElementById("statMastered").textContent = st.mastered||0;
  document.getElementById("statWrong").textContent = st.wrong||0;
  document.getElementById("statAvg").textContent = (st.avg||0)+"%";
  // 今日任务
  var tasks = D.tasks||[];
  var th = tasks.map(function(t){
    return '<li><input type="checkbox" data-k="'+esc(t.key)+'"><span><b>'+esc(t.name)+'</b>'+(t.advice?'<div style="font-size:12px;color:var(--muted)">'+esc(t.advice)+'</div>':'')+'</span></li>';
  }).join("");
  document.getElementById("taskList").innerHTML = th || '<li style="color:var(--muted)">暂无任务配置</li>';
  // 任务勾选 → 全完成显示打卡按钮
  var boxes=document.querySelectorAll("#taskList input[type=checkbox]");
  var cwrap=document.getElementById("checkinWrap");
  function updCheckin(){ if(cwrap) cwrap.style.display=(boxes.length&&Array.prototype.every.call(boxes,function(x){return x.checked;}))?"block":"none"; }
  boxes.forEach(function(x){ x.addEventListener("change", updCheckin); });
  // 本周打卡
  var week = D.week||[];
  var doneN = week.filter(function(w){ return w.done; }).length;
  var wh = week.map(function(w){ return '<span title="周'+esc(w.day)+'" style="display:inline-flex;flex-direction:column;align-items:center;gap:3px;font-size:12px;color:var(--muted)"><b>'+esc(w.day)+'</b><span style="font-size:15px">'+(w.done?'🐾':'☐')+'</span></span>'; }).join("");
  document.getElementById("taskHint").innerHTML = '本周打卡：'+wh+'<div style="margin-top:6px">连续打卡 X 天 🐾 · 本周已打卡 <b>'+doneN+'</b> / 7 天</div>';
  // 备考进度
  var prog = D.progress||[];
  var ph = prog.map(function(p){
    var pct = Math.min(100, Math.max(0, p.pct||0));
    return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span><b>'+esc(p.dim)+'</b></span><span style="color:var(--muted)">'+esc(p.done)+' / '+esc(p.target)+'</span></div>'
      + '<div style="height:10px;border-radius:20px;background:var(--pink-soft);overflow:hidden"><div style="width:'+pct+'%;height:100%;border-radius:20px;background:linear-gradient(90deg,#f97316,#fbbf24)"></div></div>'
      + '<div style="text-align:right;font-size:11px;color:var(--muted);margin-top:2px">'+pct+'%</div></div>';
  }).join("");
  document.getElementById("progressList").innerHTML = ph || '<div style="color:var(--muted)">暂无进度数据</div>';
  // AI 助手
  document.getElementById("aiPanel").innerHTML = D.ai || '<p>暂无 AI 建议，在豆包中告诉我你的进度即可生成。</p>';
}

/* ---------- 词汇 ---------- */
var curVFilter="all", curVQuery="";
function renderVocabStats(){
  var total=WORDS.length, learning=0, mastered=0;
  WORDS.forEach(function(w){ if(w.status==="已掌握") mastered++; else learning++; });
  document.getElementById("vTotal").textContent = total;
  document.getElementById("vLearning").textContent = learning;
  document.getElementById("vMastered").textContent = mastered;
}
function renderVocab(){
  renderVocabStats();
  var list = WORDS.filter(function(w){
    if(curVFilter==="learning" && w.status!=="学习中") return false;
    if(curVFilter==="mastered" && w.status!=="已掌握") return false;
    if(curVQuery){ var q=curVQuery.toLowerCase(); if(((w.word||"")+(w.meaning||"")).toLowerCase().indexOf(q)<0) return false; }
    return true;
  });
  var html = list.map(function(w){
    var mastered = w.status==="已掌握";
    return '<div class="job-card" onclick="openWord('+WORDS.indexOf(w)+')">'
      + '<div class="job-top"><div class="job-title"><span class="company">'+esc(w.word)+'</span><span class="pos">'+esc(w.meaning)+'</span></div>'
      + '<span class="badge '+(mastered?'green':'amber')+'">'+(mastered?'✅':'🔥')+'</span></div>'
      + (w.example?'<div class="job-meta">💬 '+esc(w.example)+'</div>':'')
      + '<div class="job-tags"><span class="status '+(mastered?'done':'warn')+'">'+esc(w.status||"学习中")+'</span><span class="level">复习 '+esc(w.review||0)+' 次</span></div></div>';
  }).join("");
  document.getElementById("wordList").innerHTML = html || '<div class="card" style="text-align:center;color:var(--muted)">🐾 没有符合条件的生词，去 [[生词表]] 添加吧</div>';
}
function openWord(i){
  var w = WORDS[i]; if(!w) return;
  setModal('<h2>📖 '+esc(w.word)+'</h2>'
    + '<div class="m-sub">'+esc(w.meaning)+'</div>'
    + (w.example?'<div class="m-sec">💬 例句</div><p style="font-size:13.5px">'+esc(w.example)+'</p>':'')
    + '<div class="m-sec">📌 状态</div><p style="font-size:13.5px">'+esc(w.status||"学习中")+' · 复习 '+esc(w.review||0)+' 次 · 上次复习 '+esc(w.last||"—")+'</p>'
    + '<div style="display:flex;gap:8px;margin-top:14px">'
    + (w.status!=="已掌握"
        ? '<button class="btn primary" onclick="markWord('+i+',\'已掌握\')">✅ 标记已掌握</button>'
        : '<button class="btn" onclick="markWord('+i+',\'学习中\')">🔄 改回学习中</button>')
    + '<button class="btn" onclick="closeModal()">✕ 关闭</button></div>'
    + '<div class="m-sub" style="margin-top:10px">状态修改经写回服务同步，约 1-2 分钟生效。</div>');
}

/* ---------- 错题本 ---------- */
var curWFilter="all";
var SUBJECTS=["听力","阅读","词汇","写作","翻译"];
function renderWrongStats(){
  var total=0, subs=[0,0,0,0,0];
  WRONG.forEach(function(w){ total++; var k=SUBJECTS.indexOf(w.subject); if(k>=0) subs[k]++; });
  document.getElementById("wTotal").textContent = total;
  subs.forEach(function(c,i){ var el=document.getElementById("wSub"+i); if(el) el.textContent=c; });
}
function renderWrong(){
  var list = WRONG.filter(function(w){ return curWFilter==="all" || w.subject===curWFilter; });
  var html = list.map(function(w){
    var k = SUBJECTS.indexOf(w.subject);
    var ic = ["👂","📖","🔤","✍️","🀄"][k>=0?k:0];
    return '<div class="job-card" onclick="openWrong('+WRONG.indexOf(w)+')">'
      + '<div class="job-top"><div class="job-title"><span class="company">'+ic+' '+esc(w.subject||"未分类")+'</span><span class="pos">'+(w.source?'出处：'+esc(w.source):'')+'</span></div></div>'
      + '<div class="job-meta">📝 '+esc(w.summary)+'</div>'
      + (w.analysis?'<div class="job-meta" style="color:var(--pink-deep)">💡 '+esc(w.analysis)+'</div>':'')
      + '<div class="job-tags"><span class="status '+(k===0?'interview':k===1?'done':'warn')+'">'+esc(w.status||"待复习")+'</span></div></div>';
  }).join("");
  document.getElementById("wrongList").innerHTML = html || '<div class="card" style="text-align:center;color:var(--muted)">🐾 还没有错题，继续保持！</div>';
}
function openWrong(i){
  var w = WRONG[i]; if(!w) return;
  setModal('<h2>❌ '+esc(w.subject||"未分类")+'</h2>'
    + (w.source?'<div class="m-sub">出处：'+esc(w.source)+'</div>':'')
    + '<div class="m-sec">📝 错题简述</div><p style="font-size:13.5px">'+esc(w.summary)+'</p>'
    + (w.analysis?'<div class="m-sec">💡 错因分析与心得</div><p style="font-size:13.5px;color:var(--muted)">'+esc(w.analysis)+'</p>':'')
    + '<div class="m-sec">📌 状态</div><p style="font-size:13.5px">'+esc(w.status||"待复习")+'</p>');
}

/* ---------- 分项训练 ---------- */
function renderSkills(){
  var html = SKILLS.map(function(s,i){
    return '<div class="kb-card '+s.cls+'" onclick="openSkill('+i+')"><div class="ic">'+s.icon+'</div><div class="kn">'+esc(s.title)+'</div><div class="kd">'+esc(s.desc||"")+'</div><span class="ncount">'+esc(s.goal||"")+'</span></div>';
  }).join("");
  document.getElementById("skillGrid").innerHTML = html || '<div class="card" style="text-align:center;color:var(--muted)">🐾 暂无分项资料</div>';
}
function openSkill(i){
  var s = SKILLS[i]; if(!s) return;
  setModal('<h2>'+s.icon+' '+esc(s.title)+'</h2><div class="note-body" style="margin-top:12px">'+(s.html||'<p>暂无内容</p>')+'</div>');
}

/* ---------- 资料 ---------- */
function renderMaterials(){
  var html = MATS.map(function(g){
    var items = g.items.map(function(m){
      return '<div class="cmp-card" style="display:flex;flex-direction:column;gap:6px"><div class="cn">'+esc(m.title)+'</div>'
        + (m.desc?'<div class="why">'+esc(m.desc)+'</div>':'')
        + (m.url?'<a class="pill g" style="text-align:center;margin-top:4px" href="'+esc(m.url)+'" target="_blank">🔗 打开资料</a>':'')
        + '</div>';
    }).join("");
    return '<div class="cmp-sec"><h3>'+esc(g.cat)+'</h3><div class="cmp-grid">'+items+'</div></div>';
  }).join("");
  document.getElementById("matList").innerHTML = html || '<div class="card" style="text-align:center;color:var(--muted)">🐾 暂无资料</div>';
}

/* ---------- 知识库 ---------- */
var KB_FLAT = [];
function flattenKb(){
  KB_FLAT = [];
  KBS.forEach(function(k){
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
      (function walk(ns){ ns.forEach(function(n){ if(n.children){ walk(n.children); } else { KB_FLAT.push(n); } }); })(g.notes||[]);
    });
  });
}
function kbNoteItem(n){
  var idx = KB_FLAT.indexOf(n);
  return '<div class="note-item" onclick="openKbNote('+idx+')"><span class="ni-ic">'+esc(n.icon)+'</span>'+esc(n.title)+'<span class="ni-more">打开 →</span></div>';
}
function countNotes(ns){ var c=0; (ns||[]).forEach(function(n){ c += n.children ? countNotes(n.children) : 1; }); return c; }
function renderKb(){
  document.getElementById("kbGrid").innerHTML = KBS.map(function(k,i){
    var cnt = 0;
    (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){ cnt += countNotes(g.notes); });
    return '<div class="kb-card '+k.cls+'" onclick="openKb('+i+')"><div class="ic">'+k.icon+'</div><div class="kn">'+esc(k.name)+'</div><div class="kd">'+esc(k.desc)+'</div><span class="ncount">'+cnt+' 项</span></div>';
  }).join("");
}
function renderNotes(ns){
  return (ns||[]).map(function(n){
    if(n.children){
      return '<div class="kb-folder"><div class="kf-name">'+n.icon+' '+esc(n.title)+'</div>'+renderNotes(n.children)+'</div>';
    }
    return kbNoteItem(n);
  }).join("");
}
function openKb(i){
  var k = KBS[i];
  var html = "";
  (k.groups||[{title:"", notes:k.notes||[]}]).forEach(function(g){
    if(g.title) html += '<div class="kb-section">'+esc(g.title)+'</div>';
    var items = renderNotes(g.notes);
    html += items || '<div style="color:var(--muted);font-size:13px;margin:4px 0">（空）🐾</div>';
  });
  setModal('<h2>'+k.icon+' '+esc(k.name)+'</h2><div class="m-sub">'+esc(k.desc)+' · 点击查看</div>'+(html||'<div class="m-sub">这个文件夹还没有内容 🐾</div>'));
}
function openKbNote(idx){
  var n = KB_FLAT[idx];
  if(!n) return;
  setModal('<h2>'+n.icon+' '+esc(n.title)+'</h2><div style="margin-top:12px" class="note-body">'+(n.html||'<p>暂无内容</p>')+'</div>');
}

/* ---------- 全局搜索 ---------- */
function plainText(html){ var d=document.createElement("div"); d.innerHTML=html||""; return (d.textContent||"").replace(/\s+/g," ").trim(); }
var GSEARCH_IDX=null, gsList=[];
function buildSearchIndex(){
  var idx=[];
  WORDS.forEach(function(w){ idx.push({type:"生词",icon:"📖",title:w.word,sub:w.meaning,keys:(w.word+" "+w.meaning).toLowerCase(),open:function(){closeModal();go("vocab");openWord(WORDS.indexOf(w));}}); });
  WRONG.forEach(function(w){ idx.push({type:"错题",icon:"❌",title:(w.subject||"")+" · "+w.summary,sub:(w.source||""),keys:(w.subject+" "+w.summary+" "+w.source).toLowerCase(),open:function(){closeModal();go("wrong");openWrong(WRONG.indexOf(w));}}); });
  SKILLS.forEach(function(s){ idx.push({type:"训练",icon:s.icon,title:s.title,sub:s.desc||"",keys:(s.title+" "+(s.desc||"")).toLowerCase(),open:function(){closeModal();go("skills");openSkill(SKILLS.indexOf(s));}}); });
  MATS.forEach(function(g){ g.items.forEach(function(m){ idx.push({type:"资料",icon:"📎",title:m.title,sub:g.cat,keys:(m.title+g.cat).toLowerCase(),open:function(){closeModal();go("materials");}}); }); });
  KBS.forEach(function(k){
    (k.groups||[{title:"",notes:k.notes||[]}]).forEach(function(g){
      (function walk(ns){ ns.forEach(function(n){ if(n.children){ walk(n.children); } else {
        var txt=plainText(n.html);
        idx.push({type:"笔记",icon:n.icon||"📄",title:n.title,sub:txt.slice(0,60),keys:(n.title+" "+txt).toLowerCase(),open:function(){closeModal();go("knowledge");openKbNote(KB_FLAT.indexOf(n));}});
      } }); })(g.notes||[]);
    });
  });
  return idx;
}
function openGlobalSearch(){
  if(!GSEARCH_IDX) GSEARCH_IDX = buildSearchIndex();
  setModal('<h2>🔍 全局搜索</h2><div class="m-sub">搜生词 / 错题 / 笔记 / 资料</div>'
    + '<div class="search" style="margin-bottom:12px"><span>🔍</span><input id="gsInput" placeholder="输入关键词，如：abandon / 听力 / 翻译…" autofocus></div>'
    + '<div id="gsResults"></div>');
  var inp = document.getElementById("gsInput");
  function doSearch(){
    var q=(inp.value||"").toLowerCase();
    gsList = q ? GSEARCH_IDX.filter(function(x){return x.keys.indexOf(q)>=0;}) : [];
    var html = gsList.slice(0,30).map(function(x,i){
      return '<div class="note-item" onclick="gsOpen('+i+')"><span class="ni-ic">'+x.icon+'</span><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13.5px">'+esc(x.title)+'</div><div style="font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(x.sub)+'</div></div><span style="font-size:11px;color:var(--pink-deep);background:var(--pink-soft);padding:2px 8px;border-radius:20px;flex-shrink:0">'+x.type+'</span></div>';
    }).join("");
    document.getElementById("gsResults").innerHTML = q ? (html||'<div style="text-align:center;color:var(--muted);padding:20px">🐾 没有找到相关结果</div>') : '<div style="text-align:center;color:var(--muted);padding:20px">输入关键词开始搜索～</div>';
  }
  inp.addEventListener("input", doSearch);
  inp.addEventListener("keydown", function(e){ if(e.key==="Enter") doSearch(); });
  setTimeout(function(){ inp.focus(); },100);
  doSearch();
}
function gsOpen(i){ var x=gsList[i]; if(x && x.open) x.open(); }

/* ---------- 头像 & 背景 ---------- */
var BG_IMGS=IMGS.bg||{}, AV_IMGS=IMGS.av||{};
var savedBg=Object.keys(BG_IMGS)[0]||"img1", savedAv=Object.keys(AV_IMGS)[0]||"img1";
try{ savedBg=localStorage.getItem("cet6_bg")||Object.keys(BG_IMGS)[0]||"img1"; savedAv=localStorage.getItem("cet6_av")||Object.keys(AV_IMGS)[0]||"img1"; }catch(e){}
function applyBg(){ document.documentElement.style.setProperty("--bg-img","url('"+BG_IMGS[savedBg]+"')"); }
function applyAv(){ var a=document.getElementById("avatarImg"); if(a) a.src=AV_IMGS[savedAv]; }
function pickHtml(type,imgs,cur){
  var h='<div class="pick-grid">';
  Object.keys(imgs).forEach(function(k){
    h+='<div class="pick-item '+(type==="Av"?"av":"")+(k===cur?" active":"")+'" onclick="set'+type+'(\''+k+'\')"><img src="'+imgs[k]+'" alt=""><div class="pn">'+(k==="img1"?"图1":k==="img2"?"图2":k==="img3"?"图3":"图4")+'</div></div>';
  });
  return h+'</div>';
}
function openPersonalize(){
  setModal('<h2>🐱 换个风格</h2><div class="m-sub">点下面的图片，实时换背景和头像，你的选择会被记住</div>'
    + '<div class="pick-sec"><div class="m-sec">🖼️ 背景图</div>'+pickHtml("Bg",BG_IMGS,savedBg)+'</div>'
    + '<div class="pick-sec"><div class="m-sec">😺 小头像</div>'+pickHtml("Av",AV_IMGS,savedAv)+'</div>');
}
function setBg(k){ savedBg=k; try{localStorage.setItem("cet6_bg",k);}catch(e){} applyBg(); openPersonalize(); }
function setAv(k){ savedAv=k; try{localStorage.setItem("cet6_av",k);}catch(e){} applyAv(); openPersonalize(); }

/* ---------- 页面切换 ---------- */
var TITLES={home:"🎯 备考看板",vocab:"📖 词汇",wrong:"❌ 错题本",skills:"🎓 分项训练",materials:"📎 学习资料",knowledge:"📚 知识库"};
function go(view){
  document.querySelectorAll(".view").forEach(function(v){ v.classList.remove("active"); });
  var el=document.getElementById("view-"+view); if(el) el.classList.add("active");
  document.querySelectorAll(".nav-item,.bn-item").forEach(function(n){ n.classList.toggle("active",n.getAttribute("data-go")===view); });
  document.getElementById("pageTitle").textContent = TITLES[view]||"";
  setFab(view);
  window.scrollTo({top:0});
}
document.addEventListener("click", function(e){
  var t=e.target.closest("[data-go]");
  if(t){ go(t.getAttribute("data-go")); }
});
function bindChips(id, cb){
  document.querySelectorAll("#"+id+" .chip").forEach(function(c){
    c.addEventListener("click", function(){
      document.querySelectorAll("#"+id+" .chip").forEach(function(x){ x.classList.remove("active"); });
      c.classList.add("active"); cb(c.getAttribute("data-f"));
    });
  });
}
bindChips("vchips", function(f){ curVFilter=f; renderVocab(); });
bindChips("wchips", function(f){ curWFilter=f; renderWrong(); });
document.getElementById("vsearch").addEventListener("input", function(e){ curVQuery=e.target.value; renderVocab(); });
document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeModal(); });

/* ---------- 漂浮小元素 ---------- */
(function(){
  var emojis=["🐱","🐾","🎓","📖","🐟","😺","🌸","✍️"];
  function spawn(){
    var s=document.createElement("span");
    s.textContent=emojis[Math.floor(Math.random()*emojis.length)];
    s.style.left=(Math.random()*96)+"vw";
    s.style.fontSize=(12+Math.random()*15)+"px";
    s.style.animationDuration=(7+Math.random()*7)+"s";
    document.getElementById("floats").appendChild(s);
    setTimeout(function(){s.remove()},16000);
  }
  spawn();spawn();
  setInterval(spawn,1500);
})();

/* ---------- 初始化 ---------- */
(function(){
  var upd=document.getElementById("syncText");
  if(upd && D.updated) upd.textContent = "自动同步 · "+D.updated;
  flattenKb();
  renderHome(); renderVocab(); renderWrongStats(); renderWrong(); renderSkills(); renderMaterials(); renderKb();
  applyBg(); applyAv(); setFab("home");
})();

/* ================= 手机写回 · 添加/编辑 · 拍照识别 · 语音录入 ================= */
var BRIDGE = { url:"https://1473705102-38601bi8ym.ap-shanghai.tencentscf.com", key:"0606" };
try{ var _brid=JSON.parse(localStorage.getItem("cet6_bridge")||"null"); if(_brid&&_brid.url) BRIDGE=_brid; }catch(e){}

/* ---------- 语音识别（Web Speech API，安卓 Chrome / 桌面 Chrome 支持） ---------- */
function startVoice(inputId, lang){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ toast("当前浏览器不支持语音识别，请用安卓 Chrome"); return; }
  var r=new SR(); r.lang=lang||"zh-CN"; r.interimResults=false; r.maxAlternatives=1;
  var btn=document.querySelector("[data-vb='"+inputId+"']");
  if(btn){ btn.classList.add("rec"); btn.textContent="🔴"; }
  r.onresult=function(e){
    var t=e.results[0][0].transcript||"";
    var inp=document.getElementById(inputId);
    if(inp&&t){ inp.value=inp.value?inp.value+" "+t:t; }
    toast("已识别："+t);
  };
  r.onend=function(){ if(btn){ btn.classList.remove("rec"); btn.textContent="🎤"; } };
  r.onerror=function(e){ if(btn){ btn.classList.remove("rec"); btn.textContent="🎤"; } toast("语音识别失败："+(e.error||"")); };
  try{ r.start(); }catch(e){ toast("语音识别启动失败"); }
}

/* ---------- 拍照 OCR（Tesseract.js，浏览器本地识别） ---------- */
var _tessLoaded=false, _tessLoading=false;
function loadTesseract(cb){
  if(window.Tesseract){ cb(); return; }
  if(_tessLoading) return;
  _tessLoading=true; toast("正在加载识别引擎，首次约 5-15 秒…");
  var s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
  s.onload=function(){ _tessLoaded=true; cb(); };
  s.onerror=function(){ _tessLoading=false; toast("识别引擎加载失败，请检查网络"); };
  document.head.appendChild(s);
}
function ocrFileText(input, lang, cb){
  var f=input.files&&input.files[0]; if(!f){ return; }
  loadTesseract(function(){
    Tesseract.recognize(f, lang||"eng", {}).then(function(r){ cb((r.data.text||"").trim()); })
      .catch(function(e){ cb(null, e); });
  });
}
function ocrBoxHtml(id, lines){
  return '<div style="font-size:12.5px;font-weight:700;margin-bottom:4px">📷 识别结果：</div>'
    + '<textarea id="'+id+'" rows="4" style="width:100%;box-sizing:border-box;font-size:13px">'+esc((lines||[]).join("\n"))+'</textarea>';
}
function ocrWord(input){
  var box=document.getElementById("nw_ocr"); if(!box) return;
  box.style.display="block";
  box.innerHTML='<div style="font-size:12.5px;color:var(--muted)">🔍 正在识别…（首次较慢，请稍候）</div>';
  ocrFileText(input,"eng",function(txt,err){
    if(err){ box.innerHTML='<div style="color:var(--rose)">识别失败：'+esc(String(err))+'</div>'; return; }
    if(!txt){ box.innerHTML='<div style="color:var(--muted)">没有识别到文字，试试更清晰、端正的图片</div>'; return; }
    var lines=txt.split(/\n+/).map(function(s){return s.trim();}).filter(Boolean);
    box.innerHTML=ocrBoxHtml("nw_ocr_text",lines)
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'
      + '<button class="pill g" onclick="ocrFillWord(1)">1行→单词</button>'
      + '<button class="pill g" onclick="ocrFillWord(2)">2行→释义</button>'
      + '<button class="pill g" onclick="ocrFillWord(3)">全部→例句</button>'
      + '<button class="pill" onclick="document.getElementById(\'nw_ocr\').style.display=\'none\'">收起</button></div>';
  });
}
function ocrFillWord(mode){
  var el=document.getElementById("nw_ocr_text"); if(!el) return;
  var lines=el.value.split(/\n+/).map(function(s){return s.trim();}).filter(Boolean);
  if(mode===1&&lines[0]) document.getElementById("nw_word").value=lines[0];
  else if(mode===2&&lines[1]) document.getElementById("nw_meaning").value=lines[1];
  else if(mode===3&&lines[0]) document.getElementById("nw_example").value=lines.join(" ");
  toast("已填入，可继续编辑");
}
function ocrWrong(input){
  var box=document.getElementById("nw_ocr2"); if(!box) return;
  box.style.display="block";
  box.innerHTML='<div style="font-size:12.5px;color:var(--muted)">🔍 正在识别…（首次较慢，请稍候）</div>';
  ocrFileText(input,"eng+chi_sim",function(txt,err){
    if(err){ box.innerHTML='<div style="color:var(--rose)">识别失败：'+esc(String(err))+'</div>'; return; }
    if(!txt){ box.innerHTML='<div style="color:var(--muted)">没有识别到文字，试试更清晰、端正的图片</div>'; return; }
    var lines=txt.split(/\n+/).map(function(s){return s.trim();}).filter(Boolean);
    box.innerHTML=ocrBoxHtml("nw_ocr2_text",lines)
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'
      + '<button class="pill g" onclick="ocrFillWrong(1)">填入错题简述</button>'
      + '<button class="pill" onclick="document.getElementById(\'nw_ocr2\').style.display=\'none\'">收起</button></div>';
  });
}
function ocrFillWrong(){
  var el=document.getElementById("nw_ocr2_text"); if(!el) return;
  document.getElementById("nw_summary").value=el.value.trim();
  toast("已填入，可继续编辑");
}

/* ---------- 添加表单 ---------- */
function fRow(id,label,inner,lang){
  return '<div class="f-row"><label>'+label+'</label><div class="f-in">'+inner
    + '<button type="button" class="mic" data-vb="'+id+'" onclick="startVoice(\''+id+'\',\''+(lang||"zh-CN")+'\')" title="语音录入">🎤</button></div></div>';
}
function openAddWord(){
  setModal('<h2>📖 添加生词</h2><div class="m-sub">手动填，或用 🎤 语音 / 📷 拍照识别自动填入</div>'
    + fRow("nw_word","单词 *",'<input id="nw_word" placeholder="如：abandon">','en-US')
    + fRow("nw_meaning","释义 *",'<input id="nw_meaning" placeholder="如：v. 放弃，抛弃">','zh-CN')
    + fRow("nw_example","例句",'<input id="nw_example" placeholder="可选">','en-US')
    + '<div class="f-row"><label>拍照识别</label><div class="f-in"><input type="file" id="nw_file" accept="image/*" style="display:none" onchange="ocrWord(this)"><button type="button" class="mic" style="width:auto;padding:0 12px" onclick="document.getElementById(\'nw_file\').click()">📷 拍照/选图识别</button></div></div>'
    + '<div id="nw_ocr" style="display:none;margin-top:8px"></div>'
    + '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn primary" onclick="submitWord()">💾 保存</button><button class="btn" onclick="closeModal()">✕ 取消</button></div>'
    + '<div class="m-sub" style="margin-top:10px">保存后自动同步，约 1-2 分钟看板更新。</div>');
}
function openAddWrong(){
  setModal('<h2>❌ 添加错题</h2><div class="m-sub">手动填，或用 🎤 语音 / 📷 拍照识别自动填入</div>'
    + '<div class="f-row"><label>科目 *</label><div class="f-in"><select id="nw_subject"><option>听力</option><option>阅读</option><option>词汇</option><option>写作</option><option>翻译</option></select></div></div>'
    + '<div class="f-row"><label>出处</label><div class="f-in"><input id="nw_source" placeholder="如：真题2024年12月"><button type="button" class="mic" onclick="startVoice(\'nw_source\',\'zh-CN\')">🎤</button></div></div>'
    + '<div class="f-row"><label>错题简述 *</label><div class="f-in" style="align-items:stretch"><textarea id="nw_summary" rows="2" placeholder="题干 / 原文 / 我的答案…"></textarea><button type="button" class="mic" onclick="startVoice(\'nw_summary\',\'zh-CN\')">🎤</button></div></div>'
    + '<div class="f-row"><label>错因分析</label><div class="f-in" style="align-items:stretch"><textarea id="nw_analysis" rows="2" placeholder="为什么错，下次注意…"></textarea><button type="button" class="mic" onclick="startVoice(\'nw_analysis\',\'zh-CN\')">🎤</button></div></div>'
    + '<div class="f-row"><label>拍照识别</label><div class="f-in"><input type="file" id="nw_file2" accept="image/*" style="display:none" onchange="ocrWrong(this)"><button type="button" class="mic" style="width:auto;padding:0 12px" onclick="document.getElementById(\'nw_file2\').click()">📷 拍照/选图识别</button></div></div>'
    + '<div id="nw_ocr2" style="display:none;margin-top:8px"></div>'
    + '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn primary" onclick="submitWrong()">💾 保存</button><button class="btn" onclick="closeModal()">✕ 取消</button></div>');
}

/* ---------- 提交到写回中转站 ---------- */
var _fb={file:"",md:""};
function submitWord(){
  var w=document.getElementById("nw_word").value.trim();
  var m=document.getElementById("nw_meaning").value.trim();
  if(!w||!m){ toast("请填写单词和释义"); return; }
  postBridge({action:"add_word",word:w,meaning:m,example:document.getElementById("nw_example").value.trim()},"生词已提交");
}
function submitWrong(){
  var s=document.getElementById("nw_summary").value.trim();
  if(!s){ toast("请填写错题简述"); return; }
  postBridge({action:"add_wrong",subject:document.getElementById("nw_subject").value,source:document.getElementById("nw_source").value.trim(),summary:s,analysis:document.getElementById("nw_analysis").value.trim()},"错题已提交");
}
function submitProgress(){
  var dim=document.getElementById("np_dim").value;
  var done=document.getElementById("np_done").value.trim();
  if(done===""){ toast("请填写已完成数量"); return; }
  postBridge({action:"set_progress",dim:dim,done:parseInt(done,10)},"进度已更新");
}
function quickCheckin(){ postBridge({action:"checkin"},"打卡成功 🐾"); }
function markWord(i,status){
  var w=WORDS[i]; if(!w) return;
  postBridge({action:"set_word_status",word:w.word,status:status},status==="已掌握"?"已标记掌握 ✅":"已改回学习中");
}
function postBridge(payload,okMsg){
  if(!BRIDGE.url){ showFallback(payload); return; }
  var body=JSON.stringify(Object.assign({key:BRIDGE.key},payload));
  fetch(BRIDGE.url,{method:"POST",headers:{"Content-Type":"application/json"},body:body})
    .then(function(r){ return r.json().catch(function(){ return {}; }); })
    .then(function(d){
      if(d&&d.ok){ toast((okMsg||"已提交")+"，自动同步后约 1-2 分钟更新"); setTimeout(closeModal,900); }
      else{ toast("保存失败"); showFallback(payload); }
    })
    .catch(function(){ toast("服务未连接"); showFallback(payload); });
}
function rowTextFor(payload){
  if(payload.action==="add_word") return "| "+payload.word+" | "+(payload.meaning||"")+" | "+(payload.example||"")+" | 学习中 | 0 | — |";
  if(payload.action==="add_wrong") return "| "+(payload.subject||"听力")+" | "+(payload.source||"")+" | "+(payload.summary||"")+" | "+(payload.analysis||"")+" | 待复习 |";
  if(payload.action==="set_progress") return "把「"+payload.dim+"」的已完成改为 "+payload.done;
  if(payload.action==="checkin") return "把今天的打卡格改为 ☑";
  return JSON.stringify(payload);
}
function showFallback(payload){
  var map={add_word:"01-词汇/生词表.md",add_wrong:"06-错题本/错题记录模板.md",set_progress:"00-备考总览/备考进度目标.md",checkin:"00-备考总览/每日任务与打卡规则.md"};
  _fb={file:map[payload.action]||"",md:rowTextFor(payload)};
  setModal('<h2>🐾 写回服务未连接</h2>'
    + '<div class="m-sub">看板目前是只读的。要激活手机端保存，需部署写回中转站（见知识库「99-系统与规则/写回服务部署指南.md」）。</div>'
    + '<div style="margin:10px 0;padding:10px;background:var(--card);border:1px solid var(--line);border-radius:10px;font-size:12.5px"><b>要写入的内容：</b><pre style="white-space:pre-wrap;font-size:12px;margin:6px 0 0">'+esc(_fb.md)+'</pre></div>'
    + '<div style="display:flex;flex-direction:column;gap:8px">'
    + '<button class="btn primary" onclick="copyFallback()">📋 复制内容</button>'
    + '<button class="btn" onclick="editFallback()">✏️ 在 GitHub 在线编辑</button>'
    + '</div>'
    + '<div class="m-sub" style="margin-top:10px;text-align:center">或把上面的内容粘贴到豆包，对我说「帮我录进知识库」</div>');
}
function copyFallback(){
  var ta=document.createElement("textarea"); ta.value=_fb.md; document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); toast("已复制"); }catch(e){ toast("复制失败，请手动复制"); }
  document.body.removeChild(ta);
}
function editFallback(){
  if(!_fb.file) return;
  window.open("https://github.com/WenXue-10/CET6-Dashboard/edit/main/"+encodeURIComponent(_fb.file), "_blank");
}

/* ---------- 浮动按钮 & 快捷操作 ---------- */
var FAB_VIEW="home";
function setFab(view){ FAB_VIEW=view; var f=document.getElementById("fab"); if(f) f.style.display=(view==="home"||view==="vocab"||view==="wrong")?"flex":"none"; }
function qa(fn,ic,t,sub){
  return '<div class="note-item" onclick="'+fn+'"><span class="ni-ic">'+ic+'</span><div style="flex:1;min-width:0"><div style="font-weight:800">'+t+'</div><div style="font-size:11.5px;color:var(--muted)">'+sub+'</div></div><span style="color:var(--muted)">→</span></div>';
}
function openFabMenu(){
  if(FAB_VIEW==="vocab"){ openAddWord(); return; }
  if(FAB_VIEW==="wrong"){ openAddWrong(); return; }
  setModal('<h2>🐱 快捷操作</h2><div class="m-sub">手机上也能随时记</div>'
    + qa("quickCheckin()","🐾","今日打卡","标记今天完成 ☑")
    + qa("openQuickProgress()","📈","更新进度","五维目标已完成数")
    + qa("openAddWord()","📖","添加生词","手动 / 拍照 / 语音")
    + qa("openAddWrong()","❌","添加错题","手动 / 拍照 / 语音")
  );
}
function openQuickProgress(){
  var opts=(D.progress||[]).map(function(p){ return '<option value="'+esc(p.dim)+'">'+esc(p.dim)+'（当前 '+p.done+' / '+p.target+'）</option>'; }).join("");
  if(!opts){ toast("暂无进度配置"); return; }
  setModal('<h2>📈 更新备考进度</h2><div class="m-sub">填「已完成」总数（如单词背了 1200 个）</div>'
    + '<div class="f-row"><label>维度</label><div class="f-in"><select id="np_dim">'+opts+'</select></div></div>'
    + '<div class="f-row"><label>已完成</label><div class="f-in"><input id="np_done" type="number" min="0" placeholder="如：1200"></div></div>'
    + '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn primary" onclick="submitProgress()">💾 保存</button><button class="btn" onclick="closeModal()">✕ 取消</button></div>'
  );
}
