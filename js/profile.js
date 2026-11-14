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
        <div class="cw-profile-streak-value">${current} ${current === 1 ? 'day' : 'days'}</div>
      </div>
      <div class="cw-profile-streak-stat cw-streak-best ${longest ? 'has-record' : ''}">
        <span class="cw-profile-streak-art" aria-hidden="true">${trophy}</span>
        <span class="cw-profile-streak-label">Personal best</span>
        <div class="cw-profile-streak-value">${longest} ${longest === 1 ? 'day' : 'days'}</div>
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
            <p class="muted">Checking your Canvas connection…</p></section>
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
            <div class="form"><div class="field"><label for="p-week">Week starts on</label><select id="p-week" data-dd>${U.options([["0", "Sunday"], ["1", "Monday"]], String(ws))}</select></div>
              <div class="switch-row"><div><label for="p-done">Show completed tasks</label><small>Show or hide completed tasks on Today, To-do, and Calendar.</small></div>
                <span class="switch"><input id="p-done" type="checkbox"${S.prefs.showDone ? " checked" : ""}><span></span></span></div>
              <div class="switch-row"><div><label for="p-24h">Military time (24-hour)</label><small>Show times like 15:30 instead of 3:30 PM.</small></div>
                <span class="switch"><input id="p-24h" type="checkbox"${T.timeFormat() === "24" ? " checked" : ""}><span></span></span></div>
              <div class="switch-row"><div><label for="replay-intro">Getting started guide</label><small>Show the setup steps on Today again.</small></div>
                <button type="button" class="btn btn-outline" id="replay-intro">Show on Today</button></div></div></section>
          <section class="card" id="notification-settings"><div class="section-head"><h2>Task notifications</h2></div>
            <p class="muted">Enable browser notifications on this device to receive reminders for tasks with due dates. You can set a different reminder for each task.</p>
            <p id="push-status" class="muted" role="status" aria-live="polite">Checking this device…</p>
            <button type="button" class="btn btn-primary" id="push-toggle">Enable notifications</button>
            <details class="cw-notification-help"><summary>Setup help for your device</summary>
              <div class="cw-notification-platforms">
                <section><h3>Windows</h3><p>Allow Coursewise in your browser’s site notification settings. If notifications still do not appear, open <strong>Settings → System → Notifications</strong> and allow notifications for your browser.</p></section>
                <section><h3>macOS</h3><p>Allow Coursewise in your browser’s website notification settings. In macOS, open <strong>System Settings → Notifications</strong> and allow notifications for the browser you use.</p></section>
                <section><h3>iPhone or iPad</h3><p>In Safari, use <strong>Share → Add to Home Screen</strong>, then open Coursewise from its Home Screen icon. Tap Enable notifications and allow the prompt. Manage it later in <strong>Settings → Notifications → Coursewise</strong>.</p></section>
                <section><h3>Android</h3><p>Tap Enable notifications and allow the browser prompt. If needed, allow notifications for the browser in Android’s app notification settings and check the browser’s site settings for Coursewise.</p></section>
              </div>
            </details></section>
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
    const usernameInput = $("a-user");
    const usernameSpaceError = "Spaces are not allowed in the username.";
    const validateUsername = () => {
      const hasWhitespace = /\s/.test(usernameInput.value);
      usernameInput.setCustomValidity(hasWhitespace ? usernameSpaceError : "");
      return !hasWhitespace;
    };
    usernameInput.addEventListener("input", validateUsername);
    usernameInput.addEventListener("invalid", () => {
      if (!validateUsername()) U.toast(usernameSpaceError);
    });
    validateUsername();
    $("account").onsubmit = e => { e.preventDefault(); U.run(async () => {
      e.preventDefault();
      if (!validateUsername()) { U.toast(usernameSpaceError); return; }
      await T.updateUser({ first: $("a-first").value.trim(), last: $("a-last").value.trim(), email: $("a-email").value.trim(), username: $("a-user").value.trim() });
      window.CoursewisePhotos.syncHeader();
      U.toast("Account saved"); render();
    }, e.submitter); };
    root.querySelectorAll("[name=theme]").forEach(r => r.onchange = () => U.run(async () => { try { await T.setPrefs({ theme: r.value }); U.toast("Theme updated"); } finally { render(); } }, r));
    $("p-week").onchange = e => U.run(async () => { try { await T.setPrefs({ weekStart: Number(e.target.value) }); U.toast("Preference saved"); } finally { render(); } }, e.currentTarget);
    $("replay-intro").onclick = e => U.run(async () => { await T.setIntroDone(false); location.href = "home.html"; }, e.currentTarget);
    const pushStatus = $("push-status"), pushToggle = $("push-toggle");
    const updatePushStatus = async () => {
      const push = window.CoursewiseNotifications;
      if (!push) { pushStatus.textContent = "Notification setup is unavailable. Reload the page and try again."; pushToggle.disabled = true; return; }
      const current = await push.status();
      if (!pushToggle.isConnected) return;
      pushToggle.disabled = !current.supported;
      pushToggle.textContent = current.enabled ? "Turn off on this device" : "Enable notifications";
      pushStatus.textContent = !current.supported
        ? "This browser does not support web push notifications."
        : current.enabled ? "Notifications are enabled on this device." : current.permission === "denied"
          ? "Notifications are blocked. Allow them in browser and device settings, then try again."
          : current.needsSync ? "This browser has a notification subscription that Coursewise could not verify. Enable again to reconnect this device."
          : "Notifications are not enabled on this device.";
      document.dispatchEvent(new CustomEvent("coursewise:notifications", { detail: current }));
    };
    void updatePushStatus();
    pushToggle.onclick = e => U.run(async () => {
      const current = await window.CoursewiseNotifications.status();
      if (current.enabled) {
        await window.CoursewiseNotifications.disable();
        U.toast("Notifications turned off on this device");
      } else {
        await window.CoursewiseNotifications.enable();
        U.toast("Notifications enabled on this device");
      }
      await updatePushStatus();
    }, e.currentTarget);
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
    const passwordInputs = [$("pw1"), $("pw2")];
    const passwordSpaceError = "Spaces are not allowed in the password.";
    const validatePassword = input => {
      const hasWhitespace = /\s/.test(input.value);
      input.setCustomValidity(hasWhitespace ? passwordSpaceError : "");
      return !hasWhitespace;
    };
    passwordInputs.forEach(input => {
      input.addEventListener("input", () => validatePassword(input));
      input.addEventListener("invalid", () => {
        if (!validatePassword(input)) U.toast(passwordSpaceError);
      });
    });
    $("password").onsubmit = e => { e.preventDefault(); U.run(async () => {
      e.preventDefault();
      if (passwordInputs.some(input => !validatePassword(input))) { U.toast(passwordSpaceError); return; }
      if ($("pw1").value !== $("pw2").value) { U.toast("Passwords don't match"); return; }
      await T.changePassword($("pw1").value); e.target.reset(); U.toast("Password updated");
    }, e.submitter); };
  }
  U.page({ render }).then(() => {
    if (location.hash === "#categories") document.getElementById("categories")?.scrollIntoView();
    if (location.hash === "#notification-settings") document.getElementById("notification-settings")?.scrollIntoView();
  });
})();
