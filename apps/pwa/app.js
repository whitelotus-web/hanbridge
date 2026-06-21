/* HanBridge — HSK learning PWA. Vanilla JS, offline-first. */
(() => {
"use strict";
const DATA = window.HSK_DATA || {};
const LEVELS = Object.keys(DATA);            // ["HSK1",...]
const I18N = window.I18N || {};
const STORE_KEY = "hanbridge.v1";
const DAILY_GOAL = 20;                        // reviews/day target
const INTERVALS = [0,1,2,3,5,8,13];           // Leitner box -> days
const KNOWN_BOX = 4;                          // box >= this = "learned"
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const app = $("#app");

/* ---------- State ---------- */
const defState = ()=>({srs:{},xp:0,streak:{count:0,longest:0,last:null},history:{},
  settings:{lang:"vi",theme:"light"},totals:{reviews:0,correct:0}});
let S = load();
function load(){try{const r=JSON.parse(localStorage.getItem(STORE_KEY));return r?{...defState(),...r}:defState();}catch(e){return defState();}}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(S));}
const todayStr = ()=> new Date().toISOString().slice(0,10);
const now = ()=> Date.now();

/* ---------- i18n ---------- */
let LANG = S.settings.lang || "vi";
const t = (k)=> (I18N[LANG] && I18N[LANG][k]) || (I18N.en && I18N.en[k]) || k;
function applyStaticI18n(){ $$("[data-i18n]").forEach(el=> el.textContent = t(el.dataset.i18n)); }

/* ---------- SRS helpers ---------- */
const ckey = (lvl,hz)=> lvl+"#"+hz;
function card(lvl,hz){ return S.srs[ckey(lvl,hz)] || {box:0,due:0,correct:0,wrong:0,seen:false}; }
function allWords(){ const out=[]; LEVELS.forEach(l=> DATA[l].forEach(w=> out.push({lvl:l,w}))); return out; }
function dueList(){
  const out=[];
  allWords().forEach(({lvl,w})=>{ const c=card(lvl,w.hz); if(c.seen && c.due<=now()) out.push({lvl,w,c}); });
  return out.sort((a,b)=>a.c.due-b.c.due);
}
function newList(){ return allWords().filter(({lvl,w})=> !card(lvl,w.hz).seen); }
function studyQueue(limit=20){
  const due = dueList();
  const fresh = newList().slice(0, Math.max(0, limit-due.length));
  return [...due.map(d=>({lvl:d.lvl,w:d.w})), ...fresh].slice(0,limit);
}
function learnedCount(lvl){ return DATA[lvl].filter(w=> card(lvl,w.hz).box>=KNOWN_BOX).length; }
function totalLearned(){ return LEVELS.reduce((a,l)=>a+learnedCount(l),0); }
function totalWords(){ return LEVELS.reduce((a,l)=>a+DATA[l].length,0); }
function reviewsToday(){ return S.history[todayStr()]||0; }

function grade(lvl,hz,correct){
  const k=ckey(lvl,hz); const c=S.srs[k]||{box:0,due:0,correct:0,wrong:0,seen:false};
  c.seen=true;
  if(correct){ c.box=Math.min(INTERVALS.length-1,c.box+1); c.correct++; S.xp+=10; S.totals.correct++; }
  else { c.box=Math.max(0,c.box-1); c.wrong++; S.xp+=2; }
  c.due = now() + INTERVALS[c.box]*86400000;
  S.srs[k]=c;
  S.totals.reviews++;
  const d=todayStr(); S.history[d]=(S.history[d]||0)+1;
  updateStreak();
  save();
}
function updateStreak(){
  const d=todayStr(); const last=S.streak.last;
  if(last===d) return;
  const y=new Date(Date.now()-86400000).toISOString().slice(0,10);
  S.streak.count = (last===y)? S.streak.count+1 : 1;
  S.streak.last=d;
  if(S.streak.count>S.streak.longest) S.streak.longest=S.streak.count;
}

