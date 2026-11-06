/* Profile photos: private Supabase storage; signed URLs never enter profile records. */
(() => {
  const db = window.tidyClient, bucket = 'coursewise-avatars';
  let me = null, path = null, url = null, available = false;
  // Signed URLs are kept for the browser tab, so every page reuses the same address and the
  // browser can serve the photo from its own cache instead of downloading it again.
  const CACHE_KEY = 'cw-photo-urls', SEEN_KEY = 'cw-photo-seen';
  const readStore = key => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } };
  const writeStore = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const cache = new Map(Object.entries(readStore(CACHE_KEY) || {}).filter(([, v]) => v && v.until > Date.now()));
  const seen = new Set(readStore(SEEN_KEY) || []);
  const persist = () => {
    for (const [key, value] of cache) if (value.until <= Date.now()) cache.delete(key);
    writeStore(CACHE_KEY, Object.fromEntries(cache));
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function signed(photoPath) {
    if (!photoPath) return null;
    const cached = cache.get(photoPath);
    if (cached && cached.until > Date.now()) return cached.url;
    const { data, error } = await db.storage.from(bucket).createSignedUrl(photoPath, 3600);
    if (error) return null;
    cache.set(photoPath, { url: data.signedUrl, until: Date.now() + 3000000 });
    persist();
    return data.signedUrl;
  }
  // With a photo, the initials stay hidden and the photo fades in. A photo already shown in this tab
  // (so already cached by the browser) appears at once instead of fading again.
  function markup(initials, photoUrl = url) {
    const warm = photoUrl && seen.has(photoUrl);
    return `<span class="avatar-initials${photoUrl ? ' is-pending' : ''}">${esc(initials)}</span>${photoUrl ? `<img class="profile-photo${warm ? ' is-loaded' : ''}" src="${esc(photoUrl)}" alt="" decoding="async">` : ''}`;
  }
  function reveal(img) {
    if (img.classList.contains('is-loaded')) return;
    img.classList.add('is-loaded');
    const src = img.getAttribute('src');
    if (src && !seen.has(src)) { seen.add(src); writeStore(SEEN_KEY, [...seen].slice(-40)); }
  }
  function showInitials(img) {
    img.parentElement?.querySelector('.avatar-initials')?.classList.remove('is-pending');
  }
  document.addEventListener('load', event => {
    if (event.target.matches?.('img.profile-photo')) reveal(event.target);
  }, true);
  // A failed image goes away and the initials come back, without a broken-image icon.
  document.addEventListener('error', event => {
    const img = event.target;
    if (img.matches?.('img.profile-photo')) { showInitials(img); img.remove(); }
  }, true);
  // Images that finished before their load event could be seen, and a safety net for very slow ones.
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      const images = node.matches('img.profile-photo') ? [node] : [...node.querySelectorAll('img.profile-photo')];
      for (const img of images) {
        if (img.complete && img.naturalWidth > 0) reveal(img);
        else if (!img.classList.contains('is-loaded')) setTimeout(() => { if (img.isConnected && !img.classList.contains('is-loaded')) showInitials(img); }, 6000);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  function syncHeader() {
    const user = window.Tidy?.state.user;
    const avatar = document.querySelector('.site-header .avatar');
    if (!user || !avatar) return;
    const initials = (user.first[0] || '') + (user.last[0] || '');
    const key = `${url || ''}|${initials}`;
    if (avatar.dataset.cwPhoto === key) return; // unchanged: keep the photo that is already showing
    avatar.dataset.cwPhoto = key;
    avatar.innerHTML = markup(initials);
  }
  async function loadMe() {
    available = false; path = null; url = null;
    try {
      const { data: session } = await db.auth.getSession();
      me = session.session?.user.id;
      if (!me) return;
      const result = await db.from('coursewise_profile_photos').select('photo_path').eq('auth_user_id', me).maybeSingle();
      if (result.error) return;
      available = true; path = result.data?.photo_path || null; url = await signed(path);
      if (url) new Image().src = url; // start downloading while the rest of the page loads
    } catch { /* Optional setup must never block the rest of Coursewise. */ }
  }
  async function enrichPeople(people) {
    try {
      const ids = people.map(p => String(p.id));
      for (let i = 0; i < ids.length; i += 100) {
        const { data, error } = await db.rpc('coursewise_profile_photo_paths', { p_ids: ids.slice(i, i + 100) });
        if (error) return;
        await Promise.all((data || []).map(async row => {
          const person = people.find(p => String(p.id) === row.user_id);
          if (person) person.photoUrl = await signed(row.photo_path);
        }));
      }
    } catch { /* Friends still work when photo storage is unavailable. */ }
  }
  async function save(blob) {
    if (!available || !me) throw new Error('Profile photos are not set up yet. Run the profile photos SQL in Supabase first.');
    const nextPath = `${me}/${crypto.randomUUID()}.jpg`, previous = path;
    const upload = await db.storage.from(bucket).upload(nextPath, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
    if (upload.error) throw new Error('Could not upload your photo. Please try again.');
    const record = await db.from('coursewise_profile_photos').upsert({ auth_user_id: me, photo_path: nextPath }, { onConflict: 'auth_user_id' });
    if (record.error) {
      await db.storage.from(bucket).remove([nextPath]);
      throw new Error('Could not save your photo. Please try again.');
    }
    path = nextPath; url = await signed(path); syncHeader();
    if (previous) await db.storage.from(bucket).remove([previous]).catch(() => {});
  }
  async function remove() {
    if (!available || !me) throw new Error('Profile photos are unavailable. Please reload and try again.');
    const previous = path;
    const { error } = await db.from('coursewise_profile_photos').delete().eq('auth_user_id', me);
    if (error) throw new Error('Could not remove your photo. Please try again.');
    path = null; url = null; syncHeader();
    if (previous) await db.storage.from(bucket).remove([previous]).catch(() => {});
  }
  async function edit(file, done) {
    const U = window.Tidy.ui;
    if (!available) throw new Error('Profile photos are not set up yet. Run the profile photos SQL in Supabase first.');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image. For HEIC photos, export as JPG first.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Choose a photo smaller than 10 MB.');
    const objectUrl = URL.createObjectURL(file), img = new Image();
    try { img.src = objectUrl; await img.decode(); }
    catch { URL.revokeObjectURL(objectUrl); throw new Error('This image could not be opened. Try another photo.'); }
    const d = U.modal(`<form class="dialog-body photo-editor"><h2 id="photo-editor-title">Frame your photo</h2>
      <p class="muted" id="crop-help">Drag the circle to reposition. Drag a corner to resize.</p>
      <div class="photo-crop-stage"><div class="photo-crop-frame" tabindex="0" role="group" aria-label="Move photo crop" aria-describedby="crop-help crop-keyboard">
        ${['nw','ne','sw','se'].map(corner => `<button type="button" class="photo-crop-handle ${corner}" data-corner="${corner}" aria-label="Resize ${ {nw:'top left',ne:'top right',sw:'bottom left',se:'bottom right'}[corner] } corner"></button>`).join('')}
      </div></div>
      <div class="photo-crop-bottom"><canvas width="512" height="512" aria-label="Profile photo preview"></canvas><div><strong>Your profile photo</strong><p class="muted">This is what friends will see.</p></div><button type="button" class="btn btn-outline" data-reset>Reset</button></div>
      <label>Crop size<input type="range" name="size" min="12" max="100" step="1" value="85"></label>
      <p class="photo-keyboard muted" id="crop-keyboard">Arrow keys move the crop; focus a corner and use arrow keys to resize.</p>
      <p class="photo-error" role="status"></p>
      <div class="dialog-actions"><button type="button" class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save photo</button></div></form>`);
    d.setAttribute('aria-labelledby', 'photo-editor-title');
    const form = d.querySelector('form'), canvas = d.querySelector('canvas'), ctx = canvas.getContext('2d');
    const stage = d.querySelector('.photo-crop-stage'), frame = d.querySelector('.photo-crop-frame');
    const sizeInput = form.elements.size;
    const width = img.naturalWidth, height = img.naturalHeight, shortest = Math.min(width, height);
    img.alt = 'Original photo'; img.draggable = false;
    stage.prepend(img);
    stage.style.aspectRatio = `${width} / ${height}`;
    stage.style.width = `min(100%, ${340 * width / height}px)`;
    let busy = false, drag = null, crop;
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    function draw() {
      crop.size = clamp(crop.size, shortest * .12, shortest);
      crop.x = clamp(crop.x, 0, width - crop.size); crop.y = clamp(crop.y, 0, height - crop.size);
      Object.assign(frame.style, { left: `${crop.x/width*100}%`, top: `${crop.y/height*100}%`, width: `${crop.size/width*100}%`, height: `${crop.size/height*100}%` });
      sizeInput.value = Math.round(crop.size / shortest * 100);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, 512, 512);
    }
    function reset() { crop = { size: shortest * .85, x: (width-shortest*.85)/2, y: (height-shortest*.85)/2 }; draw(); }
    function resizeCentered(size) { crop.x += (crop.size-size)/2; crop.y += (crop.size-size)/2; crop.size = size; draw(); }
    sizeInput.oninput = () => { if (!busy) resizeCentered(shortest * Number(sizeInput.value)/100); };
    d.querySelector('[data-reset]').onclick = () => { if (!busy) reset(); };
    frame.onpointerdown = e => {
      if (busy || (e.pointerType === 'mouse' && e.button !== 0) || drag) return;
      e.preventDefault();
      const handle = e.target.closest('[data-corner]');
      (handle || frame).focus();
      drag = { id: e.pointerId, px: e.clientX, py: e.clientY, crop: {...crop}, corner: handle?.dataset.corner };
      frame.setPointerCapture(e.pointerId);
    };
    frame.onpointermove = e => {
      if (!drag || drag.id !== e.pointerId || busy) return;
      const bounds = stage.getBoundingClientRect(), base = drag.crop;
      const dx = (e.clientX-drag.px) * width/bounds.width, dy = (e.clientY-drag.py) * height/bounds.height;
      if (!drag.corner) crop = {...base, x:base.x+dx, y:base.y+dy};
      else {
        const west = drag.corner.includes('w'), north = drag.corner.includes('n');
        const ax = base.x + (west ? base.size : 0), ay = base.y + (north ? base.size : 0);
        const delta = ((west ? -dx : dx) + (north ? -dy : dy))/2;
        const size = clamp(base.size+delta, shortest*.12, Math.min(west ? ax : width-ax, north ? ay : height-ay));
        crop = {size, x:west ? ax-size : ax, y:north ? ay-size : ay};
      }
      draw();
    };
    frame.onpointerup = frame.onpointercancel = frame.onlostpointercapture = () => { drag = null; };
    frame.onkeydown = e => {
      if (busy || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const step = shortest * (e.shiftKey ? .05 : .01);
      if (e.target.closest('[data-corner]')) resizeCentered(crop.size + (['ArrowRight','ArrowDown'].includes(e.key) ? step : -step));
      else { if (e.key==='ArrowLeft') crop.x-=step; if (e.key==='ArrowRight') crop.x+=step; if (e.key==='ArrowUp') crop.y-=step; if (e.key==='ArrowDown') crop.y+=step; draw(); }
    };
    d.addEventListener('close', () => URL.revokeObjectURL(objectUrl));
    reset();
    d.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
    d.addEventListener('click', e => { if (busy && (e.target === d || e.target.closest('[data-close]'))) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    form.onsubmit = async e => {
      e.preventDefault(); if (busy) return;
      busy = true;
      form.querySelectorAll('button,input').forEach(el => el.disabled = true);
      const submit = form.querySelector('[type=submit]'); submit.textContent = 'Saving…';
      const error = d.querySelector('.photo-error'); error.textContent = '';
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .88));
        if (!blob) throw new Error('Could not prepare your photo. Try a different image.');
        await save(blob); d.close(); done(); U.toast('Profile photo updated');
      } catch (e) { error.textContent = e.message; }
      finally { busy = false; form.querySelectorAll('button,input').forEach(el => el.disabled = false); submit.textContent = 'Save photo'; }
    };
  }
  window.CoursewisePhotos = { loadMe, markup, syncHeader, enrichPeople, edit, remove, get hasPhoto() { return !!path; } };
})();
