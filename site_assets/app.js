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
function renderVocab(){
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
    + '<div class="m-sec">📌 状态</div><p style="font-size:13.5px">'+esc(w.status||"学习中")+' · 复习 '+esc(w.review||0)+' 次 · 上次复习 '+esc(w.last||"—")+'</p>');
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
  applyBg(); applyAv();
})();