/* ---------- TTS ---------- */
let zhVoice=null, voiceWarned=false;
function pickVoice(){
  const vs = speechSynthesis.getVoices();
  zhVoice = vs.find(v=>/zh[-_]?CN/i.test(v.lang)) || vs.find(v=>/^zh/i.test(v.lang)) || null;
}
if("speechSynthesis" in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
function speak(text){
  if(!("speechSynthesis" in window)) return;
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang="zh-CN"; u.rate=.85; if(zhVoice)u.voice=zhVoice;
    if(!zhVoice && !voiceWarned){ voiceWarned=true; toast(t("tts.none")); }
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- pinyin tone colors ---------- */
const TONE={};
"āēīōūǖ".split("").forEach(c=>TONE[c]=1);"áéíóúǘ".split("").forEach(c=>TONE[c]=2);
"ǎěǐǒǔǚ".split("").forEach(c=>TONE[c]=3);"àèìòùǜ".split("").forEach(c=>TONE[c]=4);
function syllTone(s){ for(const ch of s){ if(TONE[ch])return TONE[ch]; } return 5; }
function colorPinyin(py){
  return py.split(" ").map(s=>`<span class="t${syllTone(s)}">${esc(s)}</span>`).join(" ");
}
const esc=(s)=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));

/* ---------- utils ---------- */
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sample(arr,n,exclude){ const pool=arr.filter(x=>x!==exclude); return shuffle(pool).slice(0,n); }
let toastTimer;
function toast(msg){ const el=$("#toast"); el.textContent=msg; el.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.add("hidden"),2600); }
function meaning(w){ return LANG==="vi"? (w.vi||w.en) : LANG==="zh"? w.en : w.en; }

