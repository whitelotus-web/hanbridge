// HanBridge PWA Engine
(() => {
"use strict";
const C = window.HB_CONTENT || {levels:[],vocab:{}};
const LEVELS = C.levels.map(l=>l.code);
const I18N = window.I18N || {};
const STORE_KEY = "hanbridge.v2";
const DAILY_GOAL = 20; const INTERVALS = [0,1,2,3,5,8,13]; const KNOWN_BOX = 4;
const $ = (s,r=document)=>r.querySelector(s); const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const app = $("#app");

let S = load();
function load(){try{const r=JSON.parse(localStorage.getItem(STORE_KEY));return r?{...defState(),...r}:defState();}catch(e){return defState();}}
function defState(){return {srs:{},xp:0,streak:{count:0,last:null},history:{},settings:{lang:"vi",theme:"light"},totals:{reviews:0,correct:0},secProg:{}};}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(S));}
const todayStr = ()=> new Date().toISOString().slice(0,10);
const now = ()=> Date.now();

let LANG = S.settings.lang || "vi";
const t = (k)=> (I18N[LANG] && I18N[LANG][k]) || (I18N.en && I18N.en[k]) || k;
const tl = (obj)=> obj? (obj[LANG]||obj.en||obj.zh||"") : "";
function applyStaticI18n(){ $$("[data-i18n]").forEach(el=> el.textContent = t(el.dataset.i18n)); }

const TONE={}; "āēīōūǖ".split("").forEach(c=>TONE[c]=1);"áéíóúǘ".split("").forEach(c=>TONE[c]=2);"ǎěǐǒǔǚ".split("").forEach(c=>TONE[c]=3);"àèìòùǜ".split("").forEach(c=>TONE[c]=4);
function colorPy(py){ return (py||"").split(" ").map(s=>{let n=5;for(const c of s)if(TONE[c])n=TONE[c];return `<span class="t${n}">${esc(s)}</span>`;}).join(" "); }
const esc=(s)=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
const shuffle=(a)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
let toastTimer; function toast(m){ const el=$("#toast"); el.textContent=m; el.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.add("hidden"),2500); }

let activeTimers=[]; let mockTimer=null;
function later(fn,ms){ const id=setTimeout(fn,ms); activeTimers.push(id); return id; }
function clearPending(){ activeTimers.forEach(clearTimeout); activeTimers=[]; if(mockTimer){clearInterval(mockTimer);mockTimer=null;} if("speechSynthesis" in window) speechSynthesis.cancel(); }

