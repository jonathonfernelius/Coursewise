/* UI prototype only. Sample people; no requests or task data leave this page. */
(() => {
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg>';
  const people = [
    {id:1,name:'Maya Chen',handle:'mayac',state:'friend',color:'mint'},
    {id:2,name:'Noah Rivera',handle:'noahr',state:'friend',color:'sky'},
    {id:3,name:'Emma Brooks',handle:'emmab',state:'friend',color:'grape'},
    {id:4,name:'Liam Park',handle:'liamp',state:'request',color:'sun'},
    {id:5,name:'Sofia Reed',handle:'sofiar',state:'request',color:'rose'},
    {id:6,name:'Oliver Lane',handle:'oliverl',state:'none',color:'teal'}
  ];
  // Sample completion records only. One task ID counts once per period.
  const dateAt = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d; };
  const sampleCompletions = [
    {person:1, task:'maya-1', at:dateAt(0)},
    {person:1, task:'maya-2', at:dateAt(0)},
    {person:1, task:'maya-3', at:dateAt(0)},
    {person:2, task:'noah-1', at:dateAt(-1)},
    {person:2, task:'noah-2', at:dateAt(-1)},
    {person:2, task:'noah-3', at:dateAt(-1)},
    {person:2, task:'noah-4', at:dateAt(-1)}
  ];
  const cheered = new Set();
  function activity(person) {
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today); week.setDate(week.getDate() - (week.getDay() + 6) % 7);
    const uniqueSince = start => new Set(sampleCompletions.filter(c => c.person === person.id && c.at >= start && c.at <= now).map(c => c.task)).size;
    const daily = uniqueSince(today), weekly = uniqueSince(week);
    const n = daily || weekly;
    return n ? {total:n, period:daily ? 'today' : 'week', text:`${n} ${n === 1 ? 'task' : 'tasks'} completed ${daily ? 'today' : 'this week'}`, key:`${person.id}:${today.toDateString()}`} : null;
  }
  const activityText = p => { const a = activity(p); return a ? `<span class="cw-f-activity cw-f-activity-${a.period}" aria-label="${a.text}"><b>${a.total}</b><span>${a.total === 1 ? 'task' : 'tasks'} done ${a.period === 'today' ? 'today' : 'this week'}</span></span>` : ''; };
  const cheerButton = p => {
    const a = activity(p); if (!a) return '';
    const sent = cheered.has(a.key);
    return `<button type="button" class="cw-f-cheer${sent ? ' is-cheered' : ''}" data-friend-cheer="${p.id}" aria-label="${sent ? 'Cheered' : 'Cheer for'} ${p.name}" aria-disabled="${sent}"><span aria-hidden="true">${sent ? '✓' : '👏'}</span> ${sent ? 'Cheered' : 'Cheer'}</button>`;
  };
  let dialog, active = 'friends', opener, priorOverflow;
  const count = state => people.filter(p => p.state === state).length;
  const avatar = p => `<span class="cw-f-avatar" style="--friend-color:var(--${p.color})">${p.name.split(' ').map(n=>n[0]).join('')}</span>`;
  function cardBody() {
    return `<div class="section-head"><h2>Friends <span class="count">${count('friend')}</span></h2><span class="cw-f-demo">UI preview</span></div>
      <p class="cw-f-subtitle">A little company along the way.</p>
      <div class="cw-f-home-list">${people.filter(p=>p.state==='friend').slice(0,3).map(p=>`<div class="cw-f-person">${avatar(p)}<div class="cw-f-person-copy"><strong>${p.name}</strong>${activityText(p)}</div>${cheerButton(p)}</div>`).join('')}</div>
      <p class="cw-f-card-feedback sr-only" role="status" aria-live="polite"></p>
      ${count('request') ? `<button class="cw-f-request" data-friends-open="requests"><span><b>${count('request')}</b> friend requests</span><span aria-hidden="true">→</span></button>` : ''}
      <div class="cw-f-card-actions"><button class="btn btn-outline" data-friends-open="friends">View friends</button><button class="btn btn-primary" data-friends-open="add">+ Add friend</button></div>`;
  }
  function refresh() {
    document.querySelectorAll('.cw-f-card').forEach(c=>c.innerHTML=cardBody());
    document.querySelectorAll('.cw-f-badge').forEach(b=>{b.textContent=count('request');b.hidden=!count('request');});
  }
  function rows(query='') {
    const q=query.trim().toLowerCase();
    const list=people.filter(p => active==='friends' ? p.state==='friend' : active==='requests' ? p.state==='request'||p.state==='pending' : `${p.name} ${p.handle} ${p.handle}@example.com`.toLowerCase().includes(q));
    return list.length ? list.map(p=>`<div class="cw-f-person">${avatar(p)}<div class="cw-f-person-copy"><strong>${p.name}</strong><span>@${p.handle}</span>${p.state==='friend' ? activityText(p) : ''}</div><div class="cw-f-person-actions">${p.state==='request' ? `<button class="btn btn-primary" data-friend-action="accept" data-person="${p.id}" aria-label="Accept ${p.name}">Accept</button><button class="icon-btn" data-friend-action="decline" data-person="${p.id}" aria-label="Decline ${p.name}">×</button>` : p.state==='pending' ? `<button class="btn btn-outline" data-friend-action="cancel" data-person="${p.id}" aria-label="Cancel request to ${p.name}">Pending ×</button>` : p.state==='friend' ? cheerButton(p) : `<button class="btn btn-primary" data-friend-action="add" data-person="${p.id}" aria-label="Add ${p.name}">+ Add</button>`}</div></div>`).join('') : `<div class="cw-f-empty">${active==='add' ? 'No sample people match your search.' : active==='requests' ? 'You’re all caught up. No pending requests.' : 'Your friends will appear here.'}</div>`;
  }
  function renderPanel() {
    dialog.innerHTML=`<div class="cw-f-panel-head"><div><span class="cw-f-eyebrow">YOUR CIRCLE</span><h2 id="cw-f-title">Friends</h2></div><button class="icon-btn" data-friends-close aria-label="Close friends">×</button></div>
      <p class="cw-f-subtitle">Make room for your people.</p>
      <div class="cw-f-tabs" aria-label="Friends views">${[['friends','My friends'],['requests',`Requests (${count('request')+count('pending')})`],['add','Add friend']].map(([id,label])=>`<button type="button" data-f-tab="${id}" aria-pressed="${active===id}">${label}</button>`).join('')}</div>
      ${active==='add'?'<label class="cw-f-search">Find a friend<input id="cw-f-search" type="search" placeholder="Search name, username, or email" autocomplete="off"></label>':''}
      <div class="cw-f-results">${rows()}</div>
      <p class="cw-f-feedback" role="status" aria-live="polite"></p>
      <div class="cw-f-note"><strong>Just a preview</strong><p>These are sample people. Activity is sample data; requests and cheers aren’t sent. Changes reset when you leave this page. Only completion totals are shown—task names stay private.</p></div>`;
  }
  function open(view, trigger) {
    active=view||'friends';opener=trigger;renderPanel();
    if(!dialog.open){priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}
    (dialog.querySelector('#cw-f-search') || dialog.querySelector('[data-friends-close]')).focus();
  }
  function mount() {
    if(dialog) return;
    const profile=document.querySelector('.site-header .avatar');
    if(!profile) return;
    profile.insertAdjacentHTML('beforebegin',`<button class="cw-f-trigger" data-friends-open="friends" aria-label="Open friends" aria-haspopup="dialog">${icon}<span class="cw-f-trigger-label">Friends</span><span class="cw-f-badge">${count('request')}</span></button>`);
    dialog=document.createElement('dialog');dialog.className='cw-f-dialog';dialog.setAttribute('aria-labelledby','cw-f-title');document.body.append(dialog);
    dialog.addEventListener('close',()=>{document.body.style.overflow=priorOverflow;opener?.focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('input',e=>{if(e.target.id==='cw-f-search')dialog.querySelector('.cw-f-results').innerHTML=rows(e.target.value);});
    document.addEventListener('click',e=>{
      const cheer=e.target.closest('[data-friend-cheer]');
      if(cheer){
        const person=people.find(p=>p.id===Number(cheer.dataset.friendCheer));
        const a=person && person.state==='friend' ? activity(person) : null;
        if(!a || cheered.has(a.key))return;
        cheered.add(a.key);
        // Update both surfaces without replacing the focused button.
        document.querySelectorAll(`[data-friend-cheer="${person.id}"]`).forEach(b=>{
          b.innerHTML='<span aria-hidden="true">✓</span> Cheered';b.classList.add('is-cheered');
          b.setAttribute('aria-label',`Cheered ${person.name}`);b.setAttribute('aria-disabled','true');
        });
        if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          cheer.classList.add('is-celebrating');
          const burst=document.createElement('span');burst.className='cw-f-sparkles';burst.setAttribute('aria-hidden','true');
          burst.innerHTML=Array.from({length:6},(_,i)=>`<i style="--spark:${i}">✦</i>`).join('');
          cheer.append(burst);
          setTimeout(()=>{burst.remove();cheer.classList.remove('is-celebrating');},800);
        }
        const feedback=dialog.open ? dialog.querySelector('.cw-f-feedback') : document.querySelector('.cw-f-card-feedback');
        if(feedback)feedback.textContent=`Sample cheer for ${person.name} added.`;
        return;
      }
      const trigger=e.target.closest('[data-friends-open]');if(trigger){open(trigger.dataset.friendsOpen,trigger);return;}
      if(e.target.closest('[data-friends-close]')){dialog.close();return;}
      const tab=e.target.closest('[data-f-tab]');if(tab){active=tab.dataset.fTab;renderPanel();dialog.querySelector(`[data-f-tab="${active}"]`).focus();return;}
      const button=e.target.closest('[data-friend-action]');if(!button)return;
      const person=people.find(p=>p.id===Number(button.dataset.person));if(!person)return;
      const action=button.dataset.friendAction;
      person.state=action==='accept'?'friend':action==='add'?'pending':'none';
      const query=dialog.querySelector('#cw-f-search')?.value||'';
      renderPanel();if(query){dialog.querySelector('#cw-f-search').value=query;dialog.querySelector('.cw-f-results').innerHTML=rows(query);}
      dialog.querySelector('.cw-f-feedback').textContent=action==='accept'?`${person.name} added to your sample friends.`:action==='add'?`Sample request to ${person.name} is pending.`:action==='cancel'?'Sample request canceled.':'Sample request declined.';
      (dialog.querySelector(`[data-person="${person.id}"]`)||dialog.querySelector(`[data-f-tab="${active}"]`)).focus();refresh();
    });
  }
  window.CoursewiseFriends={mount,card:()=>`<section class="card cw-f-card" aria-label="Friends">${cardBody()}</section>`};
})();
