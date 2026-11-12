
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


  /* ==========================================
     WHIMSY — INCOMING FRIEND CHEER BANKS
     ========================================== */

  const THEMED_CHEERS = {
    northpole: {
      title: "Special delivery",
      low: [
        "The elves are rooting for you!",
        "One little present at a time. You've got this!"
      ],
      mid: [
        "The workshop is buzzing about your progress!",
        "Santa's impressed with your hard work!"
      ],
      high: [
        "Even Santa couldn't keep up with you!",
        "You've officially outworked the entire workshop!"
      ],
      rare: [
        "An anonymous reindeer has nominated you for Employee of the Month.",
        "BREAKING: The elves are demanding a cookie break in your honor."
      ]
    },

    cottage: {
      title: "A little sunshine",
      low: [
        "Every garden begins with a single seed.",
        "Your garden grows at its own pace. Keep going!"
      ],
      mid: [
        "Look at all those little accomplishments blooming!",
        "The butterflies have noticed your hard work!"
      ],
      high: [
        "Your garden is positively overflowing!",
        "You've grown an entire meadow of accomplishments!"
      ],
      rare: [
        "The mushroom council has declared a holiday in your honor.",
        "A hedgehog in a waistcoat has requested your autograph."
      ]
    },

    pirate: {
      title: "A message from the crew",
      low: [
        "Steady as she goes, Captain. Your crew's with you!",
        "Every great voyage begins with one small step aboard."
      ],
      mid: [
        "Now that's a fine haul of treasure!",
        "Your crew is celebrating another successful voyage!"
      ],
      high: [
        "You've conquered enough quests to fill a treasure chest!",
        "The entire fleet is raising its flags for you!"
      ],
      rare: [
        "A seagull has attempted to steal your diploma.",
        "The Pirate Council has declared you dangerously competent."
      ]
    },

    space: {
      title: "Incoming transmission",
      low: [
        "Mission Control believes in you, Commander.",
        "Every mission begins with a single launch."
      ],
      mid: [
        "Your mission progress is exceeding expectations!",
        "Mission Control reports impressive momentum!"
      ],
      high: [
        "Commander, your productivity is approaching warp speed.",
        "The entire galaxy is applauding your accomplishments!"
      ],
      rare: [
        "NASA would like to borrow your brain. Legal is reviewing the request.",
        "A small moon has been named after you. Paperwork pending."
      ]
    },

    kingdom: {
      title: "A royal proclamation",
      low: [
        "The court stands behind you, Your Majesty.",
        "Even the greatest kingdoms are built one stone at a time."
      ],
      mid: [
        "Your royal accomplishments are drawing applause!",
        "The kingdom celebrates your noble progress!"
      ],
      high: [
        "A royal holiday has been declared in your honor!",
        "The royal council is running out of medals to award you!"
      ],
      rare: [
        "The royal goose has knighted you. HONK.",
        "A bard has composed seventeen verses about your productivity."
      ]
    },

    west: {
      title: "News from the frontier",
      low: [
        "Keep your chin up, partner. You've got this!",
        "Every long trail starts with one step."
      ],
      mid: [
        "You're rounding up those tasks like a pro!",
        "The whole town's tipping their hats to you!"
      ],
      high: [
        "You've conquered the entire frontier, partner!",
        "The sheriff has officially declared you unstoppable!"
      ],
      rare: [
        "WANTED: For excessive productivity. Reward: One cookie.",
        "The town has named a horse after you. It's very fast."
      ]
    },

    dinos: {
      title: "A prehistoric roar",
      low: [
        "The dig team believes in you. One fossil at a time!",
        "Every great discovery starts with a little digging."
      ],
      mid: [
        "Five discoveries? You're making prehistoric history!",
        "The entire dig team is celebrating your progress!"
      ],
      high: [
        "The museum needs an entire wing dedicated to you!",
        "Your productivity is officially dinosaur-sized!"
      ],
      rare: [
        "A tiny T. rex has requested your autograph. The pen is proving difficult.",
        "Scientists have named a new species Productivitysaurus magnificentus."
      ]
    },

    faeries: {
      title: "A magical blessing",
      low: [
        "Even the smallest spell begins with a spark.",
        "The fairy circle believes in your magic!"
      ],
      mid: [
        "The fairy circle celebrates your growing magic!",
        "Your accomplishments are making the forest sparkle!"
      ],
      high: [
        "The entire enchanted realm is in awe of you!",
        "Your magic is powerful enough to light a thousand lanterns!"
      ],
      rare: [
        "A mushroom has proclaimed you ruler of the forest. It's official.",
        "A unicorn has requested an appointment with your publicist."
      ]
    },

    sports: {
      title: "A cheer from the sidelines",
      low: [
        "Your team believes in you. Keep playing!",
        "One play at a time. You've got this!"
      ],
      mid: [
        "WHAT A PLAY! The crowd is going wild!",
        "Your team is celebrating some serious progress!"
      ],
      high: [
        "MVP! MVP! MVP! The stadium is chanting your name!",
        "You've absolutely dominated the scoreboard today!"
      ],
      rare: [
        "The mascot has performed a backflip in your honor.",
        "The commentators have run out of superlatives. Send help."
      ]
    },

    cars: {
      title: "A message from the pit crew",
      low: [
        "Your pit crew has your back. Keep going!",
        "Every great race starts at the starting line."
      ],
      mid: [
        "You're putting in some seriously impressive laps!",
        "Your pit crew is celebrating that momentum!"
      ],
      high: [
        "CHECKERED FLAG! What an incredible performance!",
        "You've officially lapped your entire to-do list!"
      ],
      rare: [
        "Race control is investigating your suspiciously fast productivity.",
        "Your homework has just set a new lap record at Monaco."
      ]
    },

    dragon: {
      title: "A message from the dragons",
      low: [
        "Even the mightiest dragon begins with a spark.",
        "The dragons believe in your growing strength!"
      ],
      mid: [
        "Your hoard of accomplishments is growing!",
        "The dragons roar in celebration of your progress!"
      ],
      high: [
        "Your achievements are worthy of a legendary hoard!",
        "The entire dragon kingdom bows before your greatness!"
      ],
      rare: [
        "A baby dragon has attempted to eat your homework. It tasted like victory.",
        "The ancient dragons have declared you an honorary menace."
      ]
    },

    samurai: {
      title: "A Message from the Clan",
      low: [
        "Every journey begins with one step. Your allies stand with you."
      ],
      mid: [
        "Word of your steady progress is spreading."
      ],
      high: [
        "The daimyō’s court has heard of your diligence."
      ],
      rare: [
        "The shōgun has heard of your remarkable effort."
      ]
    }
  };

  /* These are the existing Supabase message tiers.
     Matching them preserves the original progress
     categories and the server's rare-message roll. */

  const ORIGINAL_CHEER_TIERS = {
    low: [
      "Lock in. You got this. 🔒",
      "One task at a time. You've got this.",
      "Someone's rooting for you!",
      "Progress is progress. Keep it up.",
      "You got this. Now go make it happen.",
      "Your hype squad has arrived."
    ],
    mid: [
      "Okay, you're actually cooking. 🔥",
      "You're crushing it today.",
      "Someone understood the assignment.",
      "The to-do list never stood a chance.",
      "Keep that momentum going!",
      "That's some serious progress. Nice work."
    ],
    high: [
      "Respectfully, go touch grass. 🌱",
      "At this point, your to-do list is afraid of you.",
      "Absolute academic weapon.",
      "Your productivity is getting out of hand. Take a break.",
      "You're on another level today.",
      "That's enough productivity to last a week."
    ],
    rare: [
      "Achievement unlocked: Main character energy.",
      "This is your sign to get a little treat.",
      "Your productivity has been deemed suspicious. We're investigating.",
      "Side quest complete: Being productive.",
      "You have earned one (1) imaginary gold star. ⭐",
      "Your effort has been noted. This message is your official recognition.",
      "Plot twist: You're actually getting things done.",
      "Somewhere, your future self is giving you a standing ovation."
    ]
  };

  function cheerMessageTier(message) {
    for (const [tier, messages] of Object.entries(ORIGINAL_CHEER_TIERS)) {
      if (messages.includes(message)) return tier;
    }

    return null;
  }

  /* Deterministic selection: the same cheer keeps
     the same themed message across refreshes. */

  function stableCheerIndex(notification, count) {
    const key = [
      notification.sender,
      notification.created_at,
      notification.message
    ].join("|");

    let hash = 0;

    for (let i = 0; i < key.length; i++) {
      hash = (Math.imul(hash, 31) + key.charCodeAt(i)) | 0;
    }

    return (hash >>> 0) % count;
  }

  /* A cheer keeps the theme it was first shown in. Themes are applied when a cheer is
     displayed (the server stores the plain message), so without this a dragon cheer
     would turn plain whenever the theme is off, switched or not loaded on a page. */
  const CHEER_THEMES_KEY = 'cw-f-cheer-themes-v1';
  let cheerThemes = null;
  function cheerThemeMap() {
    if (cheerThemes) return cheerThemes;
    try { cheerThemes = JSON.parse(localStorage.getItem(CHEER_THEMES_KEY) || '{}') || {}; }
    catch { cheerThemes = {}; }
    return cheerThemes;
  }
  function rememberCheerTheme(key, themeName) {
    const map = cheerThemeMap();
    if (map[key] === themeName) return;
    map[key] = themeName;
    // Keep the newest 300 so storage doesn't grow forever.
    const keys = Object.keys(map);
    for (const old of keys.slice(0, Math.max(0, keys.length - 300))) delete map[old];
    try { localStorage.setItem(CHEER_THEMES_KEY, JSON.stringify(map)); } catch {}
  }

  function cheerDisplay(notification) {
    const settings = window.CoursewiseWhimsy?.config?.();
    const themeKey = `${notification.sender}|${notification.created_at}`;
    // The sender's theme is saved with each cheer on the server; that decides its look.
    // Older cheers without one fall back to the theme they were first shown in here.
    const senderTheme = notification.sender_theme;
    const savedTheme = cheerThemeMap()[themeKey];
    const themeName = 'sender_theme' in notification
      ? (THEMED_CHEERS[senderTheme] ? senderTheme : null)
      : THEMED_CHEERS[savedTheme]
        ? savedTheme
        : (settings?.enabled && THEMED_CHEERS[settings.theme] ? settings.theme : null);
    const theme = themeName ? THEMED_CHEERS[themeName] : null;
    const fromSender = Boolean(theme) && 'sender_theme' in notification;

    const sender = notification.sender || "A friend";
    const original = notification.message || "";

    if (!theme) {
      return {
        title: `👏 ${sender} cheered you on!`,
        message: original
      };
    }

    const tier = cheerMessageTier(original);
    const bank = tier ? theme[tier] : null;

    /* Unknown server messages remain untouched. */
    const message = bank?.length
      ? bank[stableCheerIndex(notification, bank.length)]
      : original;

    if (bank?.length) rememberCheerTheme(themeKey, themeName);

    return {
      title: `${theme.title} from ${sender}!`,
      message,
      // Themed in the history when the sender cheered in a theme (even if the theme has
      // no version of this message, the words stay and the look changes), or when the
      // theme rewrote the message.
      themeTitle: (fromSender || bank?.length) ? theme.title : undefined,
      themeName: (fromSender || bank?.length) ? themeName : undefined
    };
  }


  function showCheerToast(notification) {
    document.querySelector('.cw-f-celebration')?.remove();

    const cheerText = cheerDisplay(notification);

    const toast = document.createElement('aside');
    toast.className = 'cw-f-celebration';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="cw-f-celebration-copy">
        <strong>${esc(cheerText.title)}</strong>
        <p>${esc(cheerText.message)}</p>
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

  const FLAME = '<svg viewBox="0 0 24 28" aria-hidden="true"><path fill="currentColor" d="M12 1c1.2 4.6 7.5 7.4 7.5 14.2A7.5 7.5 0 0 1 12 27a7.5 7.5 0 0 1-7.5-11.8c0 2.3 1.4 3.9 3 4.3C6.8 14 9 5.5 12 1z"/></svg>';
  const CIRCLE_MAX = 4;

  // Today circle: tapping a friend opens their profile. On devices with a mouse, hovering shows a quick Cheer button.
  // The flame is orange when the friend has finished a task today and gray when they haven't yet.
  function circleTile(p) {
    const done = (Number(p.today) || 0) > 0;
    const streak = Math.max(0, Number(p.streak) || 0);
    const first = String(p.name || p.handle || '').split(' ')[0];
    const label = `${p.name}, ${streak ? `${streak}-day streak` : 'no streak'}${done ? ', finished a task today' : ''}. Open profile`;
    return `<div class="cw-f-tile-wrap">
        <button type="button" class="cw-f-tile${done ? ' is-done' : ''}" data-friend-detail="${esc(p.id)}" aria-label="${esc(label)}">
          <span class="cw-f-ring">${avatar(p)}</span>
          <span class="cw-f-tile-name">${esc(first)}</span>
          <span class="cw-f-tile-streak"${streak ? ` title="${done ? 'Finished a task today' : 'Nothing finished yet today'}"` : ''}>${streak ? `${FLAME}${streak}` : '&nbsp;'}</span>
        </button>
        ${p.cheered ? '' : `<button type="button" class="cw-f-quick-cheer" data-friend-cheer="${esc(p.id)}" aria-label="Cheer for ${esc(p.name)}" title="Cheer for ${esc(first)}"><span aria-hidden="true">👏</span></button>`}
      </div>`;
  }

  function requestRow() {
    const requests = people().filter(p => p.state === 'request');
    if (!requests.length) return '';
    const p = requests[0], more = requests.length - 1;
    return `<div class="cw-f-invite">
        ${avatar(p)}
        <span class="cw-f-invite-copy"><b>${esc(p.name)}</b><span>Friend request${more ? ` · <button type="button" class="cw-f-invite-more" data-friends-open="requests">+${more} more</button>` : ''}</span></span>
        <button type="button" class="btn btn-outline" data-friend-action="decline" data-person="${esc(p.id)}" aria-label="Decline ${esc(p.name)}">Decline</button>
        <button type="button" class="btn btn-primary" data-friend-action="accept" data-person="${esc(p.id)}" aria-label="Accept ${esc(p.name)}">Accept</button>
      </div>`;
  }

  function cardBody() {
    const list = friends();
    const overflow = list.length > CIRCLE_MAX;
    const shown = overflow ? list.slice(0, CIRCLE_MAX - 1) : list;
    return `
      <div class="section-head">
        <h2>Friends <span class="count">${list.length}</span></h2>
      </div>
      <div class="cw-f-card-actions">
        <button class="btn btn-outline" data-friends-open="friends">View friends</button>
        <button class="btn btn-primary" data-friends-open="add">+ Add friend</button>
      </div>
      ${
        list.length
          ? `<div class="cw-f-circle">${shown.map(circleTile).join('')}${
              overflow
                ? `<button type="button" class="cw-f-tile cw-f-tile-more" data-friends-open="friends" aria-label="See all ${list.length} friends">
                     <span class="cw-f-ring"><span class="cw-f-avatar cw-f-more-face">+${list.length - shown.length}</span></span>
                     <span class="cw-f-tile-name">More</span><span class="cw-f-tile-streak">&nbsp;</span>
                   </button>`
                : ''
            }</div>`
          : '<p class="cw-f-empty">Add a friend to cheer each other on!</p>'
      }
      ${requestRow()}
      <p class="cw-f-card-feedback sr-only" role="status" aria-live="polite"></p>
    `;
  }

  function refreshCard() {
    document.querySelectorAll('.cw-f-card').forEach(
      c => c.innerHTML=cardBody()
    );
    document.dispatchEvent(new CustomEvent('coursewise:friends'));

    const pending=count('request')+(Number(data.unread)||0);
    document.querySelectorAll('.cw-f-badge').forEach(b=>{
      b.textContent=pending;
      b.hidden=!pending;
    });
    document.querySelectorAll('.cw-f-trigger').forEach(t=>{
      t.setAttribute('aria-label',pending?`Open friends, ${pending} new`:'Open friends');
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
      return cheerHistory();

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

  /* ==========================================
     CHEER HISTORY
     Grouped by day, with avatars, speech bubbles, a weekly summary,
     unread dots and Cheer back.
  ========================================== */
  // Cheers that were unread when the history opened. Opening the history marks them
  // read on the server right away, so this keeps their dots visible while you look.
  let unreadSnapshot = new Set();
  const cheerKey = n => `${n.sender_id || n.sender}|${n.created_at}`;
  function snapshotUnread() {
    unreadSnapshot = new Set((data.notifications || []).filter(n => !n.seen).map(cheerKey));
  }

  const firstName = name => String(name || 'A friend').trim().split(/\s+/)[0];
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  function cheerDayLabel(date) {
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
  }

  function cheerTimeLabel(date) {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    const today = startOfDay(date).getTime() === startOfDay(new Date()).getTime();
    if (today && minutes < 1) return 'Just now';
    if (today && minutes < 60) return `${minutes}m ago`;
    if (today && minutes < 6 * 60) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric', minute: '2-digit',
      ...(window.Tidy?.timeFormat?.() === '24' ? { hourCycle: 'h23' } : {})
    });
  }

  function cheerSummary(list) {
    const weekAgo = Date.now() - 7 * 86400000;
    const week = list.filter(n => new Date(n.created_at).getTime() >= weekAgo);
    if (!week.length) return '';
    const bySender = new Map();
    for (const n of week) {
      const key = n.sender_id || n.sender;
      const entry = bySender.get(key) || { n, count: 0 };
      entry.count++;
      bySender.set(key, entry);
    }
    const ranked = [...bySender.values()].sort((a, b) => b.count - a.count);
    // Only name a "biggest fan" when one friend clearly leads.
    const fan = ranked[0].count >= 2 && (ranked.length === 1 || ranked[0].count > ranked[1].count)
      ? ` ${esc(firstName(ranked[0].n.sender))}’s your biggest fan.` : '';
    const faces = ranked.slice(0, 3).map(({ n }) => avatar(cheerPerson(n))).join('');
    const friendsText = bySender.size === 1 ? 'from 1 friend' : `from ${bySender.size} friends`;
    return `<div class="cw-f-cheer-summary">
      <div class="cw-f-cheer-faces" aria-hidden="true">${faces}</div>
      <p><strong>${week.length} ${week.length === 1 ? 'cheer' : 'cheers'} this week</strong> ${friendsText}.${fan}</p>
    </div>`;
  }

  // The friend behind a cheer, for their photo and Cheer back. Falls back to a
  // name-only person when they are no longer a friend (or sender_id isn't sent yet).
  function cheerPerson(n) {
    const friend = n.sender_id ? friends().find(p => String(p.id) === String(n.sender_id)) : null;
    return friend || { id: n.sender_id || n.sender || '?', name: n.sender || 'A friend', photoUrl: null };
  }

  // How each theme looks in the cheer history: an icon, and the wording after
  // "[Name] sent …" where the theme's own heading doesn't read naturally there.
  // Bubble colors live in css/friends.css ([data-cheer-theme]).
  const CHEER_THEME_STYLE = {
    northpole: { icon: '🎁', sent: 'a special delivery' },
    cottage:   { icon: '🌻' },
    pirate:    { icon: '⚓' },
    space:     { icon: '🚀', sent: 'an incoming transmission' },
    kingdom:   { icon: '👑' },
    west:      { icon: '🤠' },
    dinos:     { icon: '🦕' },
    faeries:   { icon: '✨' },
    sports:    { icon: '🏆' },
    cars:      { icon: '🏁' },
    dragon:    { icon: '🐉' },
    samurai:   { icon: '⛩️', sent: 'a message from the clan' }
  };

  function cheerHistory() {
    const list = data.notifications || [];
    if (!list.length) {
      return `<div class="cw-f-cheer-empty">
        <span class="cw-f-cheer-empty-icon" aria-hidden="true">👏</span>
        <strong>No cheers yet</strong>
        <p>When friends cheer you on, it’ll show up here. Why not start the chain?</p>
        <button type="button" class="btn btn-primary" data-f-tab="friends">Cheer a friend</button>
      </div>`;
    }

    // Cheer back is offered once per friend, on their most recent cheer.
    const latestFrom = new Set();
    let html = cheerSummary(list);
    let currentDay = '';
    for (const n of list) {
      const date = new Date(n.created_at);
      const day = cheerDayLabel(date);
      if (day !== currentDay) {
        if (currentDay) html += '</ol>';
        html += `<h3 class="cw-f-cheer-day">${esc(day)}</h3><ol class="cw-f-cheer-list">`;
        currentDay = day;
      }
      const person = cheerPerson(n);
      const text = cheerDisplay(n);
      const name = firstName(n.sender);
      const themed = Boolean(text.themeTitle);
      const style = themed ? CHEER_THEME_STYLE[text.themeName] || {} : {};
      const sentWhat = style.sent || (text.themeTitle ? text.themeTitle.charAt(0).toLowerCase() + text.themeTitle.slice(1) : '');
      const headline = themed
        ? `${style.icon ? `<span class="cw-f-cheer-theme-icon" aria-hidden="true">${style.icon}</span>` : ''}${esc(name)} sent ${esc(sentWhat)}`
        : `${esc(name)} cheered you on`;
      const unread = unreadSnapshot.has(cheerKey(n));

      let back = '';
      const isFriend = person.state === 'friend';
      if (isFriend && !latestFrom.has(person.id)) {
        latestFrom.add(person.id);
        back = person.cheered
          ? `<span class="cw-f-cheer-back is-done"><span aria-hidden="true">✓</span> Cheered back today</span>`
          : `<button type="button" class="cw-f-cheer-back" data-friend-cheer="${esc(person.id)}" aria-label="Cheer back ${esc(person.name)}"><span aria-hidden="true">👏</span> Cheer back</button>`;
      }

      html += `<li class="cw-f-cheer-row${themed ? ' is-themed' : ''}${unread ? ' is-unread' : ''}"${themed ? ` data-cheer-theme="${esc(text.themeName)}"` : ''}>
        <span class="cw-f-cheer-avatar">${avatar(person)}${unread ? '<span class="cw-f-cheer-dot" aria-hidden="true"></span>' : ''}</span>
        <div class="cw-f-cheer-body">
          <div class="cw-f-cheer-line">
            <strong>${headline}${unread ? '<span class="sr-only"> (new)</span>' : ''}</strong>
            <time datetime="${esc(n.created_at)}" title="${esc(date.toLocaleString())}">${esc(cheerTimeLabel(date))}</time>
          </div>
          ${text.message ? `<p class="cw-f-cheer-bubble">${esc(text.message)}</p>` : ''}
          ${back}
        </div>
      </li>`;
    }
    return html + '</ol>';
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
          ${active==='notifications' && !detail
            ? '<button type="button" class="cw-f-back cw-f-back-top" data-f-tab="friends"><span aria-hidden="true">‹</span> Friends</button>'
            : '<span class="cw-f-eyebrow">YOUR CIRCLE</span>'}
          <h2 id="cw-f-title">${active==='notifications' && !detail ? 'Cheers' : 'Friends'}</h2>
        </div>
        <button class="icon-btn" data-friends-close aria-label="Close friends">×</button>
      </div>

       ${detail ? friendDetail(detail) : `
       ${active==='notifications' ? '' : `<p class="cw-f-subtitle">Make room for your people.</p>

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
      </div>`}

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
      // A cheer carries the sender's theme (saved as sender_theme), so the friend sees
      // it in that theme. With no theme on, the original two-input version is used.
      const args={p_action:type,p_target:target||null};
      if(type==='cheer') {
        const whimsy=window.CoursewiseWhimsy?.config?.();
        if(whimsy?.enabled && THEMED_CHEERS[whimsy.theme]) args.p_theme=whimsy.theme;
      }
      const {error:e}=await db.rpc('coursewise_friend_action',args);

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

    if(active==='notifications') snapshotUnread();
    if(active==='notifications'&&data.unread)
      void action('read');
  }

  function mount() {
    if(dialog)return;

    const profile=document.querySelector('.site-header .avatar');
    if(!profile)return;

    profile.insertAdjacentHTML(
      'beforebegin',
      `<button class="cw-f-trigger" data-friends-open="friends" aria-label="Open friends" title="Friends" aria-haspopup="dialog">
        ${icon}
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

        if(active==='notifications') snapshotUnread();
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
    card:()=>`<section class="card cw-f-card" aria-label="Friends">${cardBody()}</section>`,
    // Friends plus requests you've sent, for the getting-started guide.
    summary:()=>loaded?{friends:count('friend'),pending:count('pending')}:null
  };
})();