/* ===================================================================== */
/*  ROUTER                                                               */
/* ===================================================================== */
let activeTimers=[]; let mockTimer=null;
function later(fn,ms){ const id=setTimeout(fn,ms); activeTimers.push(id); return id; }
function clearPending(){ activeTimers.forEach(clearTimeout); activeTimers=[]; if(mockTimer){clearInterval(mockTimer);mockTimer=null;} if("speechSynthesis" in window) speechSynthesis.cancel(); }
function router(){
  clearPending();
  const hash = location.hash.replace(/^#/,"") || "/home";
  const [_, route, arg] = hash.split("/");
  window.scrollTo(0,0);
  setActiveNav(route||"home");
  switch(route){
    case "home": case "": return renderHome();
    case "study": return renderStudy();
    case "flashcards": return renderFlashcards(arg||LEVELS[0]);
    case "quiz": return renderQuizConfig(arg);
    case "mock": return renderMock(arg||LEVELS[0]);
    case "browse": return renderBrowse(arg||LEVELS[0]);
    case "stats": return renderStats();
    default: return renderHome();
  }
}
function setActiveNav(r){ $$(".bottomnav a").forEach(a=>a.classList.toggle("active", a.dataset.nav===r)); }
function go(h){ location.hash=h; }

/* ===================================================================== */
/*  HOME                                                                 */
/* ===================================================================== */
function renderHome(){
  const due = dueList().length;
  const rt = reviewsToday();
  const goalPct = Math.min(100, Math.round(rt/DAILY_GOAL*100));
  const learned = totalLearned();
  app.innerHTML = `
    <section class="hero">
      <h1>${t("home.hi")}</h1>
      <p>${t("home.tagline")}</p>
      <div class="hero-stats">
        <div class="ring-wrap">
          <div class="ring" style="--p:${goalPct}"><i>${rt}/${DAILY_GOAL}</i></div>
          <div><div style="font-weight:800">${t("home.today")}</div><div style="font-size:.78rem;opacity:.9">${t("home.goal")}</div></div>
        </div>
        <div class="hstat"><b>🔥 ${S.streak.count}</b><span>${t("home.streak")} (${t("home.days")})</span></div>
        <div class="hstat"><b>${learned}</b><span>${t("home.learned")} ${t("home.words")}</span></div>
        <div class="hstat"><b>${S.xp}</b><span>XP</span></div>
      </div>
    </section>

    <div class="banner" style="margin-top:18px">
      <div class="b-left">
        <div class="due-num">${due}</div>
        <div>
          <div style="font-weight:800">${t("home.studyToday")}</div>
          <div class="muted" style="font-size:.85rem">${due>0? due+" "+t("home.cardsDue") : t("home.noDue")}</div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="location.hash='/study'">${t("home.studyToday")} →</button>
    </div>

    <h3 class="section-title">${t("home.levels")}</h3>
    <div class="card-grid">
      ${LEVELS.map(l=>{
        const total=DATA[l].length, lc=learnedCount(l), pct=Math.round(lc/total*100);
        return `<div class="card lvl-card tap">
          <div class="lvl-top"><span class="lvl-badge grad-text">${l}</span><span class="chip">${lc}${t("lvl.of")}${total}</span></div>
          <div class="pbar"><i style="width:${pct}%"></i></div>
          <div class="muted" style="font-size:.75rem;margin-top:6px">${pct}% ${t("lvl.progress")}</div>
          <div class="lvl-actions">
            <button class="btn sm btn-primary" onclick="location.hash='/flashcards/${l}'">🎴 ${t("home.flashcards")}</button>
            <button class="btn sm" onclick="location.hash='/quiz/${l}'">✍️ ${t("home.quiz")}</button>
            <button class="btn sm" onclick="location.hash='/browse/${l}'">📖 ${t("home.browse")}</button>
            <button class="btn sm" onclick="location.hash='/mock/${l}'">⏱️ ${t("home.mock")}</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

/* ===================================================================== */
/*  FLASHCARDS / STUDY (SRS)                                             */
/* ===================================================================== */
function renderFlashcards(lvl){ startSession(DATA[lvl]? DATA[lvl].map(w=>({lvl,w})):[], `${lvl} · ${t("home.flashcards")}`, "#/home"); }
function renderStudy(){
  const q = studyQueue(DAILY_GOAL);
  if(!q.length){ app.innerHTML = pageHead(t("home.studyToday"),"#/home")+`<div class="empty">✅<br>${t("home.allDone")}</div>`; return; }
  startSession(q, t("home.studyToday"), "#/home");
}
function startSession(items, title, back){
  if(!items.length){ app.innerHTML = pageHead(title,back)+`<div class="empty">${t("fc.empty")}</div>`; return; }
  const deck = shuffle(items); let i=0, reviewed=0;
  function draw(){
    if(i>=deck.length){
      app.innerHTML = pageHead(title,back)+`<div class="empty">🎉<br><b>${t("fc.done")}</b><br><span class="muted">${reviewed} ${t("fc.reviewed")} · +${reviewed} XP</span><br><br>
        <button class="btn btn-primary" onclick="location.hash='/home'">${t("quiz.home")}</button></div>`;
      if(reviewsToday()>=DAILY_GOAL) toast(t("goal.done"));
      return;
    }
    const {lvl,w}=deck[i];
    app.innerHTML = pageHead(title,back)+`
      <div class="fc-stage">
        <div class="fc-progress pbar"><i style="width:${Math.round(i/deck.length*100)}%"></i></div>
        <div class="flashcard" id="fcard">
          <div class="fc-inner">
            <div class="fc-face">
              <div class="fc-hz">${esc(w.hz)}</div>
              <button class="btn sm" id="playFront">${t("common.play")}</button>
              <div class="fc-hint">${t("fc.tapFlip")}</div>
            </div>
            <div class="fc-face fc-back">
              <div class="fc-py">${colorPinyin(w.py)}</div>
              <div class="fc-en">${esc(meaning(w))}</div>
              ${LANG!=="vi"&&w.vi?`<div class="fc-vi">${esc(w.vi)}</div>`:LANG==="vi"?`<div class="fc-vi">${esc(w.en)}</div>`:""}
              <div class="fc-hint" style="color:rgba(255,255,255,.7)">${t("fc.tapFlip")}</div>
            </div>
          </div>
        </div>
        <div class="fc-controls">
          <button class="btn dunno-btn" id="dunno">✗ ${t("fc.dunno")}</button>
          <button class="btn know-btn" id="know">✓ ${t("fc.know")}</button>
        </div>
      </div>`;
    const cardEl=$("#fcard");
    cardEl.addEventListener("click",e=>{ if(e.target.id==="playFront")return; cardEl.classList.toggle("flipped"); if(cardEl.classList.contains("flipped")) speak(w.hz); });
    $("#playFront").addEventListener("click",e=>{e.stopPropagation();speak(w.hz);});
    speak(w.hz);
    const next=(ok)=>{ grade(lvl,w.hz,ok); reviewed++; i++; draw(); };
    $("#know").addEventListener("click",()=>next(true));
    $("#dunno").addEventListener("click",()=>next(false));
  }
  draw();
}

/* ===================================================================== */
/*  QUIZ                                                                 */
/* ===================================================================== */
let quizCfg={lvl:LEVELS[0],mode:"hz2mean",len:10};
function renderQuizConfig(preLvl){
  if(preLvl && DATA[preLvl]) quizCfg.lvl=preLvl;
  app.innerHTML = pageHead(t("quiz.title"),"#/home")+`
    <p class="muted" style="margin:0 0 14px">${t("quiz.choose")}</p>
    <div class="field"><label>${t("home.levels")}</label>
      <div class="seg" id="qLvl">${LEVELS.map(l=>`<button data-v="${l}" class="${l===quizCfg.lvl?'active':''}">${l}</button>`).join("")}</div></div>
    <div class="field"><label>${t("quiz.title")}</label>
      <div class="seg" id="qMode">
        <button data-v="hz2mean" class="${quizCfg.mode==='hz2mean'?'active':''}">${t("quiz.modeHzMean")}</button>
        <button data-v="mean2hz" class="${quizCfg.mode==='mean2hz'?'active':''}">${t("quiz.modeMeanHz")}</button>
        <button data-v="audio" class="${quizCfg.mode==='audio'?'active':''}">${t("quiz.modeAudio")}</button>
      </div></div>
    <div class="field"><label>${t("quiz.len")}</label>
      <div class="seg" id="qLen">${[5,10,15].map(n=>`<button data-v="${n}" class="${quizCfg.len===n?'active':''}">${n}</button>`).join("")}</div></div>
    <button class="btn btn-primary btn-block" id="qStart">${t("quiz.start")} →</button>`;
  segPick("#qLvl",v=>quizCfg.lvl=v);
  segPick("#qMode",v=>quizCfg.mode=v);
  segPick("#qLen",v=>quizCfg.len=parseInt(v));
  $("#qStart").addEventListener("click",()=>runQuiz());
}
function segPick(sel,cb){ $$(sel+" button").forEach(b=>b.addEventListener("click",()=>{ $$(sel+" button").forEach(x=>x.classList.remove("active")); b.classList.add("active"); cb(b.dataset.v); })); }

function buildQuestions(lvl,mode,len){
  const pool=DATA[lvl]; const words=shuffle(pool).slice(0,Math.min(len,pool.length));
  return words.map(w=>{
    const isHz = mode==="mean2hz";
    const distract = sample(pool,3,w);
    const opts = shuffle([w,...distract]);
    return {w,mode,opts,
      prompt: mode==="mean2hz"? meaning(w) : w.hz,
      sub: mode==="hz2mean"? colorPinyin(w.py) : "",
      audio: mode==="audio",
      answer: mode==="mean2hz"? (o)=>o.hz : (o)=>meaning(o),
      correct:w};
  });
}
function runQuiz(){
  const qs=buildQuestions(quizCfg.lvl,quizCfg.mode,quizCfg.len);
  let i=0,score=0; const wrongLog=[];
  function draw(){
    if(i>=qs.length) return quizResult(score,qs.length,wrongLog,()=>runQuiz());
    const q=qs[i];
    app.innerHTML = pageHead(t("quiz.title"),"#/quiz")+`
      <div class="q-head"><span class="muted">${t("quiz.question")} ${i+1}/${qs.length}</span><span class="muted">${t("quiz.score")}: ${score}</span></div>
      <div class="pbar" style="margin-bottom:14px"><i style="width:${Math.round(i/qs.length*100)}%"></i></div>
      ${q.audio? `<div style="text-align:center;margin:24px 0"><button class="btn btn-primary" id="qplay" style="font-size:1.3rem;padding:18px 30px">🔊</button></div>`
               : `<div class="q-prompt">${q.mode==='hz2mean'?esc(q.prompt):esc(q.prompt)}</div>${q.sub?`<div class="q-sub">${q.sub}</div>`:""}`}
      <div id="opts">${q.opts.map((o,ix)=>`<button class="opt" data-ix="${ix}"><span class="ix">${"ABCD"[ix]}</span><span>${esc(q.answer(o))}</span></button>`).join("")}</div>`;
    if(q.audio){ const p=()=>speak(q.correct.hz); $("#qplay").addEventListener("click",p); setTimeout(p,250); }
    $$("#opts .opt").forEach(btn=>btn.addEventListener("click",()=>{
      const ix=+btn.dataset.ix; const chosen=q.opts[ix]; const ok=chosen===q.correct;
      $$("#opts .opt").forEach((b,bi)=>{ b.disabled=true; if(q.opts[bi]===q.correct)b.classList.add("correct"); else if(bi===ix)b.classList.add("wrong"); });
      grade(quizCfg.lvl,q.correct.hz,ok);
      if(ok){score++; toast("✅ "+t("quiz.correct"));} else { wrongLog.push(q); toast("❌ "+t("quiz.wrong")); }
      speak(q.correct.hz);
      later(()=>{i++;draw();}, ok?700:1200);
    }));
  }
  draw();
}
function quizResult(score,total,wrongLog,retry){
  const pct=Math.round(score/total*100);
  app.innerHTML = pageHead(t("quiz.result"),"#/home")+`
    <div class="result">
      <div class="score-ring" style="--p:${pct}"><i>${pct}%</i></div>
      <div class="big">${score}/${total}</div>
      <p class="muted">${t("quiz.accuracy")}: ${pct}%</p>
      <div class="btn-row" style="justify-content:center;margin-top:18px">
        <button class="btn btn-primary" id="rt">${t("quiz.retry")}</button>
        <button class="btn" onclick="location.hash='/home'">${t("quiz.home")}</button>
      </div>
    </div>
    ${wrongLog.length?`<h3 class="section-title">${t("mock.review")}</h3>
      <div class="table-wrapper"><table><tbody>
      ${wrongLog.map(q=>`<tr><td class="hz">${esc(q.correct.hz)}</td><td>${colorPinyin(q.correct.py)}</td><td>${esc(meaning(q.correct))}</td></tr>`).join("")}
      </tbody></table></div>`:""}`;
  $("#rt").addEventListener("click",retry);
}

/* ===================================================================== */
/*  MOCK TEST (timed, mixed)                                             */
/* ===================================================================== */
function renderMock(lvl){
  app.innerHTML = pageHead(t("mock.title"),"#/home")+`
    <div class="card"><div class="lvl-badge grad-text" style="font-size:1.3rem">${lvl}</div>
      <p class="muted">${t("mock.desc")}</p>
      <div class="muted" style="font-size:.85rem">${t("mock.time")}: 20 ${t("home.cardsDue").includes("thẻ")?"":""}${LANG==='vi'?'câu · 6 phút':LANG==='zh'?'题 · 6 分钟':'questions · 6 min'}</div>
      <button class="btn btn-primary btn-block" id="mStart" style="margin-top:16px">${t("mock.start")} →</button>
    </div>`;
  $("#mStart").addEventListener("click",()=>runMock(lvl));
}
function runMock(lvl){
  const N=Math.min(20,DATA[lvl].length); const DUR=6*60;
  const modes=["hz2mean","mean2hz","audio"];
  const qs=[]; const words=shuffle(DATA[lvl]).slice(0,N);
  words.forEach(w=>{ const mode=modes[Math.floor(Math.random()*modes.length)]; const opts=shuffle([w,...sample(DATA[lvl],3,w)]);
    qs.push({w,mode,opts,prompt:mode==='mean2hz'?meaning(w):w.hz,sub:mode==='hz2mean'?colorPinyin(w.py):"",audio:mode==='audio',
      answer:mode==='mean2hz'?(o)=>o.hz:(o)=>meaning(o),correct:w}); });
  let i=0; const answers=new Array(qs.length).fill(null); let left=DUR;
  function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
  function finish(){ if(mockTimer){clearInterval(mockTimer);mockTimer=null;} let score=0; qs.forEach((q,ix)=>{ if(answers[ix]===q.correct){score++; grade(lvl,q.correct.hz,true);} else grade(lvl,q.correct.hz,false); }); mockResult(lvl,score,qs,answers); }
  function draw(){
    if(i>=qs.length) return finish();
    const q=qs[i];
    app.innerHTML = `<div class="backlink" onclick="location.hash='/home'">${t("common.back")}</div>
      <div class="q-head"><span class="muted">${t("quiz.question")} ${i+1}/${qs.length}</span><span id="clock" class="chip">⏱ ${fmt(left)}</span></div>
      <div class="pbar" style="margin-bottom:14px"><i style="width:${Math.round(i/qs.length*100)}%"></i></div>
      ${q.audio? `<div style="text-align:center;margin:24px 0"><button class="btn btn-primary" id="qplay" style="font-size:1.3rem;padding:18px 30px">🔊</button></div>`
               : `<div class="q-prompt">${esc(q.prompt)}</div>${q.sub?`<div class="q-sub">${q.sub}</div>`:""}`}
      <div id="opts">${q.opts.map((o,ix)=>`<button class="opt" data-ix="${ix}"><span class="ix">${"ABCD"[ix]}</span><span>${esc(q.answer(o))}</span></button>`).join("")}</div>
      <div class="btn-row" style="margin-top:8px"><button class="btn" id="skip">${t("common.next")}</button></div>`;
    if(q.audio){ const p=()=>speak(q.correct.hz); $("#qplay").addEventListener("click",p); setTimeout(p,250); }
    $$("#opts .opt").forEach(btn=>btn.addEventListener("click",()=>{ answers[i]=q.opts[+btn.dataset.ix]; i++; draw(); }));
    $("#skip").addEventListener("click",()=>{i++;draw();});
  }
  mockTimer=setInterval(()=>{ left--; const c=$("#clock"); if(c)c.textContent="⏱ "+fmt(left); if(left<=0){ toast(t("mock.timeup")); finish(); } },1000);
  draw();
}
function mockResult(lvl,score,qs,answers){
  const pct=Math.round(score/qs.length*100); const pass=pct>=60;
  app.innerHTML = pageHead(t("mock.title"),"#/home")+`
    <div class="result">
      <div class="score-ring" style="--p:${pct}"><i>${pct}%</i></div>
      <div class="big ${pass?'pass':'fail'}">${pass?t("mock.passed"):t("mock.failed")}</div>
      <p class="muted">${score}/${qs.length} · ${t("quiz.accuracy")}: ${pct}%</p>
      <div class="btn-row" style="justify-content:center;margin-top:16px">
        <button class="btn btn-primary" onclick="location.hash='/mock/${lvl}'">${t("quiz.retry")}</button>
        <button class="btn" onclick="location.hash='/home'">${t("quiz.home")}</button>
      </div>
    </div>
    <h3 class="section-title">${t("mock.review")}</h3>
    <div class="table-wrapper"><table>
      <thead><tr><th>${t("browse.hz")}</th><th>${t("browse.py")}</th><th>${t("mock.correctAns")}</th><th>${t("mock.yourAns")}</th></tr></thead>
      <tbody>${qs.map((q,ix)=>{const ans=answers[ix];const ok=ans===q.correct;
        return `<tr><td class="hz">${esc(q.correct.hz)}</td><td>${colorPinyin(q.correct.py)}</td>
          <td style="color:var(--ok)">${esc(meaning(q.correct))}</td>
          <td style="color:${ok?'var(--ok)':'var(--bad)'}">${ans?esc(meaning(ans)===meaning(q.correct)?meaning(ans):(q.mode==='mean2hz'?ans.hz:meaning(ans))):'—'}</td></tr>`;
      }).join("")}</tbody></table></div>`;
}

/* ===================================================================== */
/*  BROWSE                                                               */
/* ===================================================================== */
function renderBrowse(lvl){
  const draw=(filter="")=>{
    const f=filter.trim().toLowerCase();
    const rows=DATA[lvl].filter(w=> !f || w.hz.includes(f)||w.py.toLowerCase().includes(f)||w.en.toLowerCase().includes(f)||(w.vi||"").toLowerCase().includes(f));
    $("#browseBody").innerHTML = rows.map(w=>{ const c=card(lvl,w.hz); const st= c.box>=KNOWN_BOX?"known":(c.seen?"learning":"new");
      return `<tr><td><button class="mini-play" data-hz="${esc(w.hz)}">🔊</button></td>
        <td class="hz">${esc(w.hz)}</td><td>${colorPinyin(w.py)}</td>
        <td>${esc(w.vi||w.en)}<div class="muted" style="font-size:.78rem">${esc(w.en)}</div></td>
        <td><span class="st ${st}">${t("browse."+st)}</span></td></tr>`;}).join("");
    $$("#browseBody .mini-play").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.hz)));
  };
  app.innerHTML = pageHead(lvl+" · "+t("browse.title"),"#/home")+`
    <div class="seg" id="brLvl" style="margin-bottom:12px">${LEVELS.map(l=>`<button data-v="${l}" class="${l===lvl?'active':''}">${l}</button>`).join("")}</div>
    <div class="toolbar"><input class="search" id="brSearch" placeholder="${t("browse.search")}" /></div>
    <div class="table-wrapper"><table>
      <thead><tr><th></th><th>${t("browse.hz")}</th><th>${t("browse.py")}</th><th>${t("browse.mean")}</th><th>${t("browse.status")}</th></tr></thead>
      <tbody id="browseBody"></tbody></table></div>`;
  segPick("#brLvl",v=>go("/browse/"+v));
  $("#brSearch").addEventListener("input",e=>draw(e.target.value));
  draw();
}

