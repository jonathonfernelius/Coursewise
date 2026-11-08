/* Profile page: account, preferences, categories, Canvas */
(() => {
  const T = Tidy, U = T.ui, root = document.getElementById("main"), esc = T.esc;

  function deleteAccountDialog() {
    const d=U.modal(`<form class="dialog-body" aria-labelledby="delete-title">
      <h2 id="delete-title">Delete your account?</h2>
      <p class="muted">Your account, tasks, lists, categories, preferences and Canvas connection will be permanently deleted. This cannot be undone.</p>
      <div class="field"><label for="delete-confirm">Type DELETE to confirm</label><input id="delete-confirm" autocomplete="off" spellcheck="false" required></div>
      <p role="status" class="auth-status error"></p>
      <div class="dialog-actions"><button type="button" class="btn btn-outline" data-close>Keep account</button><button type="submit" class="btn btn-danger" disabled>Delete account</button></div>
    </form>`);
    const form=d.querySelector('form'), input=d.querySelector('input'), button=d.querySelector('[type=submit]'), status=d.querySelector('[role=status]');
    let busy=false;
    input.oninput=()=>{button.disabled=busy || input.value!=='DELETE';};
    d.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
    d.addEventListener('click',e=>{if(busy){e.stopImmediatePropagation();e.preventDefault();}},true);
    form.onsubmit=async e=>{
      e.preventDefault(); if(busy || input.value!=='DELETE')return;
      busy=true; button.disabled=true; input.disabled=true; status.textContent=''; button.textContent='Deleting…';
      try {
        const {data,error}=await window.tidyClient.functions.invoke('delete-account',{body:{confirmation:input.value}});
        if(error || !data?.deleted) throw new Error('Could not delete your account. Please try again. If this feature was just added, check that its Supabase setup is complete.');
        await window.tidyClient.auth.signOut({scope:'local'}).catch(()=>{});
        location.replace('index.html');
      } catch(error) {
        status.textContent=error.message; busy=false; input.disabled=false; button.disabled=input.value!=='DELETE'; button.textContent='Delete account';
      }
    };
  }

  let photoOpen = false; // stays enlarged while the page re-renders after other changes
  function render() {
    const S = T.state, u = S.user, ws = S.prefs.weekStart;
    if (!window.CoursewisePhotos.hasPhoto) photoOpen = false;
    const streak = S.streak;
    const flame = `<svg class="cw-streak-flame" viewBox="0 0 24 28" aria-hidden="true"><path class="cw-streak-flame-outer" d="M12 1c1.2 4.6 7.5 7.4 7.5 14.2A7.5 7.5 0 0 1 12 27a7.5 7.5 0 0 1-7.5-11.8c0 2.3 1.4 3.9 3 4.3C6.8 14 9 5.5 12 1z"/><path class="cw-streak-flame-inner" d="M12 12c.7 2.6 3.7 4 3.7 7.3a3.7 3.7 0 0 1-7.4 0c0-1.7.9-2.7 1.7-3.2.2 1 .8 1.6 1.4 1.7C11 16.3 11.4 14 12 12z"/></svg>`;
    const trophy = `<svg class="cw-streak-trophy" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 6h12v7a6 6 0 0 1-12 0V6Z"/><path d="M10 9H6v3a5 5 0 0 0 5 5m11-8h4v3a5 5 0 0 1-5 5M16 19v6m-5 2h10m-8-2h6"/><path class="cw-trophy-glint" d="M16 9v5m-2.5-2.5h5"/></svg>`;
    const current = Math.max(0, Number(streak?.current) || 0);
    const longest = Math.max(0, Number(streak?.longest) || 0);
    const streakMarkup = streak ? `<div class="cw-profile-streak-grid">
      <div class="cw-profile-streak-stat cw-streak-current ${current ? 'is-active' : 'is-idle'}">
        <span class="cw-profile-streak-art" aria-hidden="true">${flame}</span>
        <span class="cw-profile-streak-label">Current streak</span>
        <div class="cw-profile-streak-value"><strong>${current}</strong><span>${current === 1 ? 'day' : 'days'}</span></div>
      </div>
      <div class="cw-profile-streak-stat cw-streak-best ${longest ? 'has-record' : ''}">
        <span class="cw-profile-streak-art" aria-hidden="true">${trophy}</span>
        <span class="cw-profile-streak-label">Personal best</span>
        <div class="cw-profile-streak-value"><strong>${longest}</strong><span>${longest === 1 ? 'day' : 'days'}</span></div>
      </div>
    </div>`
      : `<p class="muted cw-profile-streak-loading">Your streaks couldn’t load right now. Try refreshing in a moment.</p>`;
    root.innerHTML = `<div class="container">
      <div class="page-head"><div><h1>Profile</h1><p>Your account, preferences, categories and Canvas connection.</p></div>
        <div class="head-actions"><button class="btn btn-outline" id="logout">Log out</button></div></div>
      <div class="two-col">
        <div class="col">
          <section class="card profile-card">${(() => {
              const face = window.CoursewisePhotos.markup((u.first[0] || "") + (u.last[0] || ""));
              return window.CoursewisePhotos.hasPhoto
                ? `<button type="button" class="profile-avatar-btn${photoOpen ? " is-open" : ""}" id="profile-photo-zoom" aria-expanded="${photoOpen}" aria-label="${photoOpen ? "Shrink" : "Enlarge"} your photo"><span class="avatar">${face}</span></button>`
                : `<div class="avatar">${face}</div>`;
            })()}
            <h2>${esc(u.first)} ${esc(u.last)}</h2><p class="muted">${esc(u.email)}</p>
            <div class="photo-actions"><button type="button" class="btn btn-secondary" id="change-photo">${window.CoursewisePhotos.hasPhoto ? 'Change photo' : 'Add photo'}</button>
              ${window.CoursewisePhotos.hasPhoto ? '<button type="button" class="btn btn-outline" id="remove-photo">Remove photo</button>' : ''}</div>
            <input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
            <p class="photo-help">JPG, PNG, or WebP · Up to 10 MB</p></section>
          <section class="card" id="canvas"><div class="section-head"><h2>Canvas</h2></div>
            <p class="muted">Not connected. Canvas assignment import is coming later.</p></section>
          <section class="card cw-profile-streak-card" aria-label="Your streaks">
            <div class="section-head"><h2>Your streaks</h2><details class="cw-streak-info"><summary aria-label="About streaks"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v2"/></svg></summary><div class="cw-streak-info-copy">Complete a task on consecutive days to build a streak. Days follow Mountain Time. Personal best keeps your highest recorded streak, even after you delete completed tasks. Current streak uses your remaining completion history.</div></details></div>
            ${streakMarkup}
          </section>

        </div>
        <div class="col">
          <section class="card"><div class="section-head"><h2>Account</h2></div>
            <form class="form" id="account">
              <div class="grid-2"><div class="field"><label for="a-first">First name</label><input id="a-first" required value="${esc(u.first)}"></div>
                <div class="field"><label for="a-last">Last name</label><input id="a-last" required value="${esc(u.last)}"></div></div>
              <div class="field"><label for="a-email">Email</label><input id="a-email" type="email" readonly aria-describedby="email-hint" value="${esc(u.email)}"><small id="email-hint">Your sign-in email.</small></div>
              <div class="field"><label for="a-user">Username</label><input id="a-user" required value="${esc(u.username)}"></div>
              <button class="btn btn-primary">Save account</button></form></section>
          <section class="card"><div class="section-head"><h2>Appearance</h2></div>
            <div class="appearance-options appearance-field" role="radiogroup" aria-label="Display mode">
              ${[['light', 'Light mode', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>'], ['dark', 'Dark mode', '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>']].map(([value, label, icon]) => `<label class="appearance-option">
                <input type="radio" name="appearance" value="${value}" data-appearance-option${window.CoursewiseAppearance.get() === value ? ' checked' : ''}>
                <span class="appearance-option-face"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><span>${label}</span></span>
              </label>`).join('')}
            </div><h3 class="appearance-accent-label">Accent color</h3>
            <div class="theme-grid" role="radiogroup" aria-label="Color theme">${T.themes.map(([id, name]) => `<label class="theme-opt th-${id}"><input type="radio" name="theme" value="${id}"${S.prefs.theme === id ? " checked" : ""}><i></i>${name}</label>`).join("")}</div></section>
          <section class="card"><div class="section-head"><h2>Preferences</h2></div>
            <div class="form"><div class="field"><label for="p-week">Week starts on</label><select id="p-week">${U.options([["0", "Sunday"], ["1", "Monday"]], String(ws))}</select></div>
              <div class="switch-row"><div><label for="p-done">Show completed tasks</label><small>Show or hide completed tasks on Today, To-do, and Calendar.</small></div>
                <span class="switch"><input id="p-done" type="checkbox"${S.prefs.showDone ? " checked" : ""}><span></span></span></div>
              <div class="switch-row"><div><label for="p-24h">Military time (24-hour)</label><small>Show times like 15:30 instead of 3:30 PM.</small></div>
                <span class="switch"><input id="p-24h" type="checkbox"${T.timeFormat() === "24" ? " checked" : ""}><span></span></span></div></div></section>
          <section class="card" id="categories"><div class="section-head"><h2>Categories</h2><span class="count">${S.categories.length}</span></div>
            <div class="cat-list">${S.categories.map(c => `<div class="cat-row t-${c.tone}"><span class="dot"></span><strong>${esc(c.name)}</strong>
              <small>${S.tasks.filter(t => t.categoryId === c.id).length} tasks</small>
              <button class="icon-btn" data-cat="${c.id}" aria-label="Edit ${esc(c.name)}">${U.icons.pencil}</button></div>`).join("") || '<p class="empty">No categories yet.</p>'}</div>
            <button class="btn btn-outline" id="add-cat">${U.icons.plus} Add category</button></section>
          <section class="card"><div class="section-head"><h2>Password</h2></div>
            <form class="form" id="password"><div class="grid-2"><div class="field"><label for="pw1">New password</label><input id="pw1" type="password" minlength="8" required autocomplete="new-password"></div>
              <div class="field"><label for="pw2">Repeat password</label><input id="pw2" type="password" minlength="8" required autocomplete="new-password"></div></div>
              <button class="btn btn-secondary">Update password</button></form></section>

          <section class="card delete-account-card"><div class="section-head"><h2>Delete account</h2></div>
            <p class="muted">Permanently remove your account and all your Coursewise data.</p>
            <button type="button" class="btn btn-danger" id="delete-account">Delete account</button></section>
        </div></div></div>`;

    const $ = id => document.getElementById(id);
    $("change-photo").onclick = () => $("photo-file").click();
    $("photo-file").onchange = e => {
      const file = e.target.files[0]; e.target.value = '';
      if (file) U.run(() => window.CoursewisePhotos.edit(file, render), $("change-photo"));
    };
    if ($("remove-photo")) $("remove-photo").onclick = () => {
      const d = U.modal(`<div class="dialog-body"><h2>Remove profile photo?</h2><p class="muted">Your initials will appear instead.</p><div class="dialog-actions"><button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="confirm-remove-photo">Remove photo</button></div></div>`);
      d.querySelector('#confirm-remove-photo').onclick = e => U.run(async () => {
        await window.CoursewisePhotos.remove(); d.close(); render(); U.toast('Profile photo removed');
      }, e.currentTarget);
    };
    $("delete-account").onclick=deleteAccountDialog;
    $("logout").onclick = e => U.run(async () => { await T.logout(); location.href = "index.html"; }, e.currentTarget);
    $("account").onsubmit = e => { e.preventDefault(); U.run(async () => {
      e.preventDefault();
      await T.updateUser({ first: $("a-first").value.trim(), last: $("a-last").value.trim(), email: $("a-email").value.trim(), username: $("a-user").value.trim() });
      window.CoursewisePhotos.syncHeader();
      U.toast("Account saved"); render();
    }, e.submitter); };
    root.querySelectorAll("[name=theme]").forEach(r => r.onchange = () => U.run(async () => { try { await T.setPrefs({ theme: r.value }); U.toast("Theme updated"); } finally { render(); } }, r));
    $("p-week").onchange = e => U.run(async () => { try { await T.setPrefs({ weekStart: Number(e.target.value) }); U.toast("Preference saved"); } finally { render(); } }, e.currentTarget);
    $("p-done").onchange = e => U.run(async () => { try { await T.setPrefs({ showDone: e.target.checked }); U.toast("Preference saved"); } finally { render(); } }, e.currentTarget);
    $("p-24h").onchange = e => U.run(async () => { try { await T.setPrefs({ timeFormat: e.target.checked ? "24" : "12" }); U.toast("Preference saved"); } finally { render(); } }, e.currentTarget);
    if ($("profile-photo-zoom")) $("profile-photo-zoom").onclick = e => {
      const button = e.currentTarget;
      photoOpen = !photoOpen;
      button.classList.toggle("is-open", photoOpen); // toggled in place so the size change animates
      button.setAttribute("aria-expanded", String(photoOpen));
      button.setAttribute("aria-label", `${photoOpen ? "Shrink" : "Enlarge"} your photo`);
    };
    $("add-cat").onclick = () => U.categoryDialog({ done: render });
    root.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => U.categoryDialog({ cat: S.categories.find(c => c.id === b.dataset.cat), done: render }));
    $("password").onsubmit = e => { e.preventDefault(); U.run(async () => {
      e.preventDefault();
      if ($("pw1").value !== $("pw2").value) { U.toast("Passwords don't match"); return; }
      await T.changePassword($("pw1").value); e.target.reset(); U.toast("Password updated");
    }, e.submitter); };
  }
  U.page({ render }).then(() => {
    if (location.hash === "#categories") document.getElementById("categories")?.scrollIntoView();
  });
})();