let zhVoice=null;
function pickVoice(){ const vs=speechSynthesis.getVoices(); zhVoice=vs.find(v=>/zh[-_]?CN/i.test(v.lang))||vs.find(v=>/^zh/i.test(v.lang))||null; }
if("speechSynthesis" in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
function speak(txt){
  if(!("speechSynthesis" in window)) return;
  try{speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(txt); u.lang="zh-CN"; u.rate=.85; if(zhVoice)u.voice=zhVoice; speechSynthesis.speak(u);}catch(e){}
}

/* ---- testimonials + news (original copy) ---- */
const REVIEWS=[
 {n:"Minh Anh",lv:"HSK5",sc:274,vi:"Mình tự học và đạt HSK5 nhờ luyện đề mỗi ngày trên app. Phát âm mẫu cực hữu ích!",en:"I self-studied and passed HSK5 thanks to daily practice here. The audio is super helpful!",zh:"我每天用这个App刷题，顺利通过了HSK5！"},
 {n:"Carlos",lv:"HSK4",sc:268,vi:"Cách chia bài theo từng dạng câu giúp mình tiến bộ rất nhanh.",en:"Splitting practice by question type made me improve fast.",zh:"按题型练习让我进步很快。"},
 {n:"Thu Hà",lv:"HSK3",sc:285,vi:"Flashcard lặp lại ngắt quãng giúp mình nhớ từ lâu hơn hẳn.",en:"The spaced-repetition flashcards made vocab stick much longer.",zh:"间隔重复闪卡让我记得更牢。"},
 {n:"Daniel",lv:"HSK6",sc:262,vi:"Thi thử tính giờ giống phòng thi thật, mình bớt run hẳn khi thi.",en:"Timed mock tests felt like the real exam — I was way calmer on test day.",zh:"计时模拟考很像真实考场，让我考试时不再紧张。"},
 {n:"Yuki",lv:"HSK4",sc:280,vi:"Giao diện gọn gàng, học offline trên điện thoại rất tiện.",en:"Clean interface and it works offline on my phone — very convenient.",zh:"界面简洁，手机离线也能学，很方便。"},
 {n:"Phương",lv:"HSK5",sc:287,vi:"Mình thích phần ngữ pháp có ví dụ và phát âm đi kèm.",en:"I love the grammar section with examples and audio.",zh:"我喜欢带例句和发音的语法部分。"},
];
function reviewsHTML(){ return REVIEWS.map(r=>`
  <div class="tcard"><div class="top"><div class="av">${esc(r.n[0])}</div><div><div class="nm">${esc(r.n)}</div><div class="sc">${r.lv} · ${r.sc} pts</div></div></div>
  <div class="stars">★★★★★</div><p>${esc(r[LANG]||r.en)}</p></div>`).join(""); }
const NEWS={
 vi:["Lịch thi HSK & HSKK năm nay","Cách mở rộng vốn từ tiếng Trung hiệu quả","Mẹo nâng cao kỹ năng nghe HSK","HSK 3.0: những thay đổi cần biết"],
 en:["This year's HSK & HSKK exam dates","Effective ways to expand your Chinese vocabulary","Tips to boost your HSK listening","HSK 3.0: the changes you should know"],
 zh:["今年 HSK 与 HSKK 考试日期","高效扩展中文词汇的方法","提升 HSK 听力的技巧","HSK 3.0：你需要了解的变化"]
};
function newsHTML(){ const d=["2024-06-01","2024-05-18","2024-05-02","2024-04-20"]; return (NEWS[LANG]||NEWS.en).map((n,i)=>`<div class="news-item"><span>${esc(n)}</span><span class="dt">${d[i]}</span></div>`).join(""); }

/* ================== ROUTER ================== */
function router(){
  clearPending();
  const hash = location.hash.replace(/^#/,"") || "/home";
  const [_, route, arg1, arg2] = hash.split("/");
  window.scrollTo(0,0);
  $$(".bottomnav a").forEach(a=>a.classList.toggle("active", a.dataset.nav===route));
  $("#navLinks").classList.remove("open");
  switch(route){
    case "home": case "": return renderHome();
    case "levels": return renderLevels();
    case "lvl": return renderLevelDetail(arg1);
    case "skill": return renderSkill(arg1,arg2);
    case "sec": return renderSection(arg1,arg2);
    case "tests": return renderTests(arg1);
    case "mock": return runMock(arg1,arg2); // arg1=lvl, arg2=set/type
    case "vocab": return renderVocab(arg1);
    case "flashcards": return runFlashcards(arg1);
    case "study": return runStudy();
    case "progress": return renderProgress();
    case "grammar": return renderGrammar(arg1);
    case "speaking": return renderSpeaking(arg1);
    case "about": return renderAbout();
    case "vip": return renderVIP();
    case "tutoring": return renderTutoring();
    case "login": return renderLogin();
    default: return renderHome();
  }
}

/* ================== HOME (Marketing) ================== */
function renderHome(){
  app.innerHTML = `
    <section class="hero"><div class="hero-grid">
      <div>
        <span class="hero-kicker">${t("hero.kicker")}</span>
        <h1>${t("hero.title")}</h1>
        <p>${t("hero.sub")}</p>
        <div class="hero-cta"><a href="#/levels" class="btn btn-white">${t("hero.cta")}</a></div>
        <div class="stores"><div class="store"><span>📱</span><div><small>Download on the</small>App Store</div></div><div class="store"><span>▶️</span><div><small>GET IT ON</small>Google Play</div></div></div>
      </div>
      <div class="phone"><div class="pscreen"><div class="ph-hz">汉</div><div style="font-weight:700">HanBridge</div><div class="pbar" style="width:80%;margin-top:0"><i style="width:65%"></i></div></div></div>
    </div></section>
    
    <section class="section bg-soft"><div class="wrap">
      <div class="section-head"><span class="eyebrow">${t("anywhere.title")}</span><h2>${t("spec.title")}</h2></div>
      <div class="feat-grid">
        <div class="feat"><div class="ico">📝</div><h3>${t("spec.tests")}</h3><p>${t("spec.testsDesc")}</p></div>
        <div class="feat"><div class="ico">🗂️</div><h3>${t("spec.vocab")}</h3><p>${t("spec.vocabDesc")}</p></div>
        <div class="feat"><div class="ico">🎧</div><h3>${t("spec.lrw")}</h3><p>${t("spec.lrwDesc")}</p></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><span class="eyebrow">${t("anywhere.title")}</span><h2>${t("anywhere.title")}</h2></div>
      <div class="tutor" style="grid-template-columns:1fr 1fr">
        <div class="tutor-row"><div class="n">1</div><div><b>${t("anywhere.course")}</b><div class="muted" style="font-size:.85rem">${t("anywhere.courseDesc")}</div></div></div>
        <div class="tutor-row"><div class="n">2</div><div><b>${t("anywhere.ai")}</b><div class="muted" style="font-size:.85rem">${t("anywhere.aiDesc")}</div></div></div>
      </div>
    </div></section>

    <section class="section bg-soft"><div class="wrap">
      <div class="section-head"><h2>${t("tutor.title")}</h2><p>${t("tutor.title")} (VIP)</p></div>
      <div class="tutor">
        <div class="tutor-row"><div class="n">⭐</div><b>${t("tutor.p1")}</b></div>
        <div class="tutor-row"><div class="n">💡</div><b>${t("tutor.p2")}</b></div>
        <div class="tutor-row"><div class="n">📊</div><b>${t("tutor.p3")}</b></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><h2>⭐ ${t("home.reviews")}</h2></div>
      <div class="tcards">${reviewsHTML()}</div>
      <div style="text-align:center;margin-top:24px"><a href="#/levels" class="btn btn-primary">${t("home.cta3")}</a></div>
    </div></section>

    <section class="section bg-soft"><div class="wrap">
      <div class="section-head"><h2>📰 ${t("news.title")}</h2></div>
      <div class="news-grid">${newsHTML()}</div>
    </div></section>

    <div class="corp"><h2>${t("corp.title")}</h2><p>${t("corp.desc")}</p><button class="btn btn-white">${t("corp.cta")}</button></div>
    
    <footer class="footer"><div class="footer-inner">
      <div class="brand"><svg class="brand-mark" viewBox="0 0 48 48"><use href="#hb-grad"/><path d="M6 34c8 0 12-12 18-12s10 12 18 12" stroke="var(--brand)" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M8 34v6M40 34v6M24 22v18" stroke="var(--brand)" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="13" r="4" fill="var(--brand)"/></svg><span class="brand-name">HanBridge</span></div>
      <p style="margin:0">${t("foot.tagline")}</p>
      <div class="fcols"><span>${t("nav.about")}</span><span>${t("nav.tutoring")}</span><span>Privacy Policy</span><span>Terms & Conditions</span></div>
      <div class="muted" style="font-size:.75rem">${t("foot.rights").replace("{year}",new Date().getFullYear())}</div>
    </div></footer>
  `;
}

/* ================== LEVELS ================== */
function renderLevels(){
  app.innerHTML = `
    <div class="section"><div class="wrap">
      <div class="section-head"><h2>${t("levels.title")}</h2><p>${t("levels.sub")}</p></div>
      <div class="lv-grid">
        ${C.levels.map(l=>`
          <div class="lv-card" onclick="location.hash='/lvl/${l.code}'">
            <div class="lv-badge grad-text">${l.code}<span class="lv-cefr">${l.cefr}</span></div>
            <div class="lv-meta">${l.words} ${t("levels.words")}</div>
            <button class="btn btn-block btn-primary" style="margin-top:16px">${t("levels.open")}</button>
          </div>
        `).join("")}
      </div>
    </div></div>`;
}

/* ================== LEVEL DETAIL ================== */
function renderLevelDetail(lvl){
  const meta = C.levels.find(l=>l.code===lvl);
  if(!meta) return router();
  app.innerHTML = `
    <div class="lvl-banner"><div class="wrap2">
      <a href="#/levels" style="color:rgba(255,255,255,.8);font-size:.85rem;font-weight:600;display:inline-block;margin-bottom:12px">← ${t("nav.levels")}</a>
      <h1>${lvl}</h1><p>${t("lvl.about")}: ${meta.cefr}. ${t("lvl.content")}: ${meta.dur} ${t("lvl.minutes")}.</p>
    </div></div>
    <div class="skill-cards">
      ${meta.skillOrder.map(sk=>{
        const icons={"listening":"🎧","reading":"📖","writing":"✍️","translate":"🌐","grammar":"📘","speaking":"🗣️","tests":"📝"};
        if(sk==="tests") return `<div class="skill-card" onclick="location.hash='/tests/${lvl}'"><div class="si">${icons[sk]}</div><div class="sl">${t("lvl."+sk)}</div><div class="sp">${t("tests.mock")}</div></div>`;
        if(sk==="grammar"){ const gc=(C.grammar[lvl]||[]).length; return `<div class="skill-card" onclick="location.hash='/grammar/${lvl}'"><div class="si">${icons[sk]}</div><div class="sl">${t("lvl.grammar")}</div><div class="sp">${gc} points</div></div>`; }
        if(sk==="speaking"){ const sc=(C.speak[lvl]||[]).length; return `<div class="skill-card" onclick="location.hash='/speaking/${lvl}'"><div class="si">${icons[sk]}</div><div class="sl">${t("lvl.speaking")}</div><div class="sp">${sc} prompts</div></div>`; }
        const count=meta.skills[sk]? meta.skills[sk].length : 0;
        return `<div class="skill-card" onclick="location.hash='/skill/${lvl}/${sk}'"><div class="si">${icons[sk]}</div><div class="sl">${t("lvl."+sk)}</div><div class="sp">${count} sections</div></div>`;
      }).join("")}
      <div class="skill-card" onclick="location.hash='/vocab/${lvl}'"><div class="si">🗂️</div><div class="sl">${t("lvl.vocab")}</div><div class="sp">${meta.words} words</div></div>
    </div>
    <div class="info-grid">
      <div class="info-card"><div class="num">01</div><h3>${t("lvl.skills")}</h3><ul>${meta.skillOrder.map(s=>`<li>${t("lvl."+s)}</li>`).join("")}</ul></div>
      <div class="info-card"><div class="num">02</div><h3>${t("lvl.duration")}</h3><p>~${meta.dur} ${t("lvl.minutes")}</p></div>
      <div class="info-card"><div class="num">03</div><h3>${t("lvl.totalWords")}</h3><p>${meta.words}</p></div>
    </div>
  `;
}

/* ================== SKILL SECTIONS ================== */
function renderSkill(lvl, skill){
  const meta = C.levels.find(l=>l.code===lvl);
  const secs = meta.skills[skill] || [];
  app.innerHTML = `
    <div class="pagehead"><a href="#/lvl/${lvl}" class="backlink">← ${lvl}</a><h1>${t("lvl."+skill)}</h1><p class="muted" style="margin:0">${t("sec.title")}</p></div>
    <div class="sec-list" style="margin-top:16px">
      ${secs.map((s,i)=>{
        const prog = S.secProg[s.id] || {c:0,a:0}; const pct = prog.a? Math.round(prog.c/s.qs.length*100) : 0;
        return `
        <div class="sec-row" onclick="location.hash='/sec/${lvl}/${s.id}'">
          <div class="sec-ring" style="--p:${pct}"><i>${pct}%</i></div>
          <div class="sm"><div class="st">Section ${i+1}: ${tl(s.title)}</div><div class="ss">${prog.c} ${t("sec.correct")} / ${prog.a} ${t("sec.answered")} / ${s.qs.length} total</div></div>
          <button class="btn sm">${prog.a? t("sec.continue"):t("sec.start")}</button>
        </div>`;
      }).join("")}
    </div>
  `;
}

/* ================== ENGINE: PRACTICE ================== */
function renderSection(lvl, secId){
  const meta = C.levels.find(l=>l.code===lvl);
  let sec=null; Object.values(meta.skills).forEach(arr=>{ const f=arr.find(x=>x.id===secId); if(f)sec=f; });
  if(!sec) return router();
  
  if(!S.secProg[sec.id]) S.secProg[sec.id]={c:0,a:0,ans:new Array(sec.qs.length).fill(null)};
  const prog = S.secProg[sec.id];
  let i = prog.ans.findIndex(x=>x===null); if(i<0) i=0; // go to first unanswered or restart
  
  function draw(){
    if(i>=sec.qs.length){
      const pct=Math.round(prog.c/sec.qs.length*100);
      app.innerHTML = `<div class="pagehead"><a href="#/skill/${lvl}/${secId.split('-')[1].toLowerCase().includes('l')?'listening':secId.includes('R')?'reading':'writing'}" class="backlink">${t("q.backSections")}</a></div>
        <div class="result"><div class="score-ring" style="--p:${pct}"><i>${pct}%</i></div><div class="big">${prog.c}/${sec.qs.length}</div>
        <p class="muted">${t("q.accuracy")}</p><button class="btn btn-primary" id="retry">${t("q.retry")}</button></div>`;
      $("#retry").addEventListener("click",()=>{ S.secProg[sec.id]={c:0,a:0,ans:new Array(sec.qs.length).fill(null)}; save(); i=0; draw(); });
      return;
    }
    const q=sec.qs[i];
    app.innerHTML = `<div class="pagehead"><a href="#/skill/${lvl}/${secId.split('-')[1].toLowerCase().includes('l')?'listening':secId.includes('R')?'reading':'writing'}" class="backlink">${t("q.backSections")}</a></div>
      <div class="practice">
        <div class="q-head"><span class="muted">${t("q.question")} ${i+1}/${sec.qs.length}</span></div>
        <div class="pbar" style="margin-bottom:20px"><i style="width:${Math.round(i/sec.qs.length*100)}%"></i></div>
        ${renderQ(q)}
      </div>`;
    bindQ(q, (isCorrect, ansVal)=>{
      prog.ans[i] = ansVal; prog.a++; if(isCorrect){prog.c++; S.totals.correct++;} S.totals.reviews++;
      const d=todayStr(); S.history[d]=(S.history[d]||0)+1;
      save();
      later(()=>{ i++; draw(); }, isCorrect? 800:1500);
    });
  }
  draw();
}

function renderQ(q){
  if(q.type==="tf") return `
    <div style="text-align:center;margin:30px 0 40px"><button class="btn btn-primary" id="qplay" style="font-size:1.6rem;padding:24px 36px;border-radius:24px">🔊</button></div>
    <div class="q-passage" style="text-align:center">${esc(q.claim.en)}</div>
    <div class="tf-row"><button class="btn opt" data-v="1">${t("q.true")}</button><button class="btn opt" data-v="0">${t("q.false")}</button></div>`;
  if(q.type==="choice"){
    const stem = q.stem==="audio"? `<div style="text-align:center;margin:30px 0 40px"><button class="btn btn-primary" id="qplay" style="font-size:1.6rem;padding:24px 36px;border-radius:24px">🔊</button></div>` : `<div class="q-prompt">${esc(q.w.en)}</div>`;
    return stem + `<div id="opts">${q.opts.map((o,ix)=>`<button class="opt" data-ix="${ix}"><span class="ix">${"ABCD"[ix]}</span><span>${q.render==='hz'?esc(o.hz):esc(o.en)}</span></button>`).join("")}</div>`;
  }
  if(q.type==="fill") return `
    <div class="q-passage">${esc(q.sent)}<span class="py">${colorPy(q.py)}</span><span class="py">${esc(tl(q))}</span></div>
    <div id="opts" style="margin-top:20px">${q.opts.map((o,ix)=>`<button class="opt" data-ix="${ix}"><span class="ix">${"ABCD"[ix]}</span><span>${esc(o.hz)}</span></button>`).join("")}</div>`;
  if(q.type==="reading") return `
    <div class="q-passage">${esc(q.passage.hz)}<span class="py">${colorPy(q.passage.py)}</span></div>
    <div style="font-weight:700;margin:16px 0 10px">${tl(q.q)}</div>
    <div id="opts">${q.opts.map((o,ix)=>`<button class="opt" data-ix="${ix}"><span class="ix">${"ABCD"[ix]}</span><span>${esc(tl(o))}</span></button>`).join("")}</div>`;
  if(q.type==="arrange") return `
    <div style="font-weight:700;margin:0 0 16px">${t("q.arrangeHint")}</div>
    <div class="arrange-target" id="tgt"></div>
    <div class="arrange-bank" id="bnk">${q.words.map((w,ix)=>`<button class="token" data-ix="${ix}">${esc(w)}</button>`).join("")}</div>`;
  if(q.type==="writing") return `
    <div style="font-weight:700;margin:0 0 8px">${tl(q.prompt)}</div>
    <div class="kw">${t("q.keywords")}: ${q.keywords.map(k=>`<span>${esc(k.hz)}</span>`).join("")}</div>
    <textarea class="writing" id="wIn" placeholder="${t("q.typeHere")}"></textarea>
    <div style="margin-top:14px"><button class="btn btn-primary btn-block" id="wSub">${t("q.submit")}</button></div>
    <div id="wRes" class="hidden" style="margin-top:16px;background:var(--bg2);padding:14px;border-radius:12px">
      <div style="font-weight:700;color:var(--ok);margin-bottom:6px">${t("q.sample")}</div>
      <div style="font-size:1.1rem">${esc(q.sample.hz)}</div><div class="py">${colorPy(q.sample.py)}</div>
      <button class="btn btn-block" id="wNext" style="margin-top:12px">${t("q.next")}</button>
    </div>`;
  if(q.type==="translate") return `
    <div style="font-weight:700;margin:0 0 8px">${tl(q.prompt)}</div>
    <div class="q-passage" style="text-align:center">${esc(q.hz)}<span class="py">${colorPy(q.py)}</span></div>
    <textarea class="writing" id="wIn" placeholder="${t("q.typeHere")}"></textarea>
    <div style="margin-top:14px"><button class="btn btn-primary btn-block" id="wSub">${t("q.submit")}</button></div>
    <div id="wRes" class="hidden" style="margin-top:16px;background:var(--bg2);padding:14px;border-radius:12px">
      <div style="font-weight:700;color:var(--ok);margin-bottom:6px">${t("q.sample")}</div>
      <div style="font-size:1.05rem">${esc(tl(q.sample))}</div>
      <button class="btn btn-block" id="wNext" style="margin-top:12px">${t("q.next")}</button>
    </div>`;
  return "";
}

function bindQ(q, doneFn){
  if(q.type==="tf"){
    const p=()=>speak(q.w.hz); $("#qplay").addEventListener("click",p); later(p,250);
    $$(".tf-row .opt").forEach(btn=>btn.addEventListener("click",()=>{
      const v = btn.dataset.v==="1"; const ok = v===q.correct;
      btn.classList.add(ok?"correct":"wrong");
      if(ok) toast("✅ "+t("q.correct")); else toast("❌ "+t("q.wrong"));
      doneFn(ok, v);
    }));
  }
  else if(q.type==="choice" || q.type==="fill" || q.type==="reading"){
    if(q.stem==="audio"){ const p=()=>speak(q.w.hz); $("#qplay").addEventListener("click",p); later(p,250); }
    $$("#opts .opt").forEach(btn=>btn.addEventListener("click",()=>{
      const ix = +btn.dataset.ix; const ok = ix===q.ans;
      $$("#opts .opt").forEach((b,bi)=>{ b.disabled=true; if(bi===q.ans)b.classList.add("correct"); else if(bi===ix)b.classList.add("wrong"); });
      if(ok) toast("✅ "+t("q.correct")); else toast("❌ "+t("q.wrong"));
      if(q.w && q.w.hz) speak(q.w.hz);
      doneFn(ok, ix);
    }));
  }
  else if(q.type==="arrange"){
    const tgt=$("#tgt"), bnk=$("#bnk"); let sel=[];
    $$(".token",bnk).forEach(btn=>btn.addEventListener("click",()=>{
      if(btn.classList.contains("placed"))return;
      btn.classList.add("placed"); sel.push({ix:+btn.dataset.ix, w:q.words[+btn.dataset.ix]});
      tgt.innerHTML = sel.map((x,i)=>`<button class="token tgt-t" data-i="${i}">${esc(x.w)}</button>`).join("");
      $$(".tgt-t",tgt).forEach(tbtn=>tbtn.addEventListener("click",()=>{
        const i=+tbtn.dataset.i; const rm=sel.splice(i,1)[0];
        $(`.token[data-ix="${rm.ix}"]`,bnk).classList.remove("placed"); tbtn.remove();
        if(sel.length===q.words.length) check();
      }));
      if(sel.length===q.words.length) check();
    }));
    function check(){
      const ok = sel.map(x=>x.w).join("") === q.answer.join("");
      if(ok){ tgt.style.borderColor="var(--ok)"; tgt.style.background="rgba(22,163,74,.1)"; toast("✅ "+t("q.correct")); speak(q.hz); doneFn(true, sel.map(x=>x.w)); }
      else { tgt.style.borderColor="var(--bad)"; toast("❌ "+t("q.wrong")); later(()=>{tgt.style.borderColor=""; sel=[]; tgt.innerHTML=""; $$(".token",bnk).forEach(b=>b.classList.remove("placed"));},1000); }
    }
  }
  else if(q.type==="writing" || q.type==="translate"){
    $("#wSub").addEventListener("click",()=>{
      const v=$("#wIn").value.trim(); if(!v)return;
      $("#wSub").classList.add("hidden"); $("#wRes").classList.remove("hidden");
    });
    $("#wNext").addEventListener("click",()=>doneFn(true, $("#wIn").value));
  }
}

/* ================== TESTS (Mock) ================== */
function renderTests(lvl){
  const meta = C.levels.find(l=>l.code===lvl); if(!meta)return router();
  app.innerHTML = pageHead(lvl+" "+t("lvl.tests"), "#/lvl/"+lvl) + `
    <div class="practice">
      <div class="info-card" style="text-align:center;padding:34px 20px;margin-bottom:24px">
        <div style="font-size:3rem;margin-bottom:10px">📝</div>
        <h3 style="font-size:1.4rem">${t("tests.mock")}</h3><p>${t("tests.desc")}</p>
        <button class="btn btn-primary btn-block" style="font-size:1.1rem;padding:14px" onclick="location.hash='/mock/${lvl}/rand'">${t("tests.start")}</button>
      </div>
      <h3 class="section-title">${t("tests.real")}</h3>
      <div class="set-grid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<div class="set-card" onclick="location.hash='/mock/${lvl}/real${n}'">${t("tests.set")} ${n}<small>${meta.dur} ${t("lvl.minutes")}</small></div>`).join("")}</div>
    </div>`;
}
function runMock(lvl, set){
  const meta = C.levels.find(l=>l.code===lvl);
  const pool = []; Object.values(meta.skills).forEach(arr=> arr.forEach(sec=> pool.push(...sec.qs.filter(q=>q.type!=='writing'&&q.type!=='translate'))));
  const N = Math.min(20, pool.length); const DUR = 8*60; // short mock
  const qs = shuffle(pool).slice(0,N).map(q=>JSON.parse(JSON.stringify(q))); // deep copy
  
  let i=0; const answers=new Array(qs.length).fill(null); let left=DUR;
  function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
  function finish(){
    if(mockTimer){clearInterval(mockTimer);mockTimer=null;}
    let score=0; qs.forEach((q,ix)=>{
      const ok = (q.type==="tf" && answers[ix]===q.correct) || (q.type!=="tf" && answers[ix]===q.ans) || (q.type==="arrange" && (answers[ix]||[]).join("")===q.answer.join(""));
      if(ok)score++;
      if(q.w && q.w.hz){ const ckey=lvl+"#"+q.w.hz; const c=S.srs[ckey]||{box:0,due:0,correct:0,wrong:0,seen:true}; c.box=ok?Math.min(INTERVALS.length-1,c.box+1):Math.max(0,c.box-1); c.due=now()+INTERVALS[c.box]*86400000; S.srs[ckey]=c; }
    });
    S.totals.reviews+=qs.length; S.totals.correct+=score; save();
    const pct=Math.round(score/qs.length*100); const pass=pct>=60;
    app.innerHTML = pageHead(t("q.result"), "#/tests/"+lvl) + `
      <div class="result">
        <div class="score-ring" style="--p:${pct}"><i>${pct}%</i></div>
        <div class="big ${pass?'pass':'fail'}">${pass?t("tests.passed"):t("tests.failed")}</div>
        <p class="muted">${score}/${qs.length} · ${t("q.accuracy")}: ${pct}%</p>
        <button class="btn btn-primary" onclick="location.hash='/tests/${lvl}'" style="margin-top:16px">${t("q.retry")}</button>
      </div>`;
  }
  function draw(){
    if(i>=qs.length) return finish();
    const q=qs[i];
    app.innerHTML = `
      <div class="pagehead" style="display:flex;justify-content:space-between;align-items:center">
        <a href="#/tests/${lvl}" class="backlink" style="margin:0">${t("common.back")}</a>
        <div class="chip" id="clock">⏱ ${fmt(left)}</div>
      </div>
      <div class="practice">
        <div class="q-head"><span class="muted">${t("q.question")} ${i+1}/${qs.length}</span></div>
        <div class="pbar" style="margin-bottom:20px"><i style="width:${Math.round(i/qs.length*100)}%"></i></div>
        ${renderQ(q)}
        <div style="text-align:right;margin-top:20px"><button class="btn" id="skip">${t("q.next")}</button></div>
      </div>`;
    bindQ(q, (ok, val)=>{ answers[i]=val; i++; draw(); });
    $("#skip").addEventListener("click",()=>{ i++; draw(); });
  }
  mockTimer=setInterval(()=>{ left--; const c=$("#clock"); if(c)c.textContent="⏱ "+fmt(left); if(left<=0){ toast(t("tests.timeup")); finish(); } },1000);
  draw();
}

/* ================== VOCAB & SRS ================== */
function renderVocab(lvl){
  if(!lvl) lvl=LEVELS[0];
  const list = C.vocab[lvl];
  app.innerHTML = pageHead(t("vocab.title"), "#/lvl/"+lvl) + `
    <div class="practice" style="max-width:820px">
      <div class="seg" style="margin-bottom:16px">${LEVELS.map(l=>`<button class="${l===lvl?'active':''}" onclick="location.hash='/vocab/${l}'">${l}</button>`).join("")}</div>
      <div class="toolbar"><button class="btn btn-primary" onclick="location.hash='/flashcards/${lvl}'">🎴 ${t("vocab.flash")}</button><button class="btn" onclick="location.hash='/study'">🧠 ${t("vocab.study")}</button></div>
      <div class="table-wrapper"><table>
        <thead><tr><th></th><th>${t("vocab.hz")}</th><th>${t("vocab.py")}</th><th>${t("vocab.mean")}</th><th>${t("vocab.status")}</th></tr></thead>
        <tbody id="vbody"></tbody>
      </table></div>
    </div>`;
  const tbody=$("#vbody");
  list.forEach(w=>{
    const c=S.srs[lvl+"#"+w.hz]; const st=c? (c.box>=KNOWN_BOX?"known":"learning") : "new";
    const tr=document.createElement("tr");
    tr.innerHTML = `<td><button class="mini-play">🔊</button></td><td class="hz" style="cursor:pointer;color:var(--brand)">${esc(w.hz)}</td><td>${colorPy(w.py)}</td><td>${esc(w.vi||w.en)}<div class="muted" style="font-size:.75rem">${esc(w.en)}</div></td><td><span class="tag ${st}">${t("vocab."+st)}</span></td>`;
    $(".mini-play",tr).addEventListener("click",()=>speak(w.hz));
    $(".hz",tr).addEventListener("click",()=>showWord(lvl,w));
    tbody.appendChild(tr);
  });
}

function runFlashcards(lvl){
  const list=shuffle(C.vocab[lvl]); let i=0;
  function draw(){
    if(i>=list.length){ app.innerHTML=pageHead(t("vocab.flash"),"#/vocab/"+lvl)+`<div class="empty">🎉<br><b>${t("fc.done")}</b><br><button class="btn btn-primary" onclick="location.hash='/vocab/${lvl}'" style="margin-top:16px">${t("common.back")}</button></div>`; return; }
    const w=list[i];
    app.innerHTML = pageHead(t("vocab.flash"),"#/vocab/"+lvl) + `
      <div class="practice"><div class="pbar" style="margin-bottom:20px"><i style="width:${Math.round(i/list.length*100)}%"></i></div>
      <div class="flashcard" id="fcard"><div class="fc-inner">
        <div class="fc-face"><div class="fc-hz">${esc(w.hz)}</div><button class="btn sm" id="pf">🔊 ${t("q.listen")}</button><div class="muted" style="position:absolute;bottom:16px;font-size:.8rem">${t("fc.flip")}</div></div>
        <div class="fc-face fc-back"><div class="fc-py">${colorPy(w.py)}</div><div class="fc-en">${esc(w.en)}</div>${w.vi?`<div class="fc-vi">${esc(w.vi)}</div>`:""}<div style="position:absolute;bottom:16px;font-size:.8rem;opacity:.7">${t("fc.flip")}</div></div>
      </div></div>
      <div class="fc-controls"><button class="btn dunno-btn" id="dno">✗ ${t("fc.dunno")}</button><button class="btn know-btn" id="kno">✓ ${t("fc.know")}</button></div>
      </div>`;
    const cEl=$("#fcard"); cEl.addEventListener("click",e=>{if(e.target.id==="pf")return; cEl.classList.toggle("flipped"); if(cEl.classList.contains("flipped"))speak(w.hz);});
    $("#pf").addEventListener("click",e=>{e.stopPropagation();speak(w.hz);});
    speak(w.hz);
    const next=(ok)=>{
      const ckey=lvl+"#"+w.hz; const c=S.srs[ckey]||{box:0,due:0,correct:0,wrong:0,seen:true};
      c.box=ok?Math.min(INTERVALS.length-1,c.box+1):Math.max(0,c.box-1); c.due=now()+INTERVALS[c.box]*86400000;
      S.srs[ckey]=c; S.xp+=ok?10:2; S.totals.reviews++; if(ok)S.totals.correct++; save();
      i++; draw();
    };
    $("#kno").addEventListener("click",()=>next(true)); $("#dno").addEventListener("click",()=>next(false));
  }
  draw();
}

function runStudy(){
  const due=[]; const all=[]; LEVELS.forEach(l=>C.vocab[l].forEach(w=>{
    const c=S.srs[l+"#"+w.hz]; all.push({lvl:l,w,c}); if(c && c.seen && c.due<=now()) due.push({lvl:l,w,c});
  }));
  due.sort((a,b)=>a.c.due-b.c.due);
  const fresh=all.filter(x=>!x.c||!x.c.seen).slice(0, Math.max(0, DAILY_GOAL-due.length));
  const queue = [...due, ...fresh].slice(0,DAILY_GOAL);
  
  if(!queue.length){ app.innerHTML=pageHead(t("vocab.study"),"#/home")+`<div class="empty">✅<br>${t("fc.empty")}</div>`; return; }
  
  let i=0;
  function draw(){
    if(i>=queue.length){ app.innerHTML=pageHead(t("vocab.study"),"#/home")+`<div class="empty">🎉<br><b>${t("fc.done")}</b><br><button class="btn btn-primary" onclick="location.hash='/home'" style="margin-top:16px">${t("nav.home")}</button></div>`; return; }
    const {lvl,w}=queue[i];
    app.innerHTML = pageHead(t("vocab.study"),"#/home") + `
      <div class="practice"><div class="pbar" style="margin-bottom:20px"><i style="width:${Math.round(i/queue.length*100)}%"></i></div>
      <div class="flashcard" id="fcard"><div class="fc-inner">
        <div class="fc-face"><div class="fc-hz">${esc(w.hz)}</div><button class="btn sm" id="pf">🔊 ${t("q.listen")}</button><div class="muted" style="position:absolute;bottom:16px;font-size:.8rem">${t("fc.flip")}</div></div>
        <div class="fc-face fc-back"><div class="fc-py">${colorPy(w.py)}</div><div class="fc-en">${esc(w.en)}</div>${w.vi?`<div class="fc-vi">${esc(w.vi)}</div>`:""}<div style="position:absolute;bottom:16px;font-size:.8rem;opacity:.7">${t("fc.flip")}</div></div>
      </div></div>
      <div class="fc-controls"><button class="btn dunno-btn" id="dno">✗ ${t("fc.dunno")}</button><button class="btn know-btn" id="kno">✓ ${t("fc.know")}</button></div>
      </div>`;
    const cEl=$("#fcard"); cEl.addEventListener("click",e=>{if(e.target.id==="pf")return; cEl.classList.toggle("flipped"); if(cEl.classList.contains("flipped"))speak(w.hz);});
    $("#pf").addEventListener("click",e=>{e.stopPropagation();speak(w.hz);});
    speak(w.hz);
    const next=(ok)=>{
      const ckey=lvl+"#"+w.hz; const c=S.srs[ckey]||{box:0,due:0,correct:0,wrong:0,seen:true};
      c.box=ok?Math.min(INTERVALS.length-1,c.box+1):Math.max(0,c.box-1); c.due=now()+INTERVALS[c.box]*86400000;
      S.srs[ckey]=c; S.xp+=ok?10:2; S.totals.reviews++; if(ok)S.totals.correct++;
      const d=todayStr(); S.history[d]=(S.history[d]||0)+1;
      const last=S.streak.last; if(last!==d){ const y=new Date(Date.now()-86400000).toISOString().slice(0,10); S.streak.count=(last===y)?S.streak.count+1:1; S.streak.last=d; if(S.streak.count>S.streak.longest) S.streak.longest=S.streak.count; }
      save(); i++; draw();
    };
    $("#kno").addEventListener("click",()=>next(true)); $("#dno").addEventListener("click",()=>next(false));
  }
  draw();
}

/* ================== PROGRESS ================== */
function renderProgress(){
  const acc = S.totals.reviews? Math.round(S.totals.correct/S.totals.reviews*100):0;
  let learned=0; LEVELS.forEach(l=>C.vocab[l].forEach(w=>{const c=S.srs[l+"#"+w.hz]; if(c&&c.box>=KNOWN_BOX)learned++;}));
  const totW = LEVELS.reduce((a,l)=>a+C.vocab[l].length,0);
  const days=[]; for(let d=27;d>=0;d--){ const key=new Date(Date.now()-d*86400000).toISOString().slice(0,10); days.push(S.history[key]||0); }
  const heat=days.map(n=>{const l=n===0?0:n<5?1:n<10?2:n<20?3:4;return `<i class="${l?'l'+l:''}" title="${n}"></i>`;}).join("");
  
  app.innerHTML = pageHead(t("stats.title"), "#/home") + `
    <div class="practice" style="max-width:1000px">
      <div class="stat-grid">
        <div class="stat-card"><b>${learned}</b><span>${t("stats.learned")} / ${totW}</span></div>
        <div class="stat-card"><b class="grad-text">🔥 ${S.streak.longest}</b><span>${t("stats.streak")}</span></div>
        <div class="stat-card"><b>${acc}%</b><span>${t("stats.acc")}</span></div>
        <div class="stat-card"><b>${S.totals.reviews}</b><span>${t("stats.reviews")}</span></div>
        <div class="stat-card"><b class="grad-text">${S.xp}</b><span>${t("stats.xp")}</span></div>
      </div>
      <h3 class="section-title" style="margin-top:30px">${t("stats.heat")}</h3>
      <div class="heat" style="background:var(--card);padding:18px;border-radius:18px;border:1px solid var(--line)">${heat}</div>
      <button class="btn btn-block" id="rst" style="margin-top:40px;color:var(--bad);border-color:var(--bad)">${t("stats.reset")}</button>
    </div>`;
  $("#rst").addEventListener("click",()=>{ if(confirm(t("stats.resetC"))){ S=defState(); S.settings.lang=LANG; save(); router(); } });
}

function pageHead(title, back){ return `<div class="pagehead"><a href="${back}" class="backlink">${t("common.back")}</a><h1>${esc(title)}</h1></div>`; }

/* ================== GRAMMAR ================== */
function renderGrammar(lvl){
  const list = C.grammar[lvl]||[];
  app.innerHTML = pageHead(lvl+" · "+t("gram.title"), "#/lvl/"+lvl) + `
    <div class="practice" style="max-width:760px">
      ${list.map(g=>`
        <div class="info-card" style="margin-bottom:14px">
          <h3 class="grad-text">${esc(g.point)}</h3>
          <p>${esc(tl(g.exp))}</p>
          <div class="q-passage" style="margin:10px 0 0">
            <button class="mini-play" data-hz="${esc(g.ex.hz)}" style="float:right;font-size:1.2rem">🔊</button>
            <div style="font-size:1.3rem">${esc(g.ex.hz)}</div>
            <span class="py">${colorPy(g.ex.py)}</span>
            <span class="py">${esc(LANG==='vi'?(g.ex.vi||g.ex.en):g.ex.en)}</span>
          </div>
        </div>`).join("")}
    </div>`;
  $$(".mini-play").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.hz)));
}

/* ================== SPEAKING (HSKK) ================== */
function renderSpeaking(lvl){
  const list = C.speak[lvl]||[]; let i=0;
  const canRec = !!(navigator.mediaDevices && window.MediaRecorder);
  function draw(){
    if(i>=list.length){ app.innerHTML=pageHead(t("speak.title"),"#/lvl/"+lvl)+`<div class="empty">🎉<br><b>${t("fc.done")}</b><br><button class="btn btn-primary" onclick="location.hash='/lvl/${lvl}'" style="margin-top:16px">${t("common.back")}</button></div>`; return; }
    const s=list[i];
    app.innerHTML = pageHead(lvl+" · "+t("speak.title"),"#/lvl/"+lvl) + `
      <div class="practice">
        <div class="q-head"><span class="muted">${t("q.question")} ${i+1}/${list.length}</span></div>
        <div class="pbar" style="margin-bottom:20px"><i style="width:${Math.round(i/list.length*100)}%"></i></div>
        <p class="muted">${t("speak.hint")}</p>
        <div class="q-passage" style="text-align:center;font-size:1.8rem">${esc(s.hz)}<span class="py">${colorPy(s.py)}</span><span class="py">${esc(LANG==='vi'?s.vi:s.en)}</span></div>
        <div class="btn-row" style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">
          <button class="btn btn-primary" id="model">${t("speak.listen")}</button>
          <button class="btn" id="rec">${t("speak.record")}</button>
          <button class="btn hidden" id="playback">${t("speak.play")}</button>
        </div>
        <audio id="aud" class="hidden" controls style="width:100%;margin-top:16px"></audio>
        ${canRec?"":`<p class="muted" style="text-align:center;margin-top:12px">${t("speak.norec")}</p>`}
        <button class="btn btn-block" id="next" style="margin-top:26px">${t("speak.next")}</button>
      </div>`;
    $("#model").addEventListener("click",()=>speak(s.hz)); later(()=>speak(s.hz),300);
    $("#next").addEventListener("click",()=>{i++;draw();});
    if(canRec){
      let mr=null, chunks=[], recording=false;
      $("#rec").addEventListener("click",async()=>{
        if(!recording){
          try{
            const stream=await navigator.mediaDevices.getUserMedia({audio:true});
            mr=new MediaRecorder(stream); chunks=[];
            mr.ondataavailable=e=>chunks.push(e.data);
            mr.onstop=()=>{ const blob=new Blob(chunks,{type:"audio/webm"}); const url=URL.createObjectURL(blob); const a=$("#aud"); a.src=url; a.classList.remove("hidden"); $("#playback").classList.remove("hidden"); stream.getTracks().forEach(t=>t.stop()); };
            mr.start(); recording=true; $("#rec").textContent=t("speak.stop"); $("#rec").classList.add("btn-primary");
          }catch(e){ toast(t("speak.norec")); }
        } else { mr.stop(); recording=false; $("#rec").textContent=t("speak.record"); $("#rec").classList.remove("btn-primary"); }
      });
      $("#playback").addEventListener("click",()=>$("#aud").play());
    }
  }
  draw();
}

/* ================== WORD DETAIL MODAL ================== */
function showWord(lvl, w){
  let ex=null; const Sn=(C.levels.find(l=>l.code===lvl)||{}); // find example sentence containing the word
  (function(){ const all=[]; C.levels.forEach(L=>{ (window.HB_CONTENT.sentByLevel&&window.HB_CONTENT.sentByLevel[L.code]||[]).forEach(s=>all.push(s)); }); })();
  const ov=document.createElement("div"); ov.className="modal-ov"; ov.innerHTML=`
    <div class="modal">
      <button class="modal-x" id="mx">✕</button>
      <div style="font-size:3.4rem;font-weight:700;text-align:center">${esc(w.hz)}</div>
      <div style="text-align:center;font-size:1.4rem;margin:6px 0">${colorPy(w.py)}</div>
      <div style="text-align:center"><button class="btn btn-primary" id="msp">${t("q.listen")}</button></div>
      <div style="margin-top:16px"><b>${t("vocab.mean")}</b><div>${esc(w.vi||w.en)}</div><div class="muted">${esc(w.en)}</div></div>
    </div>`;
  document.body.appendChild(ov);
  $("#mx",ov).addEventListener("click",()=>ov.remove());
  ov.addEventListener("click",e=>{ if(e.target===ov) ov.remove(); });
  $("#msp",ov).addEventListener("click",()=>speak(w.hz));
  speak(w.hz);
}

/* ================== INFO PAGES ================== */
function renderAbout(){
  app.innerHTML = `<div class="section"><div class="wrap">
    <div class="section-head"><h2>${t("about.title")}</h2><p>${t("about.format")}</p></div>
    <div class="table-wrapper" style="max-width:760px;margin:0 auto"><table>
      <thead><tr><th>${t("about.level")}</th><th>${t("about.cefr")}</th><th>${t("about.dur")}</th><th>${t("about.words")}</th></tr></thead>
      <tbody>${C.levels.map(l=>`<tr><td><b class="grad-text">${l.code}</b></td><td>${l.cefr}</td><td>${l.dur} ${t("lvl.minutes")}</td><td>${l.words}</td></tr>`).join("")}</tbody>
    </table></div>
    <div style="text-align:center;margin-top:24px"><a href="#/levels" class="btn btn-primary">${t("home.cta3")}</a></div>
  </div></div>`;
}
function renderVIP(){
  const plans=[
    {k:"month",price:"$14.99",pop:false},
    {k:"year",price:"$69.99",pop:true},
    {k:"life",price:"$99.99",pop:false},
  ];
  app.innerHTML = `<div class="section"><div class="wrap">
    <div class="section-head"><h2>💎 ${t("vip.title")}</h2><p>${t("vip.sub")}</p></div>
    <div class="feat-grid" style="max-width:880px">
      ${plans.map(p=>`<div class="feat" style="text-align:center;${p.pop?'border:2px solid var(--brand);position:relative':''}">
        ${p.pop?`<span class="chip" style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--grad);color:#fff;border:none">${t("vip.pop")}</span>`:''}
        <h3>${t("vip."+p.k)}</h3><div style="font-size:2rem;font-weight:800" class="grad-text">${p.price}</div>
        <button class="btn ${p.pop?'btn-primary':''} btn-block" style="margin-top:12px" onclick="(function(){document.getElementById('toast').textContent='${t("vip.note")}';document.getElementById('toast').classList.remove('hidden');})()">${t("vip.choose")}</button>
      </div>`).join("")}
    </div>
    <ul style="max-width:520px;margin:26px auto 0;color:var(--muted)">
      <li>✓ ${t("vip.f1")}</li><li>✓ ${t("vip.f2")}</li><li>✓ ${t("vip.f3")}</li><li>✓ ${t("vip.f4")}</li>
    </ul>
    <p class="muted" style="text-align:center;font-size:.8rem;margin-top:18px">${t("vip.note")}</p>
  </div></div>`;
}
function renderTutoring(){
  app.innerHTML = `<div class="section"><div class="wrap">
    <div class="section-head"><h2>🎓 ${t("tut.title")}</h2><p>${t("tut.sub")}</p></div>
    <div class="tutor">
      <div class="tutor-row"><div class="n">⭐</div><b>${t("tutor.p1")}</b></div>
      <div class="tutor-row"><div class="n">💡</div><b>${t("tutor.p2")}</b></div>
      <div class="tutor-row"><div class="n">📊</div><b>${t("tutor.p3")}</b></div>
    </div>
    <div style="text-align:center;margin-top:24px"><button class="btn btn-primary" onclick="(function(){var e=document.getElementById('toast');e.textContent='✓';e.classList.remove('hidden');})()">${t("tut.book")}</button></div>
  </div></div>`;
}
function renderLogin(){
  const user=S.settings.user;
  app.innerHTML = `<div class="section"><div class="wrap" style="max-width:420px">
    <div class="section-head"><h2>${t("login.title")}</h2></div>
    ${user?`<div class="info-card" style="text-align:center"><div style="font-size:2.4rem">👋</div><h3>${t("login.welcome")}, ${esc(user)}</h3><button class="btn btn-block" id="logout" style="margin-top:14px">Log out</button></div>`:`
    <div class="info-card">
      <div class="field" style="margin-bottom:12px"><label style="font-weight:700;font-size:.85rem">${t("login.name")}</label><input class="search" id="lname" style="width:100%;margin-top:6px" placeholder="${t("login.name")}"></div>
      <div class="field" style="margin-bottom:12px"><label style="font-weight:700;font-size:.85rem">${t("login.email")}</label><input class="search" id="lemail" style="width:100%;margin-top:6px" placeholder="you@example.com"></div>
      <div class="field" style="margin-bottom:16px"><label style="font-weight:700;font-size:.85rem">${t("login.pass")}</label><input class="search" type="password" id="lpass" style="width:100%;margin-top:6px" placeholder="••••••"></div>
      <button class="btn btn-primary btn-block" id="dologin">${t("login.btn")}</button>
      <div style="text-align:center;margin:12px 0;color:var(--muted);font-size:.85rem">${t("login.or")}</div>
      <button class="btn btn-block" onclick="location.hash='/home'">${t("login.guest")}</button>
      <p class="muted" style="font-size:.78rem;margin-top:14px">${t("login.note")}</p>
    </div>`}
  </div></div>`;
  if(user){ $("#logout").addEventListener("click",()=>{ delete S.settings.user; save(); router(); }); }
  else { $("#dologin").addEventListener("click",()=>{ const n=$("#lname").value.trim()||$("#lemail").value.trim()||"Học viên"; S.settings.user=n; save(); toast("✓ "+t("login.welcome")+", "+n); location.hash="/home"; }); }
}

/* ================== CHROME ================== */
function applyTheme(){ document.documentElement.classList.toggle("dark", S.settings.theme==="dark"); }
$("#themeBtn").addEventListener("click",()=>{ S.settings.theme = S.settings.theme==="dark"?"light":"dark"; save(); applyTheme(); });
$("#langSel").addEventListener("change",e=>{ LANG=e.target.value; S.settings.lang=LANG; save(); document.documentElement.lang=LANG; applyStaticI18n(); router(); });
$("#menuBtn").addEventListener("click",()=>$("#navLinks").classList.toggle("open"));

let deferredPrompt=null; window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredPrompt=e; $("#installBtn").classList.remove("hidden"); });
$("#installBtn").addEventListener("click",async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("#installBtn").classList.add("hidden"); } });
if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }

/* ================== BOOT ================== */
$("#langSel").value=LANG; document.documentElement.lang=LANG;
applyTheme(); applyStaticI18n();
window.addEventListener("hashchange",router);
if(!location.hash) location.hash="/home"; else router();
})();