/* ===================================================================== */
/*  STATS                                                                */
/* ===================================================================== */
function renderStats(){
  const acc = S.totals.reviews? Math.round(S.totals.correct/S.totals.reviews*100):0;
  // last 28 days heat
  const days=[]; for(let d=27;d>=0;d--){ const key=new Date(Date.now()-d*86400000).toISOString().slice(0,10); days.push(S.history[key]||0); }
  const heat=days.map(n=>{const l=n===0?0:n<5?1:n<10?2:n<20?3:4;return `<i class="${l?'lvl'+l:''}" title="${n}"></i>`;}).join("");
  app.innerHTML = pageHead(t("stats.title"),"#/home")+`
    <div class="stat-grid">
      <div class="stat-card"><b>${totalLearned()}</b><span>${t("stats.totalLearned")} ${t("lvl.of")}${totalWords()}</span></div>
      <div class="stat-card"><b>🔥 ${S.streak.longest}</b><span>${t("stats.streak")}</span></div>
      <div class="stat-card"><b>${acc}%</b><span>${t("stats.accuracy")}</span></div>
      <div class="stat-card"><b>${S.totals.reviews}</b><span>${t("stats.reviews")}</span></div>
      <div class="stat-card"><b>${S.xp}</b><span>${t("stats.xp")}</span></div>
    </div>
    <h3 class="section-title">${t("stats.heat")}</h3>
    <div class="card"><div class="heat">${heat}</div></div>
    <h3 class="section-title">${t("stats.byLevel")}</h3>
    <div class="card">
      ${LEVELS.map(l=>{const tot=DATA[l].length,lc=learnedCount(l),p=Math.round(lc/tot*100);
        return `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:.85rem;font-weight:700"><span>${l}</span><span class="muted">${lc}/${tot}</span></div><div class="pbar"><i style="width:${p}%"></i></div></div>`;}).join("")}
    </div>
    <button class="btn btn-block" id="resetBtn" style="margin-top:18px;color:var(--bad);border-color:var(--bad)">${t("stats.reset")}</button>`;
  $("#resetBtn").addEventListener("click",()=>{ if(confirm(t("stats.resetConfirm"))){ S=defState(); S.settings.lang=LANG; save(); router(); } });
}

/* ---------- shared ---------- */
function pageHead(title,back){ return `<a class="backlink" href="${back}">${t("common.back")}</a><div class="pagehead"><h2>${esc(title)}</h2></div>`; }

/* ===================================================================== */
/*  CHROME: theme, lang, install, SW                                     */
/* ===================================================================== */
function applyTheme(){ document.documentElement.classList.toggle("dark", S.settings.theme==="dark"); $("#themeBtn").textContent = S.settings.theme==="dark"?"☀️":"🌙"; }
$("#themeBtn").addEventListener("click",()=>{ S.settings.theme = S.settings.theme==="dark"?"light":"dark"; save(); applyTheme(); });
$("#langSel").addEventListener("change",e=>{ LANG=e.target.value; S.settings.lang=LANG; save(); document.documentElement.lang=LANG; applyStaticI18n(); router(); });

let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredPrompt=e; $("#installBtn").classList.remove("hidden"); });
$("#installBtn").addEventListener("click",async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("#installBtn").classList.add("hidden"); } });

if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }

/* ---------- boot ---------- */
$("#langSel").value=LANG; document.documentElement.lang=LANG;
applyTheme(); applyStaticI18n();
window.addEventListener("hashchange",router);
if(!location.hash) location.hash="/home"; else router();
})();
