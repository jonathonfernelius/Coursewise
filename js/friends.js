
/* Coursewise Friends: authenticated Supabase RPCs; no sample accounts or task details. */
(() => {
  const db = window.tidyClient;
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg>';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data = {people:[],notifications:[],unread:0}, dialog, active='friends', opener, priorOverflow, loaded=false, busy=false, search='', searchSeq=0, detailId=null;
  let error = '', feedbackTimer, refreshInFlight = false, lastDataFingerprint = '';
  const REFRESH_MS = 8000;
  const SHOWN_KEY = 'cw-f-cheer-celebrations-v1';

  function temporaryFeedback(message) {
    clearTimeout(feedbackTimer);
    error = message;
    feedbackTimer = setTimeout(() => {
      error = '';
      if (dialog?.open) renderPanel();
    }, 2400);
  }

  function celebrateIncoming() {
    if (document.hidden) return;
    const unread = (data.notifications || []).filter(
      n => !n.seen &&
        Date.now() - new Date(n.created_at).getTime() < 86400000
    );
    if (!unread.length) return;

    let shown = [];
    try {
      shown = JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]');
      if (!Array.isArray(shown)) shown = [];
    } catch {}

    const keyFor = n => `${n.sender}|${n.created_at}`;
    const fresh = unread.filter(n => !shown.includes(keyFor(n)));
    if (!fresh.length) return;

    shown = [...shown, ...fresh.map(keyFor)].slice(-120);
    try {
      localStorage.setItem(SHOWN_KEY, JSON.stringify(shown));
    } catch {}

    showCheerToast(fresh[0]);
  }

  function showCheerToast(notification) {
    document.querySelector('.cw-f-celebration')?.remove();

    const toast = document.createElement('aside');
    toast.className = 'cw-f-celebration';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="cw-f-celebration-copy">
        <strong>👏 ${esc(notification.sender)} cheered you on!</strong>
        <p>${esc(notification.message)}</p>
      </div>
      <button type="button" class="cw-f-celebration-close" aria-label="Dismiss cheer">×</button>
    `;

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const confetti = document.createElement('div');
      confetti.className = 'cw-f-confetti';
      confetti.setAttribute('aria-hidden','true');
      confetti.innerHTML = Array.from(
        {length:18},
        (_,i) => `<i style="--i:${i};--x:${(i%9-4)*24}px;--y:${-35-(i%5)*19}px;--rot:${(i*73)%360}deg"></i>`
      ).join('');
      toast.prepend(confetti);
    }

    document.body.append(toast);

    const timeout = setTimeout(() => toast.remove(), 5600);
    toast.querySelector('button').addEventListener('click', () => {
      clearTimeout(timeout);
      toast.remove();
    });
  }

  const people = () => data.people || [];
  const count = state => people().filter(p=>p.state===state).length;
  const friends = () => people().filter(p=>p.state==='friend');

  const avatar = p => `
    <span class="cw-f-avatar" style="--friend-color:var(--${
      ['mint','sky','grape','sun','rose','teal'][
        Math.abs(
          String(p.id).split('').reduce((n,c)=>n+c.charCodeAt(0),0)
        )%6
      ]
    })">
      ${window.CoursewisePhotos.markup((p.name||p.handle||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase(), p.photoUrl || null)}
    </span>
  `;

  // Friends' avatars are tappable and open their profile (Instagram-style).
  const avatarLink = p => p.state==='friend'
    ? `<button type="button" class="cw-f-avatar-btn" data-friend-detail="${esc(p.id)}" aria-label="View ${esc(p.name)}'s profile" tabindex="-1">${avatar(p)}</button>`
    : avatar(p);

  // Large profile photo: tap to enlarge within the panel. Falls back to a plain avatar when there is no photo.
  const bigAvatar = p => p.photoUrl
    ? `<button type="button" class="cw-f-avatar-btn cw-f-avatar-zoom${photoOpen?' is-open':''}" data-friend-photo="${esc(p.id)}" aria-expanded="${photoOpen}" aria-label="${photoOpen?'Shrink':'Enlarge'} ${esc(p.name)}'s photo">${avatar(p)}</button>`
    : avatar(p);

  let photoOpen=false;

  const cheer = p => `
    <button
      type="button"
      class="cw-f-cheer${p.cheered?' is-cheered':''}"
      data-friend-cheer="${esc(p.id)}"
      aria-label="${p.cheered?'Cheered':'Cheer for'} ${esc(p.name)}"
      ${p.cheered?'disabled':''}
    >
      <span aria-hidden="true">${p.cheered?'✓':'👏'}</span>
      ${p.cheered?'Cheered':'Cheer'}
    </button>
  `;

  function cardBody() {
    return `
      <div class="section-head">
        <h2>Friends <span class="count">${friends().length}</span></h2>
      </div>
      <p class="cw-f-subtitle">A little company along the way.</p>
      <div class="cw-f-home-list">
        ${
          friends().length
            ? friends().slice(0,3).map(p=>`
                <div class="cw-f-person" data-friend-row="${esc(p.id)}">
                  ${avatarLink(p)}
                  <div class="cw-f-person-copy">
                    <button type="button" class="cw-f-person-link" data-friend-detail="${esc(p.id)}">${esc(p.name)}</button>
                  </div>
                  ${cheer(p)}
                </div>
              `).join('')
            : '<p class="cw-f-empty">Add a friend to cheer each other on!</p>'
        }
      </div>
      <p class="cw-f-card-feedback sr-only" role="status" aria-live="polite"></p>
      ${
        count('request')
          ? `<button class="cw-f-request" data-friends-open="requests">
               <span><b>${count('request')}</b> friend requests</span>
               <span aria-hidden="true">→</span>
             </button>`
          : ''
      }
      <div class="cw-f-card-actions">
        <button class="btn btn-outline" data-friends-open="friends">View friends</button>
        <button class="btn btn-primary" data-friends-open="add">+ Add friend</button>
      </div>
    `;
  }

  function refreshCard() {
    document.querySelectorAll('.cw-f-card').forEach(
      c => c.innerHTML=cardBody()
    );

    document.querySelectorAll('.cw-f-badge').forEach(b=>{
      b.textContent=count('request')+(Number(data.unread)||0);
      b.hidden=!(count('request')+(Number(data.unread)||0));
    });

    document.querySelectorAll('.cw-f-notif-badge').forEach(b=>{
      b.textContent=data.unread||0;
      b.hidden=!data.unread;
    });
  }

  function actions(p) {
    if(p.state==='request')
      return `
        <button class="btn btn-primary" data-friend-action="accept" data-person="${esc(p.id)}">Accept</button>
        <button class="icon-btn" data-friend-action="decline" data-person="${esc(p.id)}" aria-label="Decline ${esc(p.name)}">×</button>
      `;

    if(p.state==='pending')
      return `<button class="btn btn-outline" data-friend-action="cancel" data-person="${esc(p.id)}">Pending ×</button>`;

    if(p.state==='friend')
      return cheer(p)+`
        <button class="icon-btn" data-friend-action="remove" data-person="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button>
      `;

    return `<button class="btn btn-primary" data-friend-action="add" data-person="${esc(p.id)}">+ Add</button>`;
  }

  function mutualLabel(p) {
    const names = (
      Array.isArray(p.mutual_names) ? p.mutual_names : []
    ).filter(Boolean);

    const total = Number(p.mutuals) || 0;
    if (!total || !names.length) return '';

    let label = '';

    if (total === 1)
      label = `Friends with ${names[0]}`;
    else if (total === 2 && names.length >= 2)
      label = `Friends with ${names[0]} and ${names[1]}`;
    else if (names.length >= 2)
      label = `Friends with ${names[0]}, ${names[1]}, and ${total - 2} ${
        total - 2 === 1 ? 'other' : 'others'
      }`;
    else
      label = `Friends with ${names[0]} and ${total - 1} ${
        total - 1 === 1 ? 'other' : 'others'
      }`;

    return `<span class="cw-f-mutual">${esc(label)}</span>`;
  }

  function personRow(p) {
    return `
      <div class="cw-f-person"${p.state==='friend'?` data-friend-row="${esc(p.id)}"`:''}>
        ${avatarLink(p)}
        <div class="cw-f-person-copy">
          <button type="button" class="cw-f-person-link" data-friend-detail="${esc(p.id)}">${esc(p.name)}</button>
          <span>@${esc(p.handle)}</span>
          ${
            p.state==='friend'
              ? ''
              : active==='add'
                ? mutualLabel(p)
                : ''
          }
        </div>
        <div class="cw-f-person-actions">${actions(p)}</div>
      </div>
    `;
  }

  function rows() {
    if(!loaded)
      return '<p class="cw-f-empty">Loading friends…</p>';

    let list=[];

    if(active==='friends')
      list=friends();

    if(active==='requests')
      list=people().filter(p=>
        p.state==='request'||p.state==='pending'
      );

    if(active==='add')
      list=people()
        .filter(p=>
          p.state==='none' &&
          (!search.trim() ||
            (p.handle||'').toLowerCase().includes(
              search.trim().toLowerCase()
            ))
        )
        .sort((a,b)=>Number(b.mutuals)-Number(a.mutuals))
        .slice(0,12);

    if(active==='notifications')
      return (data.notifications||[]).length
        ? data.notifications.map(n=>`
            <div class="cw-f-notification">
              <strong>${esc(n.sender)} cheered you on!</strong>
              <p>${esc(n.message)}</p>
              <small>${new Date(n.created_at).toLocaleString(undefined, window.Tidy?.timeFormat?.() === '24' ? {hourCycle:'h23'} : undefined)}</small>
            </div>
          `).join('')
        : '<p class="cw-f-empty">No cheers yet. Your hype squad will show up here!</p>';

    return list.length
      ? list.map(personRow).join('')
      : `<div class="cw-f-empty">${
          active==='add'
            ? 'No suggested users match. Try searching by username.'
            : active==='requests'
              ? 'No pending requests.'
              : 'Your friends will appear here.'
        }</div>`;
  }

  function friendDetail(p) {
    const current = Math.max(0, Number(p.streak) || 0);
    const today = Math.max(0, Number(p.today) || 0);
    return `<button type="button" class="cw-f-back" data-friend-back>← Back to friends</button>
      <div class="cw-f-detail-profile">${bigAvatar(p)}<h3>${esc(p.name)}</h3><p>@${esc(p.handle)}</p></div>
      <div class="cw-f-detail-stats">
        <div class="cw-f-detail-stat"><span class="cw-f-detail-stat-icon" aria-hidden="true">🔥</span><strong>${current}</strong><span>Current streak</span></div>
        <div class="cw-f-detail-stat"><span class="cw-f-detail-stat-icon cw-f-detail-stat-check" aria-hidden="true">✓</span><strong>${today}</strong><span>Tasks done today</span></div>
      </div>
      <div class="cw-f-detail-cheer">${cheer(p)}</div>`;
  }

  function renderPanel() {
    if(!dialog)return;
    const detail=detailId && friends().find(p=>String(p.id)===String(detailId));
    if(detailId && !detail) detailId=null;
    if(!detail) photoOpen=false;

    dialog.innerHTML=`
      <div class="cw-f-panel-head">
        <div>
          <span class="cw-f-eyebrow">YOUR CIRCLE</span>
          <h2 id="cw-f-title">Friends</h2>
        </div>
        <button class="icon-btn" data-friends-close aria-label="Close friends">×</button>
      </div>

       ${detail ? friendDetail(detail) : `
       <p class="cw-f-subtitle">Make room for your people.</p>

      <div class="cw-f-tabs" aria-label="Friends views">
        ${
          [
            ['friends','My friends'],
            ['requests',`Requests (${count('request')+count('pending')})`],
            ['add','Add friend']
          ].map(([id,label])=>`
            <button type="button" data-f-tab="${id}" aria-pressed="${active===id}">
              ${label}
            </button>
          `).join('')
        }
      </div>

      ${
        active==='add'
          ? `<label class="cw-f-search">
               Find a friend
               <input id="cw-f-search" type="search" placeholder="Search by username" value="${esc(search)}" autocomplete="off">
             </label>
             <p class="cw-f-subtitle">
               ${search.trim()?'Search results':'People you may know · mutual friends first'}
             </p>`
          : ''
      }

      ${
        active==='friends'
          ? `<button class="btn btn-outline cw-f-inbox" data-f-tab="notifications">
               Cheer inbox ${data.unread?`(${data.unread} new)`:''}
             </button>`
          : ''
      }

      ${
        active==='notifications'
          ? '<button class="btn btn-outline cw-f-inbox" data-f-tab="friends">← Back to friends</button>'
          : ''
      }

      <div class="cw-f-results">${rows()}</div>

      <p class="cw-f-feedback" role="status" aria-live="polite">
        ${esc(error)}
      </p>

      ${
        active==='friends'
          ? `<div class="cw-f-note">
               Open a friend to see their current streak and how many tasks they've finished today.
               Individual task details stay private. Streaks count days with at least one finished task.
               Cheers and days reset at midnight Mountain Time.
             </div>`
          : ''
      }
       `}
    `;
  }

  async function load(query='', {silent=false}={}) {
    if (!db || (silent && refreshInFlight)) return;
    if (silent) refreshInFlight = true;

    const id=++searchSeq;

    try {
      const {data:result,error:dbError}=await db.rpc(
        'coursewise_friends_data',
        {p_query:query}
      );

      if(dbError)throw dbError;
      if(id!==searchSeq)return;

      await window.CoursewisePhotos.enrichPeople(result.people || []);
      if(id!==searchSeq)return;
      const fingerprint=JSON.stringify(result);
      const changed=fingerprint!==lastDataFingerprint;

      data=result;
      loaded=true;
      lastDataFingerprint=fingerprint;

      celebrateIncoming();

      if (!changed && silent) return;

    } catch(e) {
      if(id!==searchSeq)return;
      if (silent) return;

      error='Friends are not connected yet. Check the friends SQL in Supabase. '+(e.message||'');
      loaded=true;

    } finally {
      if(silent)refreshInFlight=false;
    }

    refreshCard();

    if(
      dialog?.open &&
      !(silent && document.activeElement?.id==='cw-f-search')
    ) renderPanel();
  }

  async function action(type,target) {
    if(busy)return;
    busy=true;

    try {
      const {error:e}=await db.rpc(
        'coursewise_friend_action',
        {p_action:type,p_target:target||null}
      );

      if(e)throw e;

      await load(search);

      temporaryFeedback(
        type==='cheer'?'Cheer sent!':
        type==='add'?'Friend request sent.':
        type==='accept'?'Friend request accepted.':
        type==='cancel'?'Request canceled.':
        type==='decline'?'Request declined.':
        type==='remove'?'Friend removed.':''
      );

    } catch(e) {
      temporaryFeedback(e.message||'Could not update friends.');

    } finally {
      busy=false;
      refreshCard();
      if(dialog?.open)renderPanel();
    }
  }

  // Slide the panel out (and fade the backdrop) before actually closing the dialog.
  function closePanel() {
    if(!dialog?.open||dialog.classList.contains('is-closing'))return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.close();
      return;
    }
    let finished=false;
    const finish=()=>{
      if(finished)return;
      finished=true;
      dialog.classList.remove('is-closing');
      if(dialog.open)dialog.close();
    };
    dialog.classList.add('is-closing');
    dialog.addEventListener('animationend',e=>{
      if(e.target===dialog&&e.animationName==='cw-f-exit')finish();
    });
    setTimeout(finish,400); // safety net if the animation event never fires
  }

  function open(view,trigger) {
    detailId=null;
    active=view||'friends';
    opener=trigger;
    error='';
    clearTimeout(feedbackTimer);

    renderPanel();

    if(!dialog.open) {
      priorOverflow=document.body.style.overflow;
      document.body.style.overflow='hidden';
      dialog.showModal();
    }

    dialog.querySelector('#cw-f-search, [data-friends-close]')?.focus();

    if(active==='notifications'&&data.unread)
      void action('read');
  }

  function mount() {
    if(dialog)return;

    const profile=document.querySelector('.site-header .avatar');
    if(!profile)return;

    profile.insertAdjacentHTML(
      'beforebegin',
      `<button class="cw-f-trigger" data-friends-open="friends" aria-label="Open friends" aria-haspopup="dialog">
        ${icon}
        <span class="cw-f-trigger-label">Friends</span>
        <span class="cw-f-badge" hidden></span>
      </button>`
    );

    dialog=document.createElement('dialog');
    dialog.className='cw-f-dialog';
    dialog.setAttribute('aria-labelledby','cw-f-title');
    document.body.append(dialog);

    dialog.addEventListener('cancel',e=>{
      e.preventDefault();
      closePanel();
    });

    dialog.addEventListener('close',()=>{
      document.body.style.overflow=priorOverflow;
      opener?.focus();
    });

    dialog.addEventListener('click',e=>{
      if(e.target===dialog) {
        const r=dialog.getBoundingClientRect();

        if(
          e.clientX<r.left ||
          e.clientX>r.right ||
          e.clientY<r.top ||
          e.clientY>r.bottom
        ) closePanel();
      }
    });

    let searchTimer;

    dialog.addEventListener('input',e=>{
      if(e.target.id!=='cw-f-search')return;

      search=e.target.value;
      clearTimeout(searchTimer);

      searchTimer=setTimeout(()=>{
        const current=document.activeElement===e.target;

        void load(search).then(()=>{
          if(current&&dialog.open) {
            const input=dialog.querySelector('#cw-f-search');
            input?.focus();
            input?.setSelectionRange(search.length,search.length);
          }
        });
      },250);
    });

    document.addEventListener('click',e=>{
      const cheerButton=e.target.closest('[data-friend-cheer]');

      if(cheerButton) {
        if(cheerButton.disabled||busy)return;

        if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          cheerButton.classList.add('is-celebrating');

          const burst=document.createElement('span');
          burst.className='cw-f-sparkles';
          burst.setAttribute('aria-hidden','true');

          burst.innerHTML=Array.from(
            {length:6},
            (_,i)=>`<i style="--spark:${i}">✦</i>`
          ).join('');

          cheerButton.append(burst);
        }

        void action('cheer',cheerButton.dataset.friendCheer);
        return;
      }

      const photoButton=e.target.closest('[data-friend-photo]');
      if(photoButton) {
        // Toggle the class directly (no re-render) so the size change animates.
        photoOpen=!photoOpen;
        const person=friends().find(p=>String(p.id)===photoButton.dataset.friendPhoto);
        photoButton.classList.toggle('is-open',photoOpen);
        photoButton.setAttribute('aria-expanded',String(photoOpen));
        photoButton.setAttribute('aria-label',`${photoOpen?'Shrink':'Enlarge'} ${person?.name||''}'s photo`);
        return;
      }

      // Tapping a friend's row (outside its buttons) also opens their profile.
      const rowTap=!e.target.closest('button,a,input,label')&&e.target.closest('[data-friend-row]');
      const detailButton=e.target.closest('[data-friend-detail]')||(rowTap?{dataset:{friendDetail:rowTap.dataset.friendRow}}:null);
      if(detailButton) {
        detailId=detailButton.dataset.friendDetail;
        photoOpen=false;
        active='friends';
        if(!dialog.open) {
          opener=e.target.closest('button')||rowTap||null;
          priorOverflow=document.body.style.overflow;
          document.body.style.overflow='hidden';
          dialog.showModal();
        }
        renderPanel();
        dialog.querySelector('[data-friend-back]')?.focus();
        return;
      }
      if(e.target.closest('[data-friend-back]')) {
        detailId=null;active='friends';renderPanel();
        dialog.querySelector('[data-f-tab="friends"]')?.focus();
        return;
      }
      const trigger=e.target.closest('[data-friends-open]');
      if(trigger) {
        open(trigger.dataset.friendsOpen,trigger);
        return;
      }

      if(e.target.closest('[data-friends-close]')) {
        closePanel();
        return;
      }

      const tab=e.target.closest('[data-f-tab]');
      if(tab) {
        detailId=null;
        active=tab.dataset.fTab;
        error='';
        clearTimeout(feedbackTimer);

        renderPanel();

        if(active==='notifications'&&data.unread)
          void action('read');

        return;
      }

      const btn=e.target.closest('[data-friend-action]');
      if(btn) {
        if(
          btn.dataset.friendAction==='remove' &&
          !confirm('Remove this friend?')
        ) return;

        void action(btn.dataset.friendAction,btn.dataset.person);
      }
    });

    void load();

    // Refresh automatically while Coursewise is open.
    // Also check when the user comes back to the tab.
    const refresh = () => {
      if(!document.hidden && !busy)
        void load(search, {silent:true});
    };

    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('focus',refresh);
    setInterval(refresh,REFRESH_MS);
  }

  window.CoursewiseFriends={
    mount,
    card:()=>`<section class="card cw-f-card" aria-label="Friends">${cardBody()}</section>`
  };
})();
