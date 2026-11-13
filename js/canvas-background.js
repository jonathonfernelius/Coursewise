/*
 * Coursewise Canvas background mode (Profile page only)
 *
 * Each Coursewise page is its own HTML document, so leaving Profile used to stop
 * a Canvas preview, AI review or import halfway. While Canvas is working, links
 * to other pages now open in a full-screen layer on top of Profile instead.
 * Profile stays loaded underneath, so the work keeps going. A small card shows
 * progress and pops up when the work is done.
 *
 * Listens to events from canvas-integration.js:
 *   cw-canvas-working  { working }
 *   cw-canvas-activity { state, title, detail, completed, total }
 *   cw-canvas-done     { ok, action: "review" | "tasks", title, detail }
 */
(() => {
  "use strict";

  const PROFILE_PAGE = /\/profile\.html$/i;
  const SIGNED_OUT_PAGE = /\/(index|signup|reset-password)\.html$|\/$/i;
  const profileTitle = document.title;

  let working = false;
  let shell = null;      // full-screen layer holding the other page
  let frame = null;
  let dock = null;       // progress / done card
  let dockMode = null;   // "progress" | "done" | null
  let lastActivity = null;

  const style = document.createElement("style");
  style.textContent = `
    html.cw-bg-open,html.cw-bg-open body{overflow:hidden}
    .cw-bg-shell{position:fixed;inset:0;z-index:2147483000;background:var(--bg)}
    .cw-bg-shell iframe{display:block;width:100%;height:100%;border:0;background:var(--bg)}
    .cw-bg-dock{position:fixed;z-index:2147483001;right:1.25rem;bottom:1.5rem;display:flex;align-items:flex-start;gap:.85rem;width:min(23rem,calc(100vw - 2rem));padding:.9rem 1rem;border:1px solid var(--border);border-radius:1.25rem;background:var(--card);color:var(--fg);box-shadow:0 14px 36px rgb(0 0 0/.16);font-family:inherit;opacity:0;transform:translateY(.75rem);transition:opacity .3s,transform .3s cubic-bezier(.2,.9,.25,1)}
    .cw-bg-dock.show{opacity:1;transform:none}
    .cw-bg-dock[data-mode=done]{border-color:color-mix(in srgb,var(--primary) 40%,var(--border))}
    .cw-bg-icon{flex:none;display:grid;place-items:center;width:2.25rem;height:2.25rem;border-radius:.8rem;background:color-mix(in srgb,var(--primary) 12%,var(--card));color:var(--primary)}
    .cw-bg-icon svg{width:1.25rem;height:1.25rem}
    .cw-bg-dock[data-ok=false] .cw-bg-icon{background:color-mix(in srgb,#c2410c 12%,var(--card));color:#c2410c}
    .cw-bg-spin{width:1.05rem;height:1.05rem;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:cw-bg-spin .8s linear infinite}
    .cw-bg-copy{display:grid;gap:.2rem;min-width:0;flex:1}
    .cw-bg-copy strong{font-size:.93rem;font-weight:600;line-height:1.35}
    .cw-bg-copy>span{font-size:.8rem;line-height:1.45;color:var(--muted-fg);overflow-wrap:anywhere}
    .cw-bg-copy progress{width:100%;height:.4rem;margin-top:.35rem;accent-color:var(--primary)}
    .cw-bg-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.6rem}
    .cw-bg-actions .btn{font-size:.82rem;padding:.5rem .9rem;min-height:2.25rem}
    .cw-bg-link{justify-self:start;margin-top:.2rem;padding:0;border:0;background:none;color:var(--primary);font:inherit;font-size:.8rem;cursor:pointer}
    .cw-bg-link:hover{text-decoration:underline}
    .cw-bg-dock button:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
    @keyframes cw-bg-spin{to{transform:rotate(360deg)}}
    @media(max-width:720px){.cw-bg-dock{left:1rem;right:1rem;width:auto;bottom:calc(5.5rem + env(safe-area-inset-bottom,0px))}}
    @media(prefers-reduced-motion:reduce){.cw-bg-dock{transition:opacity .01s}.cw-bg-spin{animation-duration:2.4s}}
  `;
  document.head.appendChild(style);

  const ICON_DONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4m8-4v4M4 10h16m-11 4 2 2 4-4"/></svg>';
  const ICON_ALERT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></svg>';

  function el(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function button(label, className, onClick) {
    const b = el("button", className, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  /* ---------- Links: open other pages on top of Profile while Canvas works ---------- */

  function linkFrom(event) {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    const link = event.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download")) return null;
    if (link.target && link.target !== "_self") return null;
    return link;
  }

  document.addEventListener("click", event => {
    if (!working) return;
    const link = linkFrom(event);
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/\.html$/i.test(url.pathname)) return;
    if (url.pathname === location.pathname) return; // in-page links on Profile
    if (SIGNED_OUT_PAGE.test(url.pathname)) return;
    event.preventDefault();
    openShell(url.href);
  }, true);

  function openShell(href) {
    if (!shell) {
      shell = el("div", "cw-bg-shell");
      frame = document.createElement("iframe");
      frame.title = "Coursewise";
      frame.addEventListener("load", onFrameLoad);
      shell.appendChild(frame);
      document.body.appendChild(shell);
      document.documentElement.classList.add("cw-bg-open");
    }
    frame.src = href;
    refreshDock();
  }

  function closeShell(hash = "") {
    if (!shell) return;
    shell.remove();
    shell = frame = null;
    document.documentElement.classList.remove("cw-bg-open");
    document.title = profileTitle;
    const target = hash && hash !== "#canvas"
      ? document.getElementById(decodeURIComponent(hash.slice(1)))
      : document.getElementById("canvas");
    target?.scrollIntoView({ block: "start" });
    refreshDock();
  }

  function onFrameLoad() {
    let win, doc;
    try { win = frame?.contentWindow; doc = frame?.contentDocument; } catch { return; }
    if (!win || !doc) return;
    const path = win.location.pathname;

    // Profile itself is the page underneath; signed-out pages take over the whole tab.
    if (PROFILE_PAGE.test(path)) { closeShell(win.location.hash); return; }
    if (SIGNED_OUT_PAGE.test(path)) { location.href = win.location.href; return; }

    document.title = doc.title || profileTitle;

    // The page's own "Canvas update" banner would repeat what this card says.
    const quiet = doc.createElement("style");
    quiet.textContent = "#cw-auto-canvas-notice{display:none!important}";
    doc.head?.appendChild(quiet);

    doc.addEventListener("click", event => {
      const link = linkFrom(event);
      if (!link) return;
      const url = new URL(link.href, win.location.href);
      if (url.origin !== location.origin) return;
      if (PROFILE_PAGE.test(url.pathname)) {
        event.preventDefault();
        closeShell(url.hash);
      }
    }, true);
  }

  /* ---------- Progress and done card ---------- */

  function hideDock() {
    if (!dock) return;
    const old = dock;
    dock = null;
    dockMode = null;
    old.classList.remove("show");
    setTimeout(() => old.remove(), 320);
  }

  function showDock(build) {
    const fresh = !dock;
    if (fresh) {
      dock = el("aside", "cw-bg-dock");
      dock.setAttribute("role", "status");
      dock.setAttribute("aria-live", "polite");
      document.body.appendChild(dock);
    }
    build(dock);
    if (fresh) requestAnimationFrame(() => requestAnimationFrame(() => dock?.classList.add("show")));
  }

  function renderProgress() {
    dockMode = "progress";
    showDock(card => {
      card.dataset.mode = "progress";
      card.dataset.ok = "true";
      const icon = el("span", "cw-bg-icon");
      icon.setAttribute("aria-hidden", "true");
      icon.appendChild(el("span", "cw-bg-spin"));
      const copy = el("div", "cw-bg-copy");
      copy.append(
        el("strong", "", lastActivity?.title || "Canvas is working…"),
        el("span", "", "Keeps running while you browse.")
      );
      if (lastActivity?.total > 0 && lastActivity.completed != null) {
        const bar = document.createElement("progress");
        bar.max = lastActivity.total;
        bar.value = lastActivity.completed;
        bar.setAttribute("aria-label", `${lastActivity.completed} of ${lastActivity.total} done`);
        copy.appendChild(bar);
      }
      copy.appendChild(button("Go to Canvas", "cw-bg-link", () => closeShell()));
      card.replaceChildren(icon, copy);
    });
  }

  function renderDone(info) {
    dockMode = "done";
    showDock(card => {
      card.dataset.mode = "done";
      card.dataset.ok = String(info.ok !== false);
      const icon = el("span", "cw-bg-icon");
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = info.ok === false ? ICON_ALERT : ICON_DONE;
      const copy = el("div", "cw-bg-copy");
      copy.append(el("strong", "", info.title || "Canvas is done"));
      if (info.detail) copy.appendChild(el("span", "", info.detail));
      const actions = el("div", "cw-bg-actions");
      const primary = info.action === "tasks" && info.ok !== false
        ? button("View tasks", "btn btn-primary", () => {
            hideDock();
            if (shell) frame.src = "todo.html"; else location.href = "todo.html";
          })
        : button(info.ok === false ? "Go to Canvas" : "Review now", "btn btn-primary", () => {
            hideDock();
            if (shell) closeShell(); else document.getElementById("canvas")?.scrollIntoView({ block: "start" });
          });
      actions.append(primary, button("Dismiss", "btn btn-outline", hideDock));
      copy.appendChild(actions);
      card.replaceChildren(icon, copy);
    });
  }

  // Progress only shows while another page is open; on Profile the inline card already shows it.
  function refreshDock() {
    if (dockMode === "done") return;
    if (working && shell) renderProgress();
    else hideDock();
  }

  function canvasInView() {
    if (shell) return false;
    const preview = document.getElementById("cw-canvas-preview") || document.getElementById("canvas");
    if (!preview) return false;
    const box = preview.getBoundingClientRect();
    return box.bottom > 0 && box.top < innerHeight;
  }

  window.addEventListener("cw-canvas-working", event => {
    working = Boolean(event.detail?.working);
    if (working && dockMode === "done") hideDock(); // a new step started
    refreshDock();
  });

  window.addEventListener("cw-canvas-activity", event => {
    if (event.detail?.state !== "loading") return;
    lastActivity = event.detail;
    if (dockMode === "progress") renderProgress();
  });

  window.addEventListener("cw-canvas-done", event => {
    if (canvasInView()) { hideDock(); return; }
    renderDone(event.detail || {});
  });

  // Refreshing or closing the tab would still stop the work, so ask first.
  window.addEventListener("beforeunload", event => {
    if (!working) return;
    event.preventDefault();
    event.returnValue = "";
  });
})();
