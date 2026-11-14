/* Getting-started guide: setup steps on Today that check themselves off as you do them. */
(() => {
  const T = window.Tidy;
  let ctx = { canvas: null, notifications: null, onAddTask: () => {} };
  let finishing = false;          // All steps resolved this session: keep the "all set" card until it's closed.
  let seen = null;
  let entered = false;            // Only the first appearance animates; re-renders draw it in place.                // Steps already shown as done, so only newly finished ones animate.
  const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  function steps() {
    const skips = T.introSkips();
    const f = window.CoursewiseFriends?.summary?.();
    return [
      { id: "canvas", title: "Connect Canvas", done: ctx.canvas === true, skippable: true,
        text: "Your assignments and due dates come in on their own. Takes about a minute.",
        action: cls => `<a class="btn ${cls}" href="profile.html?canvasGuide=1#canvas">Connect Canvas</a>` },
      { id: "task", title: "Add your first task", done: T.state.tasks.length > 0,
        text: "Anything with a due date works: a reading, a quiz, a shift at work.",
        action: cls => `<button type="button" class="btn ${cls}" data-intro-add>Add task</button>` },
      { id: "friend", title: "Add a friend", done: !!f && f.friends + f.pending > 0, skippable: true,
        text: "Friends see your streak and can cheer you on. Your tasks stay private.",
        action: cls => `<button type="button" class="btn ${cls}" data-friends-open="add">Add friend</button>` },
      { id: "notifications", title: "Enable task notifications", done: ctx.notifications === true, skippable: true,
        text: "Set up reminders for tasks with due dates on each device you use.",
        extra: `<details class="cw-intro-notification-help"><summary>Platform setup</summary><p><strong>Windows/macOS:</strong> allow browser notifications in both browser and system settings. <strong>iPhone/iPad:</strong> in Safari, choose Share → Add to Home Screen, open the new icon, then enable notifications. <strong>Android:</strong> allow browser notifications in the prompt and Android settings.</p></details>`,
        action: cls => `<a class="btn ${cls}" href="profile.html#notification-settings">Set up notifications</a>` }
    ].map(s => ({ ...s, skipped: !s.done && skips.includes(s.id) }));
  }

  const visible = () => !T.state.introDone || finishing;

  function html() {
    if (!visible()) return "";
    const list = steps();
    const resolved = list.filter(s => s.done || s.skipped).length;
    if (resolved === list.length && !finishing) { finishing = true; void T.setIntroDone(true); }
    const fresh = new Set(seen ? list.filter(s => s.done && !seen.has(s.id)).map(s => s.id) : []);
    seen = new Set(list.filter(s => s.done).map(s => s.id));
    const next = list.find(s => !s.done && !s.skipped);
    const enter = entered ? "" : " is-entering"; entered = true;

    if (finishing) {
      return `<section class="card cw-intro is-finished${enter}" aria-labelledby="cw-intro-title">
        <div class="cw-intro-head"><div><h2 id="cw-intro-title">You’re all set</h2>
          <p>Everything you add shows up here on Today. You can bring this guide back anytime from Profile.</p></div>
          <button type="button" class="btn btn-primary" data-intro-close>Close guide</button></div></section>`;
    }

    const rows = list.map((s, i) => {
      const state = s.done ? "is-done" : s.skipped ? "is-skipped" : s === next ? "is-next" : "";
      const marker = s.done ? CHECK : s.skipped ? "–" : String(i + 1);
      const status = s.done ? '<span class="sr-only">Done: </span>' : s.skipped ? '<span class="sr-only">Skipped: </span>' : "";
      const body = s.done ? "" : s.skipped
        ? `<span class="cw-intro-text">Skipped. <button type="button" class="cw-intro-undo" data-intro-unskip="${s.id}">Undo</button></span>`
        : `<span class="cw-intro-text">${s.text}</span>${s.extra || ""}`;
      const actions = s.done || s.skipped ? "" : `<div class="cw-intro-actions">${s.action(s === next ? "btn-primary" : "btn-outline")}
          ${s.skippable ? `<button type="button" class="cw-intro-skip" data-intro-skip="${s.id}">Skip</button>` : '<span class="cw-intro-skip is-spacer" aria-hidden="true">Skip</span>'}</div>`;
      return `<li class="cw-intro-step ${state}${fresh.has(s.id) ? " just-done" : ""}">
          <span class="cw-intro-mark" aria-hidden="true">${marker}</span>
          <div class="cw-intro-copy"><strong>${status}${s.title}</strong>${body}</div>${actions}</li>`;
    }).join("");

    return `<section class="card cw-intro${enter}" aria-labelledby="cw-intro-title">
      <div class="cw-intro-head"><div><h2 id="cw-intro-title">Get Coursewise ready</h2>
        <p>A few quick things and your semester is in one place.</p></div>
        <span class="cw-intro-count" aria-label="${resolved} of ${list.length} steps finished">${resolved} of ${list.length}</span>
        <button type="button" class="icon-btn cw-intro-x" data-intro-close aria-label="Hide this guide">×</button></div>
      <div class="cw-intro-bar" aria-hidden="true"><i style="--p:${(resolved / list.length).toFixed(3)}"></i></div>
      <ol class="cw-intro-steps">${rows}</ol></section>`;
  }

  async function close(card) {
    const wasFinished = finishing;
    finishing = false;
    await T.setIntroDone(true);
    ctx.onClose?.(steps());
    const done = () => { card.closest("#cw-intro-slot")?.replaceChildren(); ctx.rerender?.(); };
    if (calm()) done();
    else { card.classList.add("is-leaving"); setTimeout(done, 280); }
    if (!wasFinished) Tidy.ui.toast("Guide hidden. Bring it back anytime from Profile.");
  }

  function bind(slot) {
    if (!slot) return;
    slot.onclick = e => {
      const t = e.target;
      if (t.closest("[data-intro-add]")) return ctx.onAddTask();
      if (t.closest("[data-intro-close]")) return void close(t.closest(".cw-intro"));
      const skip = t.closest("[data-intro-skip]"), unskip = t.closest("[data-intro-unskip]");
      if (skip || unskip) {
        T.setIntroSkip((skip || unskip).dataset[skip ? "introSkip" : "introUnskip"], !!skip);
        refresh();
        slot.querySelector(".cw-intro-step.is-next .btn, [data-intro-close]")?.focus();
      }
    };
  }

  function refresh() {
    const slot = document.getElementById("cw-intro-slot");
    if (!slot) return;
    slot.innerHTML = html();
  }

  document.addEventListener("coursewise:friends", () => { if (visible()) refresh(); });
  document.addEventListener("coursewise:notifications", e => {
    ctx.notifications = e.detail?.enabled === true;
    if (visible()) refresh();
  });

  window.CoursewiseIntro = {
    visible,
    // Call with the latest page context, insert the returned markup in #cw-intro-slot, then call bind().
    html(next) { ctx = { ...ctx, ...next }; return `<div id="cw-intro-slot">${html()}</div>`; },
    bind: () => bind(document.getElementById("cw-intro-slot"))
  };
})();
