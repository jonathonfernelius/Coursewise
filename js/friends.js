/* Coursewise Friends: authenticated Supabase RPCs; no sample accounts or task details. */
(() => {
  const db = window.tidyClient;
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg>';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data = {people:[],notifications:[],unread:0}, dialog, active='friends', opener, priorOverflow, loaded=false, busy=false, search='', searchSeq=0;
  let error = '';
  const people = () => data.people || [];
  const count = state => people().filter(p=>p.state===state).length;
  const friends = () => people().filter(p=>p.state==='friend');
  const avatar = p => `<span class="cw-f-avatar" style="--friend-color:var(--${['mint','sky','grape','sun','rose','teal'][Math.abs(String(p.id).split('').reduce((n,c)=>n+c.charCodeAt(0),0))%6]})">${esc((p.name||p.handle||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase())}</span>`;
  const activity = p => p.state==='friend' ? `<span class="cw-f-activity cw-f-activity-today"><b>${Number(p.today)||0}</b><span>${Number(p.today)===1?'task':'tasks'} done today</span></span>` : '';
  const cheer = p => `<button type="button" class="cw-f-cheer${p.cheered?' is-cheered':''}" data-friend-cheer="${esc(p.id)}" aria-label="${p.cheered?'Cheered':'Cheer for'} ${esc(p.name)}" ${p.cheered?'disabled':''}><span aria-hidden="true">${p.cheered?'✓':'👏'}</span> ${p.cheered?'Cheered':'Cheer'}</button>`;
  function cardBody() {
    return `<div class="section-head"><h2>Friends <span class="count">${friends().length}</span></h2></div>
      <p class="cw-f-subtitle">A little company along the way.</p>
      <div class="cw-f-home-list">${friends().length?friends().slice(0,3).map(p=>`<div class="cw-f-person">${avatar(p)}<div class="cw-f-person-copy"><strong>${esc(p.name)}</strong>${activity(p)}</div>${cheer(p)}</div>`).join(''):'<p class="cw-f-empty">Add a friend to cheer each other on!</p>'}</div>
      <p class="cw-f-card-feedback sr-only" role="status" aria-live="polite"></p>
      ${count('request')?`<button class="cw-f-request" data-friends-open="requests"><span><b>${count('request')}</b> friend requests</span><span aria-hidden="true">→</span></button>`:''}
      <div class="cw-f-card-actions"><button class="btn btn-outline" data-friends-open="friends">View friends</button><button class="btn btn-primary" data-friends-open="add">+ Add friend</button></div>`;
  }
  function refreshCard() {
    document.querySelectorAll('.cw-f-card').forEach(c=>c.innerHTML=cardBody());
    document.querySelectorAll('.cw-f-badge').forEach(b=>{b.textContent=count('request')+(Number(data.unread)||0);b.hidden=!(count('request')+(Number(data.unread)||0));});
    document.querySelectorAll('.cw-f-notif-badge').forEach(b=>{b.textContent=data.unread||0;b.hidden=!data.unread;});
  }
  function actions(p) {
    if(p.state==='request')return `<button class="btn btn-primary" data-friend-action="accept" data-person="${esc(p.id)}">Accept</button><button class="icon-btn" data-friend-action="decline" data-person="${esc(p.id)}" aria-label="Decline ${esc(p.name)}">×</button>`;
    if(p.state==='pending')return `<button class="btn btn-outline" data-friend-action="cancel" data-person="${esc(p.id)}">Pending ×</button>`;
    if(p.state==='friend')return cheer(p)+`<button class="icon-btn" data-friend-action="remove" data-person="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button>`;
    return `<button class="btn btn-primary" data-friend-action="add" data-person="${esc(p.id)}">+ Add</button>`;
  }
  function personRow(p) {
    return `<div class="cw-f-person">${avatar(p)}<div class="cw-f-person-copy"><strong>${esc(p.name)}</strong><span>@${esc(p.handle)}</span>${p.state==='friend'?activity(p):Number(p.mutuals)>0&&active==='add'?`<span>${p.mutuals} mutual ${Number(p.mutuals)===1?'friend':'friends'}</span>`:''}</div><div class="cw-f-person-actions">${actions(p)}</div></div>`;
  }
  function rows() {
    if(!loaded)return '<p class="cw-f-empty">Loading friends…</p>';
    let list=[];
    if(active==='friends')list=friends();
    if(active==='requests')list=people().filter(p=>p.state==='request'||p.state==='pending');
    if(active==='add')list=people().filter(p=>p.state==='none' && (!search.trim() || (p.handle||'').toLowerCase().includes(search.trim().toLowerCase()))).sort((a,b)=>Number(b.mutuals)-Number(a.mutuals)).slice(0,12);
    if(active==='notifications')return (data.notifications||[]).length?data.notifications.map(n=>`<div class="cw-f-notification"><strong>${esc(n.sender)} cheered you on!</strong><p>${esc(n.message)}</p><small>${new Date(n.created_at).toLocaleString()}</small></div>`).join(''):'<p class="cw-f-empty">No cheers yet. Your hype squad will show up here!</p>';
    return list.length?list.map(personRow).join(''):`<div class="cw-f-empty">${active==='add'?'No suggested users match. Try searching by username.':active==='requests'?'No pending requests.':'Your friends will appear here.'}</div>`;
  }
  function renderPanel() {
    if(!dialog)return;
    dialog.innerHTML=`<div class="cw-f-panel-head"><div><span class="cw-f-eyebrow">YOUR CIRCLE</span><h2 id="cw-f-title">Friends</h2></div><button class="icon-btn" data-friends-close aria-label="Close friends">×</button></div>
      <p class="cw-f-subtitle">Make room for your people.</p>
      <div class="cw-f-tabs" aria-label="Friends views">${[['friends','My friends'],['requests',`Requests (${count('request')+count('pending')})`],['add','Add friend']].map(([id,label])=>`<button type="button" data-f-tab="${id}" aria-pressed="${active===id}">${label}</button>`).join('')}</div>
      ${active==='add'?`<label class="cw-f-search">Find a friend<input id="cw-f-search" type="search" placeholder="Search by username" value="${esc(search)}" autocomplete="off"></label><p class="cw-f-subtitle">${search.trim()?'Search results':'People you may know · mutual friends first'}</p>`:''}
      ${active==='friends'?`<button class="btn btn-outline cw-f-inbox" data-f-tab="notifications">Cheer inbox ${data.unread?`(${data.unread} new)`:''}</button>`:''}
      ${active==='notifications'?'<button class="btn btn-outline cw-f-inbox" data-f-tab="friends">← Back to friends</button>':''}
      <div class="cw-f-results">${rows()}</div>
      <p class="cw-f-feedback" role="status" aria-live="polite">${esc(error)}</p>
      <div class="cw-f-note">Only task completion totals are shared. Your task names and details stay private. Daily counts and cheers reset at 00:00 UTC.</div>`;
  }
  async function load(query='') {
    if(!db)return;
    const id=++searchSeq;
    try {
      const {data:result,error:dbError}=await db.rpc('coursewise_friends_data',{p_query:query});
      if(dbError)throw dbError;
      if(id!==searchSeq)return;
      data=result;loaded=true;error='';
    }catch(e){if(id!==searchSeq)return;error='Friends are not connected yet. Run the friends SQL migration in Supabase. '+(e.message||'');loaded=true;}
    refreshCard();if(dialog?.open)renderPanel();
  }
  async function action(type,target) {
    if(busy)return;
    busy=true;
    try {
      const {error:e}=await db.rpc('coursewise_friend_action',{p_action:type,p_target:target||null});
      if(e)throw e;
      await load(search);
      error=type==='cheer'?'Cheer sent!':type==='add'?'Friend request sent.':type==='accept'?'Friend request accepted.':type==='cancel'?'Request canceled.':type==='decline'?'Request declined.':type==='remove'?'Friend removed.':'';
    }catch(e){error=e.message||'Could not update friends.';}
    finally {busy=false;refreshCard();if(dialog?.open)renderPanel();}
  }
  function open(view,trigger){active=view||'friends';opener=trigger;error='';renderPanel();if(!dialog.open){priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}dialog.querySelector('#cw-f-search, [data-friends-close]')?.focus();if(active==='notifications'&&data.unread)void action('read');}
  function mount() {
    if(dialog)return;
    const profile=document.querySelector('.site-header .avatar');if(!profile)return;
    profile.insertAdjacentHTML('beforebegin',`<button class="cw-f-trigger" data-friends-open="friends" aria-label="Open friends" aria-haspopup="dialog">${icon}<span class="cw-f-trigger-label">Friends</span><span class="cw-f-badge" hidden></span></button>`);
    dialog=document.createElement('dialog');dialog.className='cw-f-dialog';dialog.setAttribute('aria-labelledby','cw-f-title');document.body.append(dialog);
    dialog.addEventListener('close',()=>{document.body.style.overflow=priorOverflow;opener?.focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    let searchTimer;
    dialog.addEventListener('input',e=>{if(e.target.id!=='cw-f-search')return;search=e.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const current=document.activeElement===e.target;void load(search).then(()=>{if(current&&dialog.open){const input=dialog.querySelector('#cw-f-search');input?.focus();input?.setSelectionRange(search.length,search.length);}});},250);});
    document.addEventListener('click',e=>{
      const cheerButton=e.target.closest('[data-friend-cheer]');
      if(cheerButton){
        if(cheerButton.disabled||busy)return;
        if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          cheerButton.classList.add('is-celebrating');
          const burst=document.createElement('span');burst.className='cw-f-sparkles';burst.setAttribute('aria-hidden','true');
          burst.innerHTML=Array.from({length:6},(_,i)=>`<i style="--spark:${i}">✦</i>`).join('');
          cheerButton.append(burst);
        }
        void action('cheer',cheerButton.dataset.friendCheer);return;
      }
      const trigger=e.target.closest('[data-friends-open]');if(trigger){open(trigger.dataset.friendsOpen,trigger);return;}
      if(e.target.closest('[data-friends-close]')){dialog.close();return;}
      const tab=e.target.closest('[data-f-tab]');if(tab){active=tab.dataset.fTab;renderPanel();if(active==='notifications'&&data.unread)void action('read');return;}
      const btn=e.target.closest('[data-friend-action]');if(btn){if(btn.dataset.friendAction==='remove'&&!confirm('Remove this friend?'))return;void action(btn.dataset.friendAction,btn.dataset.person);}
    });
    void load();
    // Refresh when returning to Coursewise after another friend may have sent a cheer.
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load(search);});
  }
  window.CoursewiseFriends={mount,card:()=>`<section class="card cw-f-card" aria-label="Friends">${cardBody()}</section>`};
})();