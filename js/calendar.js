/* Calendar page */
(() => {
  const T = Tidy, U = T.ui, root = document.getElementById("main");
  const now = new Date(); let month = new Date(now.getFullYear(), now.getMonth(), 1);
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const tone = t => T.cat(t.categoryId)?.tone || "slate";
  const eventTimeLabel = event => event.time
    ? `${T.fmtTime(event.time)}${event.endTime ? ` – ${T.fmtTime(event.endTime)}` : ""}`
    : event.endTime ? `Until ${T.fmtTime(event.endTime)}` : "";

  /* Shared task table used by "Today's tasks" and "Other tasks" */
  function table(ts, { time, empty }) {
    const rows = ts.map(t => {
      const c = T.cat(t.categoryId), list = T.state.lists.find(l => l.id === t.listId);
      return `<tr class="${t.done ? "done" : ""}">
        <td class="col-check"><button class="check${t.done ? " on" : ""}" data-toggle="${t.id}" aria-label="${t.done ? "Mark incomplete" : "Mark complete"}">${t.done ? U.icons.check : ""}</button></td>
        <td class="cell-title">${T.esc(t.title)}${t.repeat ? ` <span class="time muted" title="${T.esc(T.repeatLabel(t.repeat))}">${U.icons.repeat}</span>` : ""}</td>
        <td>${c ? `<span class="chip t-${c.tone}">${T.esc(c.name)}</span>` : '<span class="muted">None</span>'}</td>
        <td class="muted">${time ? (t.time ? T.fmtTime(t.time) : "Anytime") : T.esc(list?.title || "")}</td>
        <td class="col-act"><button class="icon-btn" data-edit="${t.id}" aria-label="Edit task">${U.icons.pencil}</button></td></tr>`;
    }).join("");
    return `<div class="table-wrap"><table class="tasks"><thead><tr><th class="col-check"><span class="sr-only">Done</span></th><th>Task</th><th>Category</th><th>${time ? "Time" : "List"}</th><th class="col-act"><span class="sr-only">Edit</span></th></tr></thead><tbody>
      ${rows || `<tr><td colspan="5" class="muted" style="text-align:center;padding:1.5rem">${empty}</td></tr>`}</tbody></table></div>`;
  }

  function render() {
    const y = month.getFullYear(), m = month.getMonth(), S = T.state, ws = S.prefs.weekStart;
    const lead = (new Date(y, m, 1).getDay() - ws + 7) % 7, days = new Date(y, m + 1, 0).getDate(), prevDays = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = lead; i > 0; i--) cells.push({ n: prevDays - i + 1, out: true });
    for (let d = 1; d <= days; d++) cells.push({ n: d, key: T.toKey(new Date(y, m, d)) });
    for (let d = 1; cells.length % 7; d++) cells.push({ n: d, out: true });
    const visible = T.visibleTasks();
    const firstDay = T.toKey(new Date(y, m, 1)), lastDay = T.toKey(new Date(y, m + 1, 0));
    const calendarEvents = S.events.flatMap(event => T.eventOccurrences(event, firstDay, lastDay));
    const todayKey = T.toKey(now), undated = visible.filter(t => !t.due);
    const todays = visible.filter(t => t.due === todayKey).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    const upcomingEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
    const upcomingKey = T.toKey(upcomingEnd);
    const upcomingEvents = S.events.flatMap(event => T.eventOccurrences(event, todayKey, upcomingKey))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99") || a.title.localeCompare(b.title));
    const shownEvents = upcomingEvents.slice(0, 25);
    const upcomingRows = shownEvents.map(event => {
      const category = T.cat(event.categoryId);
      const eventDay = T.parseKey(event.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      return `<tr>
        <td class="calendar-event-indicator"><span class="calendar-event-marker t-${tone(event)}" aria-hidden="true"></span></td>
        <td class="cell-title">${T.esc(event.title)}${event.repeat ? ` <span class="time muted" title="${T.esc(T.repeatLabel(event.repeat))}">${U.icons.repeat}</span>` : ""}</td>
        <td>${category ? `<span class="chip t-${category.tone}">${T.esc(category.name)}</span>` : '<span class="muted">None</span>'}</td>
        <td class="muted">${T.esc(eventDay)}${eventTimeLabel(event) ? ` · ${eventTimeLabel(event)}` : " · Anytime"}</td>
        <td class="col-act"><button class="icon-btn" data-edit-upcoming-event="${T.esc(event.id)}" aria-label="Edit event ${T.esc(event.title)}">${U.icons.pencil}</button></td></tr>`;
    }).join("");
    const dow = [...DOW.slice(ws), ...DOW.slice(0, ws)];

    root.innerHTML = `<div class="container">
      <div class="page-head"><div><h1>Calendar</h1><p>Select a day to see its tasks and events.</p></div>
        <div class="head-actions"><button class="btn btn-primary" id="add">${U.icons.plus} Add task</button><button class="btn btn-primary" id="add-event">${U.icons.plus} Add event</button></div></div>
      <section class="card cal"><div class="cal-bar">
        <button class="icon-btn" id="prev" aria-label="Previous month">${U.icons.left}</button>
        <h2>${month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
        <button class="icon-btn" id="next" aria-label="Next month">${U.icons.right}</button></div>
        <div class="cal-grid">${dow.map(d => `<div class="cal-dow">${d}</div>`).join("")}
        ${cells.map(c => {
          if (c.out) return `<div class="day out">${c.n}</div>`;
          const ts = visible.filter(t => t.due === c.key), dayEvents = calendarEvents.filter(event => event.date === c.key);
          const items = [...ts.map(task => `<i class="t-${tone(task)}${task.done ? " done" : ""}"></i>`),
            ...dayEvents.map(event => `<i class="t-${tone(event)} calendar-event-dot"></i>`)];
          return `<button class="day${c.key === todayKey ? " today" : ""}" data-day="${c.key}" aria-label="${T.fmtDate(c.key)}, ${items.length} ${items.length === 1 ? "item" : "items"}">${c.n}
            <span class="dots">${items.slice(0, 4).join("")}${items.length > 4 ? `<em>+${items.length - 4}</em>` : ""}</span></button>`;
        }).join("")}</div>
        <div class="legend">${S.categories.map(c => `<span><i class="t-${c.tone}"></i>${T.esc(c.name)}</span>`).join("")}
          <span class="calendar-event-legend"><i></i>Event</span>
          <button id="manage">Manage categories</button></div></section>

      <section class="card table-card"><div class="section-head"><h2>Today's tasks</h2><span class="count">${todays.length}</span></div>
        ${table(todays, { time: true, empty: "Nothing due today." })}</section>

      <section class="card table-card"><div class="section-head"><h2>Other tasks</h2><span class="count">${undated.length}</span></div>
        ${table(undated, { time: false, empty: "Every task has a date." })}</section>

      <section class="card table-card upcoming-events-card">
        <div class="section-head"><h2>Upcoming events</h2><span class="count">${shownEvents.length}</span></div>
        <p class="muted upcoming-events-hint">Today and the next 6 days${upcomingEvents.length > shownEvents.length ? ` · Showing ${shownEvents.length} of ${upcomingEvents.length}` : ""}</p>
        <div class="upcoming-event-list"><table class="tasks"><thead><tr><th class="calendar-event-indicator"><span class="sr-only">Event</span></th><th>Event</th><th>Category</th><th>Date &amp; time</th><th class="col-act"><span class="sr-only">Edit</span></th></tr></thead>
          <tbody>${upcomingRows || '<tr><td colspan="5" class="muted" style="text-align:center;padding:1.5rem">No upcoming events.</td></tr>'}</tbody></table></div>
      </section></div>`;

    document.getElementById("prev").onclick = () => { month = new Date(y, m - 1, 1); render(); };
    document.getElementById("next").onclick = () => { month = new Date(y, m + 1, 1); render(); };
    document.getElementById("add").onclick = () => U.taskDialog({ done: render });
    document.getElementById("add-event").onclick = () => U.eventDialog({ done: render });
    document.getElementById("manage").onclick = () => U.manageCategories({ done: render });
    root.querySelectorAll("[data-edit-upcoming-event]").forEach(button => button.onclick = () => {
      const event = S.events.find(item => item.id === button.dataset.editUpcomingEvent);
      if (event) U.eventDialog({ event, done: render });
    });
    root.querySelectorAll("[data-day]").forEach(b => b.onclick = () => dayDialog(b.dataset.day));
  }

  function dayDialog(key) {
    const ts = T.visibleTasks().filter(t => t.due === key);
    const dayEvents = T.state.events.flatMap(event => T.eventOccurrences(event, key, key));
    const label = T.parseKey(key).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const eventRows = dayEvents.map(event => {
      const category = T.cat(event.categoryId);
      return `<article class="calendar-event"><span class="calendar-event-marker t-${tone(event)}" aria-hidden="true"></span>
        <div class="calendar-event-main"><strong>${T.esc(event.title)}</strong><div class="task-meta">
          ${eventTimeLabel(event) ? `<span class="time">${U.icons.clock}${T.esc(eventTimeLabel(event))}</span>` : ""}
          ${event.repeat ? `<span class="time">${U.icons.repeat}${T.esc(T.repeatLabel(event.repeat))}</span>` : ""}
          ${category ? `<span class="chip t-${category.tone}">${T.esc(category.name)}</span>` : ""}</div></div>
        <button class="icon-btn" data-edit-event="${T.esc(event.id)}" aria-label="Edit event ${T.esc(event.title)}">${U.icons.pencil}</button></article>`;
    }).join("");
    const d = U.modal(`<div class="dialog-body"><h2>${label}</h2><p class="muted">${ts.length} ${ts.length === 1 ? "task" : "tasks"} · ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}</p>
      ${ts.length ? `<h3>Tasks</h3><div class="task-list">${ts.map(t => U.taskRow(t, { date: false, edit: false })).join("")}</div>` : ""}
      ${dayEvents.length ? `<h3>Events</h3><div class="calendar-event-list">${eventRows}</div>` : ""}
      ${!ts.length && !dayEvents.length ? '<p class="empty">Nothing scheduled for this day.</p>' : ""}
      <div class="dialog-actions"><button class="btn btn-primary" id="add-day">${U.icons.plus} Add task</button><button class="btn btn-primary" id="add-event-day">${U.icons.plus} Add event</button><button class="btn btn-outline" data-close>Close</button></div></div>`);
    d.querySelector("#add-day").onclick = () => { d.close(); U.taskDialog({ due: key, done: render }); };
    d.querySelector("#add-event-day").onclick = () => { d.close(); U.eventDialog({ date: key, done: render }); };
    d.addEventListener("click", e => {
      const edit = e.target.closest("[data-edit-event]");
      if (edit) {
        const event = T.state.events.find(item => item.id === edit.dataset.editEvent);
        if (event) U.eventDialog({ event, done: () => { d.close(); render(); dayDialog(key); } });
        return;
      }
      const tg = e.target.closest("[data-toggle]"); if (!tg) return;
      e.stopPropagation(); U.run(async () => { await U.toggle(tg.dataset.toggle); d.close(); render(); dayDialog(key); }, tg);
    }, true);
  }
  U.page({ render });
})();
