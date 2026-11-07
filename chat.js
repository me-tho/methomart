/* MethoMart Live Chat — index.html ও login.html দুই পেজে একই কোড (শুধু লগইন করা কাস্টমার) */
(function(){
  if(window.__mmChatLoaded) return; window.__mmChatLoaded = true;
  function start(){
    const CSS_TEXT = `
  #chatPanel{position:fixed; right:16px; bottom:16px; width:360px; max-width:calc(100vw - 24px); height:520px; max-height:calc(100vh - 32px); background:#fff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.28); z-index:900; display:none; flex-direction:column; overflow:hidden; border:1px solid var(--line,#DFD5B8);}
  #chatPanel.open{display:flex;}
  #chatPanel .ch-head{background:var(--forest,#1F3D2B); color:var(--ivory,#FBF6EC); padding:12px 14px; display:flex; align-items:center; justify-content:space-between; font-weight:700;}
  #chatPanel .ch-head small{display:block; font-weight:400; opacity:.8; font-size:.74rem;}
  #chatPanel .ch-x{background:none; border:none; color:var(--ivory,#FBF6EC); font-size:1.3rem; cursor:pointer; line-height:1;}
  #chatMsgs{flex:1; overflow-y:auto; padding:12px; background:var(--ivory,#FBF6EC); display:flex; flex-direction:column; gap:8px;}
  .ch-b{max-width:82%; padding:8px 11px; border-radius:14px; font-size:.92rem; line-height:1.45; word-wrap:break-word; white-space:pre-wrap;}
  .ch-b.me{align-self:flex-end; background:var(--gold,#D4A017); color:var(--forest-dark,#152A1D); border-bottom-right-radius:4px;}
  .ch-b.them{align-self:flex-start; background:#fff; border:1px solid var(--line,#DFD5B8); border-bottom-left-radius:4px;}
  .ch-b time{display:block; font-size:.68rem; opacity:.65; margin-top:3px;}
  .ch-empty{margin:auto; text-align:center; color:var(--muted,#6B6B5D); font-size:.9rem; padding:0 18px;}
  .ch-empty a{color:var(--forest,#1F3D2B); font-weight:700;}
  #chatForm{display:flex; gap:8px; padding:10px; border-top:1px solid var(--line,#DFD5B8); background:#fff;}
  #chatInput{flex:1; resize:none; border:1px solid var(--line,#DFD5B8); border-radius:10px; padding:9px 10px; font:inherit; max-height:90px;}
  #chatForm button{background:var(--forest,#1F3D2B); color:#fff; border:none; border-radius:10px; padding:0 16px; font-weight:700; cursor:pointer;}
  #chatForm button:disabled{opacity:.55;}
  #chatNavBadge{background:#c0392b; color:#fff; border-radius:999px; font-size:.7rem; font-weight:800; padding:1px 7px; margin-left:4px; display:none;}
  @media(max-width:520px){
    #chatPanel{top:0; right:0; bottom:0; left:0; width:auto; max-width:none; height:auto; max-height:none; border-radius:0; border:none; z-index:2147483000;}
    #chatPanel .ch-head{padding-top:calc(12px + env(safe-area-inset-top, 0px)); position:relative; z-index:2;}
    #chatForm{padding-bottom:calc(10px + env(safe-area-inset-bottom, 0px));}
  }
  @supports (height:100dvh){ @media(max-width:520px){ #chatPanel{height:100dvh; bottom:auto;} } }
  #chatPanel .ch-head{gap:8px;}
  #chatPanel .ch-title{flex:1;}
  #chatPanel .ch-back{background:rgba(255,255,255,.14); border:none; color:var(--ivory,#FBF6EC); font-size:1.15rem; width:34px; height:34px; border-radius:50%; cursor:pointer; line-height:1; flex:none;}
  #chatPanel .ch-back:hover{background:rgba(255,255,255,.28);}
`;

    // ---------- স্টাইল + প্যানেল + মেনু বাটন নিজেই তৈরি (index.html ও login.html দুই পেজেই একই) ----------
    const st = document.createElement('style');
    st.textContent = CSS_TEXT;
    document.head.appendChild(st);
    const panel = document.createElement('div');
    panel.id = 'chatPanel'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Live Chat');
    panel.innerHTML = '<div class="ch-head"><button class="ch-back" id="chatBack" type="button" aria-label="ফিরে যান">←</button><div class="ch-title">💬 MethoMart Live Chat<small>আমরা সাধারণত দ্রুত উত্তর দিই</small></div><button class="ch-x" id="chatClose" type="button" aria-label="বন্ধ করুন">✕</button></div>'
      + '<div id="chatMsgs"></div>'
      + '<form id="chatForm"><textarea id="chatInput" rows="1" maxlength="1000" placeholder="আপনার মেসেজ লিখুন…"></textarea><button type="submit" id="chatSendBtn">পাঠান</button></form>';
    document.body.appendChild(panel);
    const box = panel.querySelector('#chatMsgs');
    // মেনুতে কার্ট বাটনের ঠিক নিচে; মেনু না থাকলে ভাসমান বাটন
    let navBtn, badge;
    const li = document.createElement('li');
    li.innerHTML = '<button type="button" id="chatNavBtn" class="icon-link">💬 Live Chat <span id="chatNavBadge">0</span></button>';
    const cartLi = document.getElementById('cartBtn') && document.getElementById('cartBtn').closest('li');
    const navUl = document.getElementById('navLinks');
    if(cartLi) cartLi.after(li); else if(navUl) navUl.appendChild(li);
    else { li.style.cssText = 'position:fixed; left:14px; bottom:14px; z-index:850; list-style:none;'; document.body.appendChild(li); }
    navBtn = li.querySelector('#chatNavBtn'); badge = li.querySelector('#chatNavBadge');
    document.getElementById('chatBack').addEventListener('click', () => close());

    const form = panel.querySelector('#chatForm'), input = panel.querySelector('#chatInput'), sendBtn = panel.querySelector('#chatSendBtn');
    // স্বয়ংসম্পূর্ণ: পেজের অন্য স্কোপের ফাংশনের ওপর নির্ভর করে না
    const CHAT_API = 'https://cixjxrvkzdbxgcupuwsn.supabase.co/functions/v1/api';
    const CHAT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeGp4cnZremRieGdjdXB1d3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NTczMzYsImV4cCI6MjEwMjMzMzMzNn0.z-OeFieochici0eYtOQyW6lf2Q2yg0QPN8axxDng84I';
    const getToken = () => { try { return localStorage.getItem('mm_token'); } catch(e) { return null; } };
    const isLoggedIn = () => !!getToken();
    async function api(action, data){
      const res = await fetch(CHAT_API, { method:'POST', headers:{'Content-Type':'application/json','apikey':CHAT_KEY,'Authorization':'Bearer '+CHAT_KEY}, body: JSON.stringify(Object.assign({action}, data)) });
      return res.json();
    }
    let lastId = 0, timer = null, bgTimer = null, seen = new Set();
    const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function tm(iso){ try { return new Date(iso).toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dhaka'}); } catch(e){ return ''; } }
    function setBadge(n){ badge.textContent = n; badge.style.display = n > 0 ? 'inline-block' : 'none'; }
    function emptyNote(html){ box.innerHTML = '<div class="ch-empty">' + html + '</div>'; }
    function addMsgs(list){
      if(!list.length) return;
      const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      const empty = box.querySelector('.ch-empty'); if(empty) empty.remove();
      list.forEach(m => {
        if(seen.has(m.id)) return; seen.add(m.id); lastId = Math.max(lastId, m.id);
        const d = document.createElement('div'); d.className = 'ch-b ' + (m.sender === 'user' ? 'me' : 'them'); d.dataset.id = m.id;
        d.innerHTML = esc(m.body) + '<time>' + (m.sender === 'admin' ? 'MethoMart · ' : '') + tm(m.created_at) + '</time>';
        box.appendChild(d);
      });
      if(nearBottom || list.length > 1) box.scrollTop = box.scrollHeight;
    }
    function syncDeleted(ids){
      if(!Array.isArray(ids)) return;
      const keep = new Set(ids);
      box.querySelectorAll('.ch-b[data-id]').forEach(b => { if(!keep.has(Number(b.dataset.id))){ seen.delete(Number(b.dataset.id)); b.remove(); } });
      if(!box.querySelector('.ch-b') && !box.querySelector('.ch-empty')) emptyNote('👋 আপনার প্রশ্ন বা সমস্যা লিখে পাঠান, আমরা উত্তর দেব।');
    }
    function showClosed(){
      emptyNote('💬 লাইভ চ্যাট এখন বন্ধ আছে।<br>পরে আবার চেষ্টা করুন, অথবা যোগাযোগ অংশ থেকে আমাদের সাথে যোগাযোগ করুন।');
      form.style.display = 'none'; seen = new Set(); lastId = 0; if(navBtn.parentElement) navBtn.parentElement.style.display = 'none';
    }
    async function poll(first){
      if(!isLoggedIn()) return;
      try {
        const r = await api('chatGetMessages', { token: getToken(), after_id: lastId, mark_read: true });
        if(r.login_required){ showLoginNote(); return; }
        if(r.ok && r.enabled === false){ showClosed(); return; }
        if(r.ok){
          form.style.display = '';
          if(first && !r.messages.length) emptyNote('👋 স্বাগতম! আপনার প্রশ্ন বা সমস্যা লিখে পাঠান, আমরা উত্তর দেব।<br>অফলাইনে থাকলেও উত্তর এখানেই দেখতে পাবেন।');
          addMsgs(r.messages); syncDeleted(r.all_ids); setBadge(0);
        }
      } catch(e) {}
    }
    function showLoginNote(){ emptyNote('চ্যাট করতে আগে লগইন করুন।<br><br><a href="login.html">👤 লগইন / রেজিস্টার</a>'); form.style.display = 'none'; }
    function open(){
      panel.classList.add('open'); form.style.display = '';
      seen = new Set(); lastId = 0; box.innerHTML = '';
      if(!isLoggedIn()){ showLoginNote(); return; }
      poll(true); clearInterval(timer); timer = setInterval(poll, 4000);
      setTimeout(() => input.focus(), 50);
    }
    function close(){ panel.classList.remove('open'); clearInterval(timer); timer = null; }
    navBtn.addEventListener('click', () => {
      const nl = document.getElementById('navLinks'), tg = document.getElementById('navToggle');
      if(nl && tg && nl.classList.contains('open')) tg.click(); // হ্যামবার্গার মেনু বন্ধ
      panel.classList.contains('open') ? close() : open();
    });
    document.getElementById('chatClose').addEventListener('click', close);
    input.addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = input.value.trim(); if(!text) return;
      sendBtn.disabled = true;
      try {
        const r = await api('chatSend', { token: getToken(), message: text });
        if(r.ok){ input.value = ''; addMsgs([r.message]); box.scrollTop = box.scrollHeight; }
        else if(r.login_required){ showLoginNote(); }
        else if(r.chat_disabled){ showClosed(); }
        else alert(r.error || 'মেসেজ পাঠানো যায়নি');
      } catch(err){ alert('নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন'); }
      sendBtn.disabled = false; input.focus();
    });
    // নতুন উত্তর এলে মেনুর বাটনে সংখ্যা (চ্যাট বন্ধ থাকলে ৩০ সেকেন্ড পর পর চেক)
    async function bg(){
      if(!isLoggedIn() || panel.classList.contains('open') || document.hidden) return;
      try { const r = await api('chatUnreadCount', { token: getToken() }); if(r.ok) setBadge(r.unread || 0); } catch(e) {}
    }
    // এডমিন চ্যাট বন্ধ রাখলে মেনু থেকে বাটনটা লুকানো থাকবে
    api('chatStatus', {}).then(r => { if(r && r.ok && r.enabled === false && navBtn.parentElement) navBtn.parentElement.style.display = 'none'; }).catch(() => {});
    bg(); bgTimer = setInterval(bg, 30000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
