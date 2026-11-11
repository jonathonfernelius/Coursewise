/* Coursewise dropdown — upgrades a native <select> into the app's shared menu, so every
   dropdown looks and behaves the same way. Opt in with <select data-dd> (data-dd="compact"
   for the smaller toolbar size).

   The native <select> stays in the DOM, visually hidden, as the source of truth. Code that
   reads .value, sets .value / .innerHTML, or listens for "change" keeps working unchanged.
   Menu keyboard support: Up/Down, Home/End, Enter/Space, Esc, Tab, and type-to-find. */
(() => {
  if (window.CoursewiseDropdown) return;

  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const CHEVRON = svg('<path d="m6 9 6 6 6-6"/>').replace("<svg", '<svg class="dd-chevron"');
  const CHECK = svg('<path d="m5 12 4 4L19 6"/>');
  const valueProp = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  const indexProp = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
  // Rows that open another dialog ("+ New list…", "Custom…") are actions: separated, not checkable, fire on every pick.
  const isAction = o => /^__(new|custom|create)/.test(o.value) || o.hasAttribute("data-dd-action");
  let uid = 0, current = null;

  function labelTextFor(select) {
    const own = select.getAttribute("aria-label");
    if (own) return { text: own, label: null };
    const label = (select.id && document.querySelector(`label[for="${CSS.escape(select.id)}"]`)) || select.closest("label");
    if (!label) return { text: "", label: null };
    // Only the label's own text, never the option text nested inside it.
    const text = [...label.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(" ").trim()
      || (label.matches("label[for]") ? label.textContent.trim() : "");
    return { text, label };
  }

  function enhance(select) {
    if (!select || select.__dd) return select?.__dd;
    const base = `dd${++uid}`;
    const wrap = document.createElement("div");
    wrap.className = "dd" + (select.dataset.dd === "compact" ? " dd-compact" : "");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "dd-trigger";
    trigger.id = `${base}-trigger`;
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", `${base}-menu`);
    trigger.innerHTML = `<span class="dd-value" id="${base}-value"></span>${CHEVRON}`;
    const valueEl = trigger.firstElementChild;

    const { text, label } = labelTextFor(select);
    if (text) {
      const hidden = document.createElement("span");
      hidden.id = `${base}-label`;
      hidden.className = "sr-only";
      hidden.textContent = text;
      wrap.append(hidden);
      trigger.setAttribute("aria-labelledby", `${hidden.id} ${valueEl.id}`);
    }
    // A <label for> would otherwise send clicks to the hidden select; send them to the menu button instead.
    if (label && label.matches("label[for]")) label.addEventListener("click", e => { e.preventDefault(); trigger.focus(); });

    const menu = document.createElement("div");
    menu.className = "dd-menu";
    menu.id = `${base}-menu`;
    menu.tabIndex = -1;
    menu.hidden = true;
    menu.setAttribute("role", "listbox");
    if (text) menu.setAttribute("aria-label", text);

    select.parentNode.insertBefore(wrap, select);
    wrap.append(trigger, menu, select);
    select.classList.add("dd-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const options = () => [...menu.querySelectorAll(".dd-option:not([aria-disabled=true])")];

    function build() {
      menu.replaceChildren();
      let separated = false;
      [...select.options].forEach((o, i) => {
        if (o.hidden) return;
        const action = isAction(o);
        if (action && !separated) {
          const sep = document.createElement("div");
          sep.className = "dd-sep";
          sep.setAttribute("role", "separator");
          menu.append(sep);
          separated = true;
        }
        const el = document.createElement("div");
        el.className = "dd-option" + (action ? " is-action" : "");
        el.id = `${base}-o${i}`;
        el.dataset.index = i;
        el.setAttribute("role", "option");
        if (o.disabled) el.setAttribute("aria-disabled", "true");
        el.innerHTML = `<span class="dd-check">${CHECK}</span><span class="dd-option-text"></span>`;
        el.lastElementChild.textContent = o.textContent;
        menu.append(el);
      });
    }

    function sync() {
      const o = select.options[select.selectedIndex];
      valueEl.textContent = o ? o.textContent : "";
      // Empty-value rows like "No category" are real choices; only dim the text when a select opts in as a placeholder.
      valueEl.classList.toggle("is-placeholder", select.hasAttribute("data-dd-placeholder") && (!o || o.value === ""));
      trigger.disabled = select.disabled;
      menu.querySelectorAll(".dd-option").forEach(el =>
        el.setAttribute("aria-selected", String(Number(el.dataset.index) === select.selectedIndex)));
    }

    function setActive(el, scroll = true) {
      menu.querySelector(".is-active")?.classList.remove("is-active");
      if (!el) return menu.removeAttribute("aria-activedescendant");
      el.classList.add("is-active");
      menu.setAttribute("aria-activedescendant", el.id);
      if (scroll) el.scrollIntoView({ block: "nearest" });
    }

    function open() {
      if (trigger.disabled || !menu.hidden) return;
      current?.close();
      build();
      sync();
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      menu.classList.remove("is-up");
      const r = trigger.getBoundingClientRect(), room = innerHeight - r.bottom - 12;
      if (menu.offsetHeight > room && r.top > room) menu.classList.add("is-up");
      setActive(menu.querySelector("[aria-selected=true]") || options()[0]);
      menu.focus({ preventScroll: true });
      current = api;
    }

    function close(refocus) {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      setActive(null);
      if (current === api) current = null;
      if (refocus) trigger.focus();
    }

    function choose(el) {
      const index = Number(el?.dataset.index), o = select.options[index];
      if (!o || o.disabled) return;
      const changed = index !== select.selectedIndex;
      indexProp.set.call(select, index);
      close(true);
      sync();
      // Action rows ("+ New list…") fire every time, even when already selected.
      if (changed || isAction(o)) select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    let typed = "", typedTimer;
    function typeahead(ch) {
      clearTimeout(typedTimer);
      typed += ch.toLowerCase();
      typedTimer = setTimeout(() => (typed = ""), 600);
      const list = options(), from = Math.max(0, list.indexOf(menu.querySelector(".is-active")));
      const hit = [...list.slice(typed.length > 1 ? from : from + 1), ...list.slice(0, from + 1)]
        .find(el => el.textContent.trim().toLowerCase().startsWith(typed));
      if (hit) setActive(hit);
    }

    trigger.addEventListener("click", () => (menu.hidden ? open() : close(false)));
    trigger.addEventListener("keydown", e => {
      if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); open(); }
    });

    menu.addEventListener("keydown", e => {
      const list = options(), at = list.indexOf(menu.querySelector(".is-active"));
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(list[Math.min(list.length - 1, at + 1)]); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(list[Math.max(0, at - 1)]); }
      else if (e.key === "Home") { e.preventDefault(); setActive(list[0]); }
      else if (e.key === "End") { e.preventDefault(); setActive(list[list.length - 1]); }
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (e.key === " " && typed) typeahead(" "); else choose(menu.querySelector(".is-active"));
      }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === "Tab") close(false);
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key);
    });
    menu.addEventListener("pointerdown", e => e.preventDefault()); // keep focus on the menu
    menu.addEventListener("click", e => {
      e.preventDefault(); // stops an enclosing <label> from re-clicking the button
      const el = e.target.closest(".dd-option");
      if (el) choose(el);
    });
    menu.addEventListener("pointermove", e => {
      const el = e.target.closest(".dd-option");
      if (el && !el.classList.contains("is-active")) setActive(el, false);
    });
    wrap.addEventListener("focusout", e => {
      if (!menu.hidden && !wrap.contains(e.relatedTarget)) close(false);
    });

    // Keep the menu in step with code that changes the native select directly.
    for (const [name, prop] of [["value", valueProp], ["selectedIndex", indexProp]]) {
      Object.defineProperty(select, name, {
        configurable: true,
        get() { return prop.get.call(this); },
        set(v) { prop.set.call(this, v); sync(); }
      });
    }
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => { queued = false; if (!menu.hidden) build(); sync(); });
    }).observe(select, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled", "selected", "label"] });
    select.addEventListener("change", sync);

    const api = { wrap, trigger, menu, select, open, close, sync };
    select.__dd = api;
    build();
    sync();
    return api;
  }

  const scan = root => root.querySelectorAll?.("select[data-dd]").forEach(enhance);

  // Close on outside click, and make Esc close just the menu (not the dialog around it).
  document.addEventListener("pointerdown", e => { if (current && !current.wrap.contains(e.target)) current.close(false); }, true);
  document.addEventListener("cancel", e => { if (current) { e.preventDefault(); current.close(true); } }, true);

  new MutationObserver(records => {
    for (const r of records) for (const n of r.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches("select[data-dd]")) enhance(n);
      scan(n);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  scan(document);

  window.CoursewiseDropdown = { enhance, scan };
})();
