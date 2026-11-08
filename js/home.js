/* Today page — the daily stack */
(() => {
  const T = Tidy, U = T.ui, root = document.getElementById("main");
  const rows = (list, empty, o) => list.length ? list.map(t => U.taskRow(t, o)).join("") : `<p class="empty">${empty}</p>`;

  const SNAPSHOT_BANK = [
    ["You're all caught up. Enjoy the breathing room.", "Nothing left on your list. Nice work!", "You're done for today. Go enjoy yourself.", "Your to-do list is officially off duty."],
    ["Start with one small win.", "You're so close. Finish strong!", "Just a little more to go.", "The finish line is in sight."],
    ["One thing at a time. You've got this.", "A little progress adds up.", "Pick one and get started.", "You've got a plan. Now make it happen."],
    ["Deep breath. One task at a time.", "You don't have to do it all at once.", "Start somewhere. Momentum will follow.", "Big list, small steps. You've got this."]
  ];
  function snapshotMessage(remaining, day) {
    const tier = remaining === 0 ? 0 : remaining <= 2 ? 1 : remaining <= 5 ? 2 : 3;
    const storageKey = `coursewise-snapshot:${day}:${tier}`;
    let index;
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (localStorage.getItem(storageKey) !== null && Number.isInteger(saved) && saved >= 0 && saved < SNAPSHOT_BANK[tier].length) index = saved;
      else { index = Math.floor(Math.random() * SNAPSHOT_BANK[tier].length); localStorage.setItem(storageKey, String(index)); }
    } catch { index = Math.floor(Math.random() * SNAPSHOT_BANK[tier].length); }
    return SNAPSHOT_BANK[tier][index];
  }

  const FLAME_SVG = `<svg class="flame" viewBox="0 0 24 28" aria-hidden="true"><path class="flame-outer" d="M12 1c1.2 4.6 7.5 7.4 7.5 14.2A7.5 7.5 0 0 1 12 27a7.5 7.5 0 0 1-7.5-11.8c0 2.3 1.4 3.9 3 4.3C6.8 14 9 5.5 12 1z"/><path class="flame-inner" d="M12 12c.7 2.6 3.7 4 3.7 7.3a3.7 3.7 0 0 1-7.4 0c0-1.7.9-2.7 1.7-3.2.2 1 .8 1.6 1.4 1.7C11 16.3 11.4 14 12 12z"/></svg>`;

  function streakHTML() {
    const s = T.state.streak;
    if (!s) return "";
    const best = s.longest > s.current ? `<span class="streak-best">Best: ${s.longest}</span>` : "";
    if (s.current > 0) {
      const state = s.doneToday ? "is-lit" : "is-risk";
      const hint = s.doneToday ? "" : `<span class="streak-hint">Finish a task today to keep it going</span>`;
      return `<div class="streak-bar ${state}" role="status">${FLAME_SVG}<strong>${s.current}-day streak</strong>${hint}<span class="streak-spacer"></span>${best}</div>`;
    }
    return `<div class="streak-bar is-idle" role="status">${FLAME_SVG}<strong>No streak yet</strong><span class="streak-hint">Finish a task today to start one</span><span class="streak-spacer"></span>${best}</div>`;
  }

  const WEEK_MODE_KEY = "coursewise-week-mode";
  let weekMode = (() => { try { return localStorage.getItem(WEEK_MODE_KEY) === "course" ? "course" : "day"; } catch { return "day"; } })();
  let canvasStatus = null, statusRequested = false, reminderAnimated = false;
  let midnightTimer = null, renderedDay = null;
  const DISMISS_KEY = "cw-canvas-reminder-dismissed", DISMISS_DAYS = 7;
  const dismissed = () => { try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_DAYS * 864e5; } catch { return false; } };
  const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function scheduleMidnightRefresh() {
    clearTimeout(midnightTimer);
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    midnightTimer = setTimeout(render, nextMidnight.getTime() - now.getTime() + 100);
  }
  // Only the first appearance animates; later re-renders (e.g. checking off a task) just draw it in place.
  function reminderHTML() {
    if (canvasStatus !== false || dismissed()) return "";
    const enter = !reminderAnimated; reminderAnimated = true;
    return `<div class="cw-reminder-wrap${enter ? " is-entering" : ""}"><div class="cw-reminder-inner"><aside class="cw-reminder" role="status">
        <span class="cw-reminder-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="m9 15 2 2 4-4"/></svg><i class="cw-spark a"></i><i class="cw-spark b"></i></span>
        <div class="cw-reminder-copy"><strong>Let Canvas fill your to-do list</strong><span>Connect once and your due dates show up here on their own. Takes about a minute.</span></div>
        <a class="btn btn-primary cw-reminder-cta" href="profile.html?canvasGuide=1#canvas">Connect Canvas <i aria-hidden="true">→</i></a>
        <button type="button" class="icon-btn cw-reminder-x" id="cw-reminder-x" aria-label="Hide this reminder for a week">×</button>
      </aside></div></div>`;
  }
  function render() {
    const now = new Date();
    const today = T.toKey(now), all = T.state.tasks;
    const lastWeekDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
    const weekEnd = T.toKey(lastWeekDay);
    renderedDay = today;
    scheduleMidnightRefresh();
    const dueToday = all.filter(t => t.due === today);
    const visibleToday = T.visibleTasks(dueToday);
    const open = dueToday.filter(t => !t.done), doneN = dueToday.length - open.length;
    const overdue = all.filter(t => !t.done && t.due && t.due < today);
    const week = T.visibleTasks(all.filter(t => t.due && t.due >= today && t.due <= weekEnd));
    const byTime = (x, y) => (x.time || "99:99").localeCompare(y.time || "99:99") || x.title.localeCompare(y.title);
    const weekDays = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const key = T.toKey(date);
      return {
        offset, key, tasks: week.filter(task => task.due === key).sort(byTime),
        short: offset === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" }),
        label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString(undefined, { weekday: "long" }),
        sub: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        full: date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
      };
    });
    const maxPerDay = Math.max(1, ...weekDays.map(d => d.tasks.length));
    const busiest = weekDays.reduce((best, d) => d.tasks.length > best.tasks.length ? d : best, weekDays[0]);
    const listName = task => T.state.lists.find(l => l.id === task.listId)?.title || "";
    const weekRow = (task, { showList, showDay }) => {
      const cat = T.cat(task.categoryId), day = weekDays.find(d => d.key === task.due);
      const meta = [showList ? listName(task) : "", cat?.name || ""].filter(Boolean).map(T.esc).join(" · ");
      const when = [showDay ? day?.short : "", task.time ? T.fmtTime(task.time) : ""].filter(Boolean).join(" · ");
      return `<li class="week-row${task.done ? " done" : ""}">
        <button type="button" class="check${task.done ? " on" : ""}" data-toggle="${T.esc(task.id)}" aria-label="${task.done ? "Mark incomplete" : "Mark complete"}: ${T.esc(task.title)}" aria-pressed="${task.done}">${task.done ? U.icons.check : ""}</button>
        <span class="week-dot${cat ? ` t-${cat.tone}` : ""}" aria-hidden="true"></span>
        <span class="week-row-main"><span class="week-row-title">${T.esc(task.title)}</span>${meta ? `<span class="week-row-meta">${meta}</span>` : ""}</span>
        ${when ? `<span class="week-row-when">${T.esc(when)}</span>` : ""}</li>`;
    };
    function weekAgenda() {
      if (!week.length) return `<p class="week-empty">Nothing due this week. Enjoy the breathing room.</p>`;
      if (weekMode === "course") {
        const groups = new Map();
        for (const task of week.slice().sort((x, y) => (x.due || "").localeCompare(y.due || "") || byTime(x, y))) {
          const name = listName(task) || "No list";
          if (!groups.has(name)) groups.set(name, []);
          groups.get(name).push(task);
        }
        const order = [...T.state.lists.map(l => l.title), "No list"];
        return [...groups].sort((x, y) => order.indexOf(x[0]) - order.indexOf(y[0])).map(([name, tasks]) =>
          `<section class="week-group" aria-label="${T.esc(name)}"><div class="week-group-label"><h3>${T.esc(name)}</h3><span>${tasks.length} due</span></div>
            <ul class="week-rows">${tasks.map(task => weekRow(task, { showDay: true })).join("")}</ul></section>`).join("");
      }
      const free = weekDays.filter(d => !d.tasks.length).map(d => d.short);
      return weekDays.filter(d => d.tasks.length).map(d =>
        `<section class="week-group${d.offset === 0 ? " is-today" : ""}" id="week-group-${d.offset}" aria-label="${T.esc(d.full)}"><div class="week-group-label"><h3>${T.esc(d.label)}</h3><span>${T.esc(d.sub)}</span></div>
          <ul class="week-rows">${d.tasks.map(task => weekRow(task, { showList: true })).join("")}</ul></section>`).join("")
        + (free.length ? `<p class="week-free">Free: ${T.esc(free.join(", "))}</p>` : "");
    }
    const weekChart = weekDays.map(d => {
      const n = d.tasks.length, label = `${d.full}: ${n} ${n === 1 ? "task" : "tasks"}`;
      const inner = `<span class="week-bar-n">${n || ""}</span><span class="week-bar-fill" style="--r:${(n / maxPerDay).toFixed(3)}"></span><span class="week-bar-label">${T.esc(d.short)}</span>`;
      return n ? `<button type="button" class="week-bar${d.offset === 0 ? " is-today" : ""}" data-week-day="${d.offset}" aria-label="${T.esc(label)}">${inner}</button>`
               : `<div class="week-bar is-empty${d.offset === 0 ? " is-today" : ""}" role="img" aria-label="${T.esc(label)}">${inner}</div>`;
    }).join("");
    const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    root.innerHTML = `<div class="container">
      <div class="page-head"><div><h1>Hi, ${T.esc(T.state.user.first)}</h1><p>${date}</p></div>
        <div class="head-actions"><button class="btn btn-primary" id="add">${U.icons.plus} Add task</button></div></div>
      ${reminderHTML()}
      <div class="stack">
        <section class="hero${T.state.streak ? ' has-streak' : ''}" aria-label="Daily snapshot"><small>Daily snapshot</small>
          <h2>${open.length ? `${open.length} ${open.length === 1 ? "thing" : "things"} left today.` : dueToday.length ? "Today is done." : "Your day is clear."}</h2>
          <p>${T.esc(snapshotMessage(open.length, today))}</p>
          ${streakHTML()}
          <div class="hero-stat"><strong>${T.state.completedToday ?? 0}</strong><span>completed today</span></div></section>
        <section class="card overdue-card"><div class="section-head"><h2>Overdue</h2><span class="count warn">${overdue.length}</span></div>
          <div class="task-list${overdue.length ? " has-tasks" : ""}">${rows(overdue, "You're all caught up.", { overdue: true })}</div></section>
        <section class="card week-card" aria-labelledby="week-heading"><div class="section-head"><h2 id="week-heading">This week</h2><span class="count" aria-label="${week.length} tasks due in the next seven days">${week.length}</span></div>
          <div class="week-top"><div class="week-stat"><strong>${week.length ? `${week.length} ${week.length === 1 ? "thing" : "things"} due` : "Nothing due"}</strong><span>${week.length ? `Busiest: ${T.esc(busiest.short)} (${busiest.tasks.length})` : "Your week is wide open."}</span></div>
            <div class="week-chart" aria-label="Tasks due each day this week">${weekChart}</div></div>
          ${week.length ? `<div class="week-seg" role="group" aria-label="Group this week by"><button type="button" data-week-mode="day" aria-pressed="${weekMode === "day"}">By day</button><button type="button" data-week-mode="course" aria-pressed="${weekMode === "course"}">By course</button></div>` : ""}
          <div id="week-body">${weekAgenda()}</div></section>
        <div class="cw-f-home-column"><section class="card today-card"><div class="section-head"><h2>Today</h2><span class="count">${visibleToday.length}</span></div>
          <div class="task-list${visibleToday.length ? " has-tasks" : ""}">${rows(visibleToday, "Nothing due today. Enjoy it.", { date: false })}</div></section>
        ${window.CoursewiseFriends?.card() || ""}</div>
      </div></div>`;
    if (!statusRequested) {
      statusRequested = true;
      window.tidyClient.functions.invoke("canvas-connect", { body: { action: "status" } }).then(({data, error}) => {
        if (!error && !data?.error && typeof data?.connected === "boolean") { canvasStatus = data.connected; render(); }
      }).catch(() => {});
    }
    const setWeekMode = mode => {
      weekMode = mode;
      try { localStorage.setItem(WEEK_MODE_KEY, mode); } catch {}
      document.getElementById("week-body").innerHTML = weekAgenda();
      root.querySelectorAll("[data-week-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.weekMode === mode)));
    };
    root.querySelectorAll("[data-week-mode]").forEach(b => b.onclick = () => setWeekMode(b.dataset.weekMode));
    root.querySelectorAll("[data-week-day]").forEach(b => b.onclick = () => {
      if (weekMode !== "day") setWeekMode("day");
      const group = document.getElementById(`week-group-${b.dataset.weekDay}`);
      if (!group) return;
      group.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "nearest" });
      group.classList.add("is-pulse");
      setTimeout(() => group.classList.remove("is-pulse"), 1200);
    });
    const x = document.getElementById("cw-reminder-x");
    if (x) x.onclick = () => {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
      const wrap = x.closest(".cw-reminder-wrap");
      wrap.classList.remove("is-entering"); wrap.classList.add("is-leaving");
      setTimeout(() => wrap.remove(), calm() ? 20 : 480);
    };
    document.getElementById("add").onclick = () => U.taskDialog({ due: today, done: render });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && renderedDay !== T.toKey(new Date())) render();
  });
  U.page({ render });
})();
