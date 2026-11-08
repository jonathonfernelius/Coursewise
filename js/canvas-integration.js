/*
 * Coursewise Canvas Integration
 * Connection, preview, importing, and saved selections.
 */

(() => {
  "use strict";

  const client = window.tidyClient;
  let connected = false;
  let currentSection = null;
  let previewData = null;
  let canvasHistoryKey = null;

  // Choices remain available while this page is open.
  const choices = new Map();
  const coursePreferences = new Map();
  const CREATE_COURSE_CATEGORY = "__create_course_category__";

  const style = document.createElement("style");
  style.textContent = `
    .cw-canvas-identity{display:flex;align-items:center;gap:14px;margin:4px 0 18px}
    .cw-canvas-symbol{display:grid;place-items:center;flex:none;width:52px;height:52px;border-radius:17px;background:color-mix(in srgb,var(--primary) 10%,var(--card));color:var(--primary)}
    .cw-canvas-symbol svg{width:30px;height:30px;animation:cw-calendar-sway 7s ease-in-out infinite;transform-origin:50% 60%}
    .cw-canvas-identity-copy{display:grid;gap:5px}
    .cw-canvas-identity-copy strong{font-size:15px;font-weight:550;color:var(--fg)}
    .cw-canvas-identity-copy>span{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--muted-fg)}
    .cw-canvas-identity-copy .cw-status-dot{width:6px;height:6px}
    .cw-saved-status{display:flex;align-items:flex-start;gap:12px;padding:18px;margin:0 0 22px;border:1px solid color-mix(in srgb,var(--primary) 28%,var(--border));border-left:4px solid var(--primary);border-radius:16px;background:color-mix(in srgb,var(--primary) 9%,var(--card));color:var(--fg)}
    .cw-saved-status-icon{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--card);color:var(--primary)}
    .cw-saved-status-icon svg{width:23px;height:23px}
    .cw-saved-status strong{display:block;font-size:16px;line-height:1.4;font-weight:650}
    .cw-saved-status p{margin:5px 0 0;font-size:14px;line-height:1.55;color:var(--muted-fg)}
    .cw-canvas-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:12px}
    .cw-canvas-controls>.cw-canvas-actions{grid-column:1;grid-row:1;min-width:0}
    .cw-canvas-controls>#cw-canvas-preview{grid-column:1/-1;grid-row:2;min-width:0}
    .cw-canvas-footer{display:flex;justify-content:flex-end;grid-column:2;grid-row:1}
    .cw-canvas-controls:has(#cw-canvas-preview:not(:empty))>.cw-canvas-footer{grid-row:3;margin-top:12px}
    @media(max-width:360px){.cw-canvas-controls{column-gap:8px}.cw-canvas-controls #cw-preview-button{padding-inline:10px}}
    .cw-canvas-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .cw-canvas-actions #cw-preview-button{font-size:13px;padding:10px 16px;min-height:40px;border-radius:12px}
    .cw-canvas-footer #cw-disconnect{font-size:12px;padding:8px 4px;min-height:36px;background:transparent;border-color:transparent;color:var(--muted-fg);box-shadow:none}
    .cw-canvas-footer #cw-disconnect:hover{color:var(--fg);text-decoration:underline}
    #cw-canvas-preview:empty{display:none}
    @keyframes cw-calendar-sway{0%,65%,100%{transform:rotate(0)}76%{transform:rotate(-3deg)}87%{transform:rotate(2deg)}}
    @media(prefers-reduced-motion:reduce){.cw-canvas-symbol svg{animation:none}}
    .cw-connection-status {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 14px;
      font-weight: 400;
      margin-bottom: 8px;
    }

    .cw-status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #218668;
      flex-shrink: 0;
    }

    .cw-disconnect-action {
      margin-top: 20px;
    }

    .cw-disconnect-action .btn {
      font-size: 14px;
    }

    #cw-canvas-preview input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 21px;
      height: 21px;
      min-width: 21px;
      border: 2px solid #d8b5c3;
      border-radius: 7px;
      background: white;
      cursor: pointer;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    #cw-canvas-preview input[type="checkbox"]:checked {
      background: var(--primary, #a35b79);
      border-color: var(--primary, #a35b79);
    }
    #cw-canvas-preview input[type="checkbox"]:checked::after {
      content: "✓";
      color: white;
      font-size: 14px;
      font-weight: bold;
    }
    #cw-canvas-preview input[type="checkbox"]:focus-visible {
      outline: 3px solid #eec3d6;
      outline-offset: 3px;
    }
    .cw-event-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 10px 6px;
      cursor: pointer;
    }
    .cw-event-entry { border-radius: 10px; }
    .cw-event-row:hover {
      background: rgba(163, 91, 121, 0.05);
      border-radius: 8px;
    }
    #cw-preview-button[hidden]{display:none!important}
    .cw-activity-detail:empty{display:none}
    .cw-review-help{margin:12px 0;color:var(--muted-fg);font-size:12px}
    .cw-review-help>summary{cursor:pointer;width:fit-content;padding:4px 0}
    .cw-review-help>summary:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
    .cw-review-help p{margin:6px 0 0}
    .cw-review-options{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 10px}
    .cw-import-hint{font-size:12px;line-height:1.6;color:var(--muted-fg);margin:12px 0}
    .cw-review-note{font-size:13px;color:var(--primary);margin:10px 0}
    .cw-import-count{font-weight:600;font-size:16px;margin:18px 0 12px}
    .cw-import-courses{display:grid;gap:12px}
    .cw-import-course{border:1px solid var(--border);border-radius:14px;padding:16px;background:var(--card);min-width:0}
    .cw-import-course-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .cw-import-course-head h4{margin:0;font-size:16px}
    .cw-import-course>label{display:grid;gap:6px;font-size:12px;color:var(--muted-fg)}
    .cw-import-course select{width:100%;min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px}
    .cw-import-items{margin-top:12px;border-top:1px solid var(--border);padding-top:10px}
    .cw-import-items>summary{cursor:pointer;font-size:13px;color:var(--fg);padding:4px 0}
    .cw-import-skipped>summary{color:var(--muted-fg)}
    .cw-import-item-copy{display:grid;gap:4px;min-width:0;overflow-wrap:anywhere}
    .cw-import-item-copy strong{font-size:13px;font-weight:500}
    .cw-import-item-copy>.muted{font-size:12px}
    .cw-import-course .cw-event-row{align-items:flex-start;padding:12px 0}
    #cw-canvas-preview>h3{margin-top:0}
    @media(max-width:520px){.cw-review-options>.btn{width:100%}.cw-import-course{padding:12px}}
    .cw-ai-note {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0 6px 8px 37px;
      padding: 10px 12px;
      border: 1px solid var(--warning);
      border-radius: 10px;
      background: var(--secondary);
      color: var(--fg);
      font-size: 13px;
    }
    .cw-ai-note[hidden] { display: none; }
    .cw-ai-note p { margin: 0; }
    .cw-ai-note .btn { flex-shrink: 0; }
    .cw-ai-controls { margin: 14px 0 8px; }
    .cw-ai-disclosure { margin: 6px 0 0; font-size: 12px; }
    .cw-activity {
      display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px;
      margin: 12px 0 16px; padding: 16px; border: 1px solid var(--border);
      border-radius: 14px; background: var(--card, var(--bg)); color: var(--fg);
      font-size: 13px; line-height: 1.5; text-align: left;
    }
    .cw-activity-icon { width: 30px; height: 30px; border-radius: 50%;
      display: grid; place-items: center; color: var(--primary); background: var(--muted); }
    .cw-activity-icon::before { content: ""; width: 16px; height: 16px;
      border: 2px solid var(--border); border-top-color: var(--primary);
      border-right-color: var(--primary); border-radius: 50%; animation: cw-spin 1s linear infinite; }
    .cw-activity[data-state="complete"] .cw-activity-icon::before {
      width: 10px; height: 6px; border: 0; border-left: 2px solid currentColor;
      border-bottom: 2px solid currentColor; border-radius: 0; transform: rotate(-45deg); animation: none; }
    .cw-activity[data-state="error"] .cw-activity-icon { color: var(--danger, #b42318); }
    .cw-activity[data-state="error"] .cw-activity-icon::before {
      content: "!"; border: 0; width: auto; height: auto; font-weight: 700; animation: none; }
    .cw-activity-title { display: block; font-size: 14px; font-weight: 600; }
    .cw-activity-detail { display: block; color: var(--muted-fg); margin-top: 3px; overflow-wrap: anywhere; }
    .cw-activity progress { display: block; width: 100%; height: 6px; margin-top: 12px;
      border: 0; border-radius: 99px; overflow: hidden; background: var(--muted); accent-color: var(--primary); }
    .cw-activity progress::-webkit-progress-bar { background: var(--muted); border-radius: 99px; }
    .cw-activity progress::-webkit-progress-value { background: var(--primary); border-radius: 99px; transition: width .35s ease; }
    .cw-activity progress::-moz-progress-bar { background: var(--primary); border-radius: 99px; }
    .cw-button-busy { display: inline-flex; align-items: center; justify-content: center; gap: 9px; }
    .cw-button-busy::before { content: ""; flex: 0 0 13px; width: 13px; height: 13px;
      border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: cw-spin 1s linear infinite; }
    @keyframes cw-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .cw-activity-icon::before, .cw-button-busy::before { animation: none; }
      .cw-activity progress::-webkit-progress-value { transition: none; }
    }
    .cw-ai-status {
      margin: 8px 0 14px;
      padding: 11px 13px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--muted);
      color: var(--fg);
      font-size: 13px;
    }
    .cw-ai-status:empty { display: none; }
    .cw-ai-status[data-state="complete"] { border-color: var(--primary); }
    .cw-ai-status[data-state="error"] { border-color: var(--danger); }
    .cw-ai-summary {
      margin: 0 0 16px;
      padding: 14px;
      border: 1px solid var(--primary);
      border-radius: 12px;
      background: var(--card);
      color: var(--fg);
    }
    .cw-ai-summary[hidden] { display: none; }
    .cw-ai-summary h3 { margin: 0 0 5px; font-size: 16px; font-weight: 400; }
    .cw-ai-summary-intro { margin: 0 0 12px; color: var(--muted-fg); font-size: 13px; }
    .cw-ai-reason-groups { display: grid; gap: 8px; }
    .cw-ai-reason-group {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg);
    }
    .cw-ai-reason-copy { min-width: 0; }
    .cw-ai-reason-label { display: block; color: var(--primary-dark); font-size: 11px; font-weight: 400; }
    .cw-ai-reason-text { display: block; font-size: 13px; }
    .cw-ai-mass-status { margin: 10px 0 0; color: var(--primary-dark); font-size: 13px; }
    @media (max-width: 520px) {
      #cw-preview-button[hidden]{display:none!important}
    .cw-activity-detail:empty{display:none}
    .cw-review-help{margin:12px 0;color:var(--muted-fg);font-size:12px}
    .cw-review-help>summary{cursor:pointer;width:fit-content;padding:4px 0}
    .cw-review-help>summary:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
    .cw-review-help p{margin:6px 0 0}
    .cw-review-options{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 10px}
    .cw-import-hint{font-size:12px;line-height:1.6;color:var(--muted-fg);margin:12px 0}
    .cw-review-note{font-size:13px;color:var(--primary);margin:10px 0}
    .cw-import-count{font-weight:600;font-size:16px;margin:18px 0 12px}
    .cw-import-courses{display:grid;gap:12px}
    .cw-import-course{border:1px solid var(--border);border-radius:14px;padding:16px;background:var(--card);min-width:0}
    .cw-import-course-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .cw-import-course-head h4{margin:0;font-size:16px}
    .cw-import-course>label{display:grid;gap:6px;font-size:12px;color:var(--muted-fg)}
    .cw-import-course select{width:100%;min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px}
    .cw-import-items{margin-top:12px;border-top:1px solid var(--border);padding-top:10px}
    .cw-import-items>summary{cursor:pointer;font-size:13px;color:var(--fg);padding:4px 0}
    .cw-import-skipped>summary{color:var(--muted-fg)}
    .cw-import-item-copy{display:grid;gap:4px;min-width:0;overflow-wrap:anywhere}
    .cw-import-item-copy strong{font-size:13px;font-weight:500}
    .cw-import-item-copy>.muted{font-size:12px}
    .cw-import-course .cw-event-row{align-items:flex-start;padding:12px 0}
    #cw-canvas-preview>h3{margin-top:0}
    @media(max-width:520px){.cw-review-options>.btn{width:100%}.cw-import-course{padding:12px}}
    .cw-ai-note { align-items: flex-start; flex-direction: column; margin-left: 12px; }
      .cw-ai-reason-group { align-items: stretch; flex-direction: column; }
    }
    .cw-course {
      padding: 12px;
      border: 1px solid var(--border, #e5e5e5);
      border-radius: 12px;
      margin-top: 12px;
    }
    .cw-course summary {
      cursor: pointer;
      font-weight: 400;
    }
    .cw-course-settings {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin: 14px 0;
    }
    .cw-course-settings label {
      flex: 1;
      min-width: 145px;
      font-size: 13px;
    }
    .cw-course-settings select {
      display: block;
      width: 100%;
      margin-top: 5px;
      padding: 9px;
      border: 1px solid var(--border, #ddd);
      border-radius: 8px;
      background: var(--card);
      color: var(--fg);
    }
    .cw-status {
      font-size: 12px;
      opacity: .7;
      margin-top: 3px;
    }
    .cw-new-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(32, 24, 44, .55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .cw-new-modal {
      background: var(--card);
      color: var(--fg);
      width: min(570px, 100%);
      max-height: min(85vh, 780px);
      overflow: auto;
      border-radius: 20px;
      padding: 24px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-float);
    }
    .cw-new-modal h3 { margin: 0 0 8px; }
    .cw-new-item {
      padding: 14px;
      border: 1px solid var(--border, #e5e5e5);
      border-radius: 12px;
      margin: 12px 0;
      background: var(--bg);
      color: var(--fg);
    }
    .cw-new-item strong { display: block; }
    .cw-new-item .cw-course-settings { margin: 10px 0 0; }
    .cw-new-modal .cw-actions { justify-content: flex-end; }
    .cw-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }

    .cw-list-picker{position:relative;display:grid;gap:6px;min-width:0}
    .cw-list-picker-label{font-size:12px;color:var(--muted-fg)}
    .cw-list-picker-trigger{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:42px;padding:0 12px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px;text-align:left;cursor:pointer}
    .cw-list-picker-trigger:hover{background:var(--muted)}
    .cw-list-picker-trigger:focus-visible,.cw-list-picker-trigger[aria-expanded=true]{outline:2px solid var(--ring);outline-offset:0;border-color:var(--ring)}
    .cw-list-picker-trigger svg{width:16px;height:16px;flex:none;color:var(--muted-fg)}
    .cw-list-picker-value{display:flex;align-items:center;gap:8px;min-width:0}
    .cw-list-picker-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .cw-list-picker-name.is-empty{color:var(--muted-fg)}
    .cw-list-picker-new{flex:none;font-size:11px;font-weight:500;line-height:1;padding:3px 8px;border-radius:999px;background:var(--accent);color:var(--accent-fg)}
    .cw-list-picker-menu{position:absolute;z-index:20;top:calc(100% + 4px);left:0;right:0;display:flex;flex-direction:column;max-height:min(20rem,55dvh);box-sizing:border-box;border:1px solid var(--border);border-radius:12px;background:var(--card);box-shadow:var(--shadow-card,0 8px 24px rgba(0,0,0,.12));overflow:hidden}
    .cw-list-picker-menu[hidden]{display:none}
    .cw-list-picker-menu.is-up{top:auto;bottom:calc(100% + 4px)}
    .cw-list-picker-search{flex:none;margin:6px 6px 0;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px}
    .cw-list-picker-search:focus-visible,.cw-list-picker-input:focus-visible{outline:2px solid var(--ring);outline-offset:0;border-color:var(--ring)}
    .cw-list-picker-options{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:6px;display:grid;gap:1px;align-content:start}
    .cw-list-picker-option{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:6px 8px;border:0;border-radius:8px;background:transparent;color:var(--fg);font:inherit;font-size:14px;text-align:left;cursor:pointer}
    .cw-list-picker-option:hover,.cw-list-picker-option:focus-visible{background:var(--muted);outline:none}
    .cw-list-picker-option:focus-visible{box-shadow:inset 0 0 0 2px var(--ring)}
    .cw-list-picker-check{width:16px;height:16px;flex:none;color:var(--primary,currentColor);visibility:hidden}
    .cw-list-picker-option[aria-selected=true] .cw-list-picker-check{visibility:visible}
    .cw-list-picker-option-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .cw-list-picker-empty{padding:8px;font-size:13px;color:var(--muted-fg)}
    .cw-list-picker-create{flex:none;display:grid;gap:6px;padding:10px 12px;border-top:1px solid var(--border);background:color-mix(in oklch,var(--muted) 55%,var(--card))}
    .cw-list-picker-create-label{font-size:12px;font-weight:500;color:var(--muted-fg)}
    .cw-list-picker-create-row{display:flex;gap:8px}
    .cw-list-picker-input{flex:1;min-width:0;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--fg);font:inherit;font-size:14px}
    .cw-list-picker-create-row .btn{flex:none;padding-top:7px;padding-bottom:7px}
    .cw-list-picker-error{margin:0;font-size:12px;color:#b42318;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
    .cw-list-picker-error[hidden]{display:none}
    .cw-list-picker-error button{border:0;background:none;padding:0;font:inherit;font-size:12px;color:var(--fg);text-decoration:underline;cursor:pointer}

    .cw-back{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:13px;margin:0 0 14px}
    .cw-back svg{width:14px;height:14px}
    .cw-ai-cancel{margin-top:12px}
    .cw-import-count-row{display:flex;align-items:baseline;justify-content:space-between;gap:4px 12px;flex-wrap:wrap}
    .cw-save-status{margin:0;font-size:12px;color:var(--muted-fg)}
    .cw-import-item-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px}
    .cw-import-leftout>summary{color:var(--muted-fg)}
  `;
  document.head.appendChild(style);

  async function callFunction(name, body) {
    if (!client) {
      throw new Error("Supabase is not available.");
    }

    const { data: sessionData } =
      await client.auth.getSession();

    if (!sessionData?.session) {
      throw new Error("Please sign in again.");
    }

    const { data, error } =
      await client.functions.invoke(name, { body });

    if (error) {
      let explanation = error.message;

      try {
        const response = await error.context?.json();
        explanation = response?.error || explanation;
      } catch {
        // Keep the original error message.
      }

      throw new Error(explanation || "Request failed.");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data || {};
  }

  function callCanvas(action, feedUrl) {
    const body = { action };

    if (action === "connect") {
      body.feedUrl = feedUrl;
    }

    return callFunction("canvas-connect", body);
  }

  function message(section, text, isError = false) {
    const target =
      section.querySelector("#cw-canvas-message");

    if (target) {
      target.textContent = text;
      target.style.color =
        isError ? "#b42318" : "";
    }
  }

  function element(tag, text, className = "") {
    const result = document.createElement(tag);
    result.textContent = text;
    result.className = className;
    return result;
  }

  function activity(target, state, title, detail, completed = null, total = null) {
    target.classList.add("cw-activity");
    target.dataset.state = state;
    target.setAttribute("role", "status");
    target.setAttribute("aria-live", "polite");
    target.setAttribute("aria-atomic", "true");
    const icon = element("span", "", "cw-activity-icon");
    icon.setAttribute("aria-hidden", "true");
    const copy = element("span", "", "cw-activity-copy");
    copy.append(element("span", title, "cw-activity-title"),
      element("span", detail, "cw-activity-detail"));
    if (total > 0 && completed != null) {
      const bar = document.createElement("progress");
      bar.max = total;
      bar.value = completed;
      bar.setAttribute("aria-label", `${completed} of ${total} items reviewed`);
      copy.appendChild(bar);
    }
    target.replaceChildren(icon, copy);
  }

  function buttonLoading(button, loading, label) {
    button.classList.toggle("cw-button-busy", loading);
    button.setAttribute("aria-busy", String(loading));
    button.textContent = label;
  }

  // Creates a dropdown using Coursewise's real data.
  function dropdown(title, options, value, onChange) {
    const wrapper = document.createElement("label");
    wrapper.textContent = title;

    const select = document.createElement("select");

    for (const option of options) {
      const node = document.createElement("option");
      node.value = String(option.value);
      node.textContent = option.label;
      select.appendChild(node);
    }

    select.value = value || "";
    select.addEventListener("change", () => {
      onChange(select.value);
    });

    wrapper.appendChild(select);
    return wrapper;
  }

  // Keep selection and organization choices together.
  function getChoice(event) {
    if (!choices.has(event.uid)) {
      choices.set(event.uid, {
        selected: true,
        listId: null,
        categoryId: null
      });
    }

    return choices.get(event.uid);
  }

  function matchingCourseCategory(course) {
    const name = String(course || "").trim();
    if (!name || name.toLowerCase() === "unsorted") return null;
    return (window.Tidy?.categories || []).find(category =>
      category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    ) || null;
  }

  function suggestedCourseCategory(course) {
    return matchingCourseCategory(course)?.id ||
      (course && String(course).trim().toLowerCase() !== "unsorted" ? CREATE_COURSE_CATEGORY : "");
  }

  function categoryOptionsForCourse(course) {
    const options = [
      { value: "", label: "No category" },
      ...(window.Tidy?.categories || []).map(category => ({ value: String(category.id), label: category.name }))
    ];
    if (!matchingCourseCategory(course) && course && String(course).trim().toLowerCase() !== "unsorted") {
      options.push({ value: CREATE_COURSE_CATEGORY, label: `Create category “${course}” when importing` });
    }
    return options;
  }

  async function resolveCourseCategorySuggestions(events) {
    const courses = new Set(events.filter(event => getChoice(event).categoryId === CREATE_COURSE_CATEGORY)
      .map(event => courseOf(event))
      .filter(course => String(course).trim().toLowerCase() !== "unsorted"));
    for (const course of courses) {
      let category = matchingCourseCategory(course);
      if (!category) {
        const tones = window.Tidy?.tones || ["sky"];
        category = await window.Tidy.addCategory(course, tones[window.Tidy.categories.length % tones.length]);
      }
      coursePreferences.set(course, { ...(coursePreferences.get(course) || {}), categoryId: String(category.id) });
      for (const event of events) {
        if (courseOf(event) === course && getChoice(event).categoryId === CREATE_COURSE_CATEGORY) {
          getChoice(event).categoryId = String(category.id);
        }
      }
    }
  }

  // Read stored choices and imported task IDs.
  async function loadSelections(events, savedResult = null) {
    const result = savedResult ?? await callFunction(
      "canvas-selections",
      { action: "load" }
    );

    const saved = new Map(
      (result.choices || []).map(item => [
        item.CanvasUID,
        item
      ])
    );

    const imported = new Map(
      (result.imported || []).map(item => [
        item.CanvasUID,
        String(item.TaskID)
      ])
    );

    const tasks = window.Tidy?.state?.tasks || [];

    for (const event of events) {
      const stored = saved.get(event.uid);
      if (stored) editedSelections.add(event.uid);
      const existingTaskId = imported.get(event.uid);
      const existingTask = tasks.find(
        task => String(task.id) === existingTaskId
      );

      // A local unsaved change takes precedence.
      if (!choices.has(event.uid)) {
        choices.set(event.uid, {
          selected: stored
            ? stored.Selected
            : existingTask
              ? true
              : true,
          // For imported tasks, the task's current values win. This
          // preserves edits made from the pencil icon on Today/To-do.
          listId: existingTask
            ? existingTask.listId
            : stored?.ListID == null ? null : String(stored.ListID),
          categoryId: existingTask
            ? existingTask.categoryId
            : stored
              ? (stored.CategoryID == null ? null : String(stored.CategoryID))
              : suggestedCourseCategory(courseOf(event)) || null
        });
      }
    }

    return imported;
  }

    // Resolve saved list choices against the currently loaded user's lists.
    // Do not clear anything until state has loaded successfully.
    function clearUnavailableLists() {
      const state = window.Tidy?.state;
      if (!state?.signedIn || !Array.isArray(state.lists)) return 0;
      const validIds = new Set(state.lists.map(list => String(list.id)));
      let cleared = 0;
      for (const choice of choices.values()) {
        const value = choice.listId == null ? null : String(choice.listId).trim() || null;
        if (value && !validIds.has(value)) cleared++;
        choice.listId = value && validIds.has(value) ? value : null;
      }
      for (const pref of coursePreferences.values()) {
        if (pref.listId != null && !validIds.has(String(pref.listId))) pref.listId = null;
      }
      return cleared;
    }

  // Uses course preferences for new assignments.
  function applyCoursePreference(course, field, value, events) {
    for (const event of events) {
      const eventCourse = event.course || "Unsorted";
      if (eventCourse !== course) continue;

      getChoice(event)[field] = value || null;
    }

    const preference = coursePreferences.get(course) || {};
    preference[field] = value || null;
    coursePreferences.set(course, preference);
  }

  const reviewCache = new Map();
  const editedSelections = new Set();

  // Items the person has already sorted (checked or unchecked) never need sorting again.
  const undecidedItems = (events, imported) => events.filter(e => !imported.has(e.uid) && !editedSelections.has(e.uid));

  // ---- Autosave: every checkbox change is remembered, even if you leave before importing ----
  let reviewFresh = [];      // items currently on screen
  let saveTimer = null;
  let saveDirty = false;
  let saveStatusEl = null;
  let aiRunId = 0;           // bumping this cancels an in-flight AI review
  function setSaveStatus(text, isError = false) {
    if (!saveStatusEl || !saveStatusEl.isConnected) return;
    saveStatusEl.textContent = text;
    saveStatusEl.style.color = isError ? "#b42318" : "";
  }
  function destinationFor(event) {
    const destination = courseDestinations.get(courseOf(event));
    return destination && destination !== "__create__" ? destination : null;
  }
  function queueSave() {
    saveDirty = true;
    setSaveStatus("Saving…");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 600);
  }
  async function flushSave() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!saveDirty || canvasWorking) return; // an import saves everything itself
    saveDirty = false;
    // Only save items you've made a decision about; undecided items stay "new".
    const items = reviewFresh.filter(e => editedSelections.has(e.uid)).map(e => ({
      uid: e.uid, selected: getChoice(e).selected, listId: destinationFor(e) ?? getChoice(e).listId,
      categoryId: getChoice(e).categoryId === CREATE_COURSE_CATEGORY ? null : getChoice(e).categoryId || null
    }));
    if (!items.length) { setSaveStatus(""); return; }
    try {
      await callFunction("canvas-selections", {action: "save", items});
      if (!saveDirty) setSaveStatus("Choices saved");
    } catch {
      saveDirty = true;
      setSaveStatus("Couldn’t save your choices yet", true);
    }
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSave(); });
  const courseDestinations = new Map();
  const courseNewNames = new Map(); // course -> editable name for a list that will be created on confirm
  function newListName(course) { return (courseNewNames.get(course) || listTitle(course)).replace(/\s+/g, " ").trim().slice(0, 30); }
  let canvasWorking = false;

  function courseOf(event) {
    return event.course || event.title?.match(/\[([^\]]+)\]\s*$/)?.[1] || "Unsorted";
  }
  function listTitle(course) {
    const match = course.match(/^([A-Za-z][A-Za-z &]{0,15})\s*(\d{3,4}[A-Za-z]?)(?:[- ]\d{3})?$/);
    return match ? `${match[1].trim().toUpperCase()} ${match[2].toUpperCase()}` : course;
  }
  function listKey(title) { return String(title).trim().toLowerCase().replace(/[\s_-]+/g, ""); }
  function matchingList(title) {
    const matches = (window.Tidy.state.lists || []).filter(list => listKey(list.title) === listKey(title));
    return matches.length === 1 ? matches[0] : null;
  }
  // ---- List picker: searchable list chooser with inline "create new list" ----
  // Returns the same "__create__" sentinel the import flow already understands,
  // plus the (editable) name for the list to be created on confirm.
  const LIST_NAME_MAX = 30; // matches the list-name limit used in the Coursewise list dialog
  let listPickerCount = 0;
  const pickerIcon = {
    check: '<svg class="cw-list-picker-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
  };
  function listPicker({ label, lists, suggested, value, newName, onChange }) {
    const uid = `cw-lp-${++listPickerCount}`;
    let current = value || "";
    let created = newName || suggested || "";
    const matchFor = name => lists.find(list => listKey(list.title) === listKey(name));

    const wrap = element("div", "", "cw-list-picker");
    const caption = element("span", label, "cw-list-picker-label");
    caption.id = `${uid}-label`;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cw-list-picker-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-labelledby", `${uid}-label ${uid}-value`);
    const valueBox = element("span", "", "cw-list-picker-value");
    valueBox.id = `${uid}-value`;
    trigger.appendChild(valueBox);
    trigger.insertAdjacentHTML("beforeend", pickerIcon.down);

    const menu = element("div", "", "cw-list-picker-menu");
    menu.hidden = true;

    let search = null;
    if (lists.length > 7) {
      search = document.createElement("input");
      search.type = "search";
      search.className = "cw-list-picker-search";
      search.placeholder = "Search lists…";
      search.setAttribute("aria-label", "Search lists");
      menu.appendChild(search);
    }

    const listbox = element("div", "", "cw-list-picker-options");
    listbox.setAttribute("role", "listbox");
    listbox.setAttribute("aria-labelledby", `${uid}-label`);
    menu.appendChild(listbox);

    // Footer: create a new list with an editable name.
    const footer = element("div", "", "cw-list-picker-create");
    footer.appendChild(element("span", "Create a new list", "cw-list-picker-create-label"));
    const row = element("div", "", "cw-list-picker-create-row");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "cw-list-picker-input";
    input.maxLength = LIST_NAME_MAX;
    input.placeholder = "New list name";
    input.setAttribute("aria-label", "New list name");
    // Pre-fill with the suggestion unless a list with that name already exists.
    input.value = current === "__create__" || !matchFor(created) ? created : "";
    const addButton = element("button", "Create", "btn btn-secondary");
    addButton.type = "button";
    row.append(input, addButton);
    const error = element("p", "", "cw-list-picker-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    footer.append(row, error);
    menu.appendChild(footer);

    wrap.append(caption, trigger, menu);

    function renderTrigger() {
      valueBox.replaceChildren();
      if (current === "__create__") {
        valueBox.append(element("span", created, "cw-list-picker-name"), element("span", "New", "cw-list-picker-new"));
      } else {
        const list = current && lists.find(l => String(l.id) === String(current));
        valueBox.appendChild(element("span", list ? list.title : "No list", `cw-list-picker-name${list ? "" : " is-empty"}`));
      }
    }

    function option(text, val, selected, extra) {
      const button = document.createElement("button");
      button.type = "button";
      button.tabIndex = -1;
      button.className = "cw-list-picker-option";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(selected));
      button.dataset.value = val;
      button.insertAdjacentHTML("beforeend", pickerIcon.check);
      button.appendChild(element("span", text, "cw-list-picker-option-text"));
      if (extra) button.appendChild(extra);
      button.addEventListener("click", () => choose(val));
      return button;
    }

    function renderOptions() {
      const query = search ? search.value.trim().toLowerCase() : "";
      listbox.replaceChildren();
      listbox.appendChild(option("No list", "", current === ""));
      if (current === "__create__") listbox.appendChild(option(created, "__create__", true, element("span", "New", "cw-list-picker-new")));
      const shown = lists.filter(list => !query || list.title.toLowerCase().includes(query));
      for (const list of shown) listbox.appendChild(option(list.title, String(list.id), String(list.id) === String(current)));
      if (query && !shown.length) listbox.appendChild(element("div", "No matching lists. Create one below.", "cw-list-picker-empty"));
    }

    function choose(val) {
      current = val;
      onChange(current, created);
      renderTrigger();
      close(true);
    }

    function showError(text, useExisting) {
      error.replaceChildren(element("span", text));
      if (useExisting) {
        const use = element("button", "Use existing list");
        use.type = "button";
        use.addEventListener("click", () => choose(String(useExisting.id)));
        error.appendChild(use);
      }
      error.hidden = false;
    }

    function createList() {
      const name = input.value.replace(/\s+/g, " ").trim().slice(0, LIST_NAME_MAX);
      if (!name) { showError("Enter a name for the new list."); input.focus(); return; }
      const existing = matchFor(name);
      if (existing) { showError(`“${existing.title}” already exists.`, existing); return; }
      created = name;
      input.value = name;
      choose("__create__");
    }
    addButton.addEventListener("click", createList);
    input.addEventListener("input", () => { error.hidden = true; });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); createList(); }
    });
    if (search) search.addEventListener("input", renderOptions);

    function outsideClick(event) { if (!wrap.contains(event.target)) close(false); }
    function open() {
      renderOptions();
      error.hidden = true;
      menu.classList.remove("is-up");
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      // Flip upward if there isn't room below.
      const rect = menu.getBoundingClientRect();
      const triggerTop = trigger.getBoundingClientRect().top;
      if (rect.bottom > window.innerHeight - 8 && triggerTop > rect.height + 16) menu.classList.add("is-up");
      document.addEventListener("pointerdown", outsideClick, true);
      (listbox.querySelector('[aria-selected="true"]') || listbox.firstElementChild)?.focus();
    }
    function close(returnFocus) {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("pointerdown", outsideClick, true);
      if (search) search.value = "";
      if (returnFocus) trigger.focus();
    }

    trigger.addEventListener("click", () => (menu.hidden ? open() : close(false)));
    trigger.addEventListener("keydown", event => {
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && menu.hidden) { event.preventDefault(); open(); }
    });
    menu.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...listbox.querySelectorAll('[role="option"]')];
      if (!items.length) return;
      const at = items.indexOf(document.activeElement);
      // From the search box, ArrowDown enters the list.
      if (document.activeElement === search) { if (event.key === "ArrowDown") { event.preventDefault(); items[0].focus(); } return; }
      if (at === -1) return;
      event.preventDefault();
      const next = event.key === "ArrowDown" ? Math.min(at + 1, items.length - 1) : at - 1;
      if (next < 0) (search || trigger).focus(); else items[next].focus();
    });
    wrap.addEventListener("focusout", event => {
      if (!menu.hidden && event.relatedTarget && !wrap.contains(event.relatedTarget)) close(false);
    });

    renderTrigger();
    return wrap;
  }
  function eventKey(event) { return JSON.stringify([event.uid, event.title, event.due, event.type || event.eventType || event.kind]); }
  function calendarDay(event) {
    if (!event.due) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(event.due)) return event.due;
    const date = new Date(event.due);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
  function defaultSkip(event) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const day = calendarDay(event);
    if (day && day < today) return "Dated before today. Include it if you still need to finish it.";
    if (/^event-calendar-event-/.test(event.uid || "")) return "Calendar event rather than a Canvas assignment.";
    return "";
  }
  function readableDate(event) {
    const raw = event.due;
    if (!raw) return "No date provided";
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const date = new Date(dateOnly ? `${raw}T12:00:00Z` : raw);
    if (Number.isNaN(date.getTime())) return "Check date in Canvas";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Denver", month: "short", day: "numeric",
      ...(dateOnly || event.hasTime === false ? {} : {hour: "numeric", minute: "2-digit"})
    }).format(date);
  }
  function setCanvasWorking(section, value) {
    canvasWorking = value;
    for (const selector of ["#cw-preview-button", "#cw-disconnect"]) {
      const button = section.querySelector(selector);
      if (button) {
        button.disabled = value;
        if (selector === "#cw-preview-button") button.hidden = value;
      }
    }
  }

  // Both review paths end in the same editable course preview.
  function renderPreview(section, events, imported, review = { mode: "manual" }) {
    const container = section.querySelector("#cw-canvas-preview");
    container.replaceChildren();
    clearUnavailableLists();
    const fresh = events.filter(event => !imported.has(event.uid));
    reviewFresh = fresh;
    const hasHistory = imported.size > 0 || fresh.some(e => editedSelections.has(e.uid));
    if (review.canGoBack && fresh.length) {
      const back = element("button", "", "btn btn-outline cw-back");
      back.type = "button";
      back.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>');
      back.append("Back");
      back.addEventListener("click", async () => { await flushSave(); showReviewChoice(section, events, imported, {force: true}); });
      container.appendChild(back);
    }
    const heading = element("h3", "Review your import");
    const description = element("p", "Choose what to bring into Coursewise. Nothing is imported until you confirm.", "muted");
    container.append(heading, description);
    if (review.upToDate) {
      const notice = element("div", "", "cw-saved-status");
      notice.setAttribute("role", "status");
      notice.insertAdjacentHTML("beforeend", '<span class="cw-saved-status-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg></span>');
      const copy = element("div", "");
      copy.append(element("strong", "You’re up to date"), element("p", "Nothing new since your last check. Your earlier choices are saved."));
      notice.appendChild(copy);
      container.prepend(notice);
    }
    if (review.error) {
      const warning = element("div", "");
      activity(warning, "error", "AI review paused", `${review.reviewed} of ${review.total ?? fresh.length} items reviewed. ${review.error} You can finish your selections and import now.`);
      container.appendChild(warning);
      const retry = element("button", "Retry remaining AI review", "btn btn-outline");
      retry.type = "button";
      retry.addEventListener("click", () => reviewWithAI(section, events, imported));
      container.appendChild(retry);
    } else if (review.mode === "ai") {
      container.appendChild(element("p", "AI review complete. Check the suggestions before importing.", "cw-review-note"));
    }
    if (!fresh.length) {
      container.appendChild(element("p", "You’re up to date. There are no new items to import.", "cw-review-note"));
      return;
    }

    const groups = new Map();
    for (const event of fresh) {
      const course = courseOf(event);
      if (!groups.has(course)) groups.set(course, []);
      groups.get(course).push(event);
      // Never overwrite an explicit checkbox change, including when retrying AI.
      if (!editedSelections.has(event.uid)) {
        const suggestion = reviewCache.get(eventKey(event));
        getChoice(event).selected = !(defaultSkip(event) || (review.mode === "ai" && suggestion?.reason));
      }
    }
    const count = element("p", "", "cw-import-count");
    const saveNote = element("p", "", "cw-save-status");
    saveNote.setAttribute("aria-live", "polite");
    saveStatusEl = saveNote;
    const countRow = element("div", "", "cw-import-count-row");
    countRow.append(count, saveNote);
    container.appendChild(countRow);
    const courseArea = element("div", "", "cw-import-courses");
    container.appendChild(courseArea);
    const rowChecks = new Map();
    const groupCounts = new Map();
    const submit = element("button", "", "btn btn-primary");
    submit.type = "button";
    const selected = () => fresh.filter(event => getChoice(event).selected);
    function selectedCreates() {
      return [...new Set(selected().map(event => courseOf(event)))].filter(course => courseDestinations.get(course) === "__create__")
        .map(course => newListName(course)).filter((title, i, titles) => titles.findIndex(t => listKey(t) === listKey(title)) === i);
    }
    function refresh() {
      const n = selected().length;
      count.textContent = `${n} assignment${n === 1 ? "" : "s"} selected`;
      const creates = selectedCreates().length;
      submit.textContent = creates ? `Create ${creates} list${creates === 1 ? "" : "s"} & import ${n} item${n === 1 ? "" : "s"}` : `Import ${n} item${n === 1 ? "" : "s"}`;
      submit.disabled = !n || canvasWorking;
      for (const [uid, checkbox] of rowChecks) checkbox.checked = choices.get(uid).selected;
      for (const [course, label] of groupCounts) label.textContent = `${groups.get(course).filter(e => getChoice(e).selected).length} selected`;
    }
    for (const [course, items] of groups) {
      const title = listTitle(course);
      if (!courseDestinations.has(course)) {
        const previous = events.filter(e => courseOf(e) === course && getChoice(e).listId)
          .map(e => getChoice(e).listId).filter(id => window.Tidy.state.lists.some(l => String(l.id) === String(id)));
        const uniquePrevious = [...new Set(previous)];
        const match = matchingList(title);
        const ambiguous = window.Tidy.state.lists.filter(list => listKey(list.title) === listKey(title)).length > 1;
        courseDestinations.set(course, uniquePrevious.length === 1 ? uniquePrevious[0] : match ? String(match.id) : course === "Unsorted" || ambiguous ? "" : "__create__");
      }
      const target = courseDestinations.get(course);
      if (target && target !== "__create__" && !window.Tidy.state.lists.some(l => String(l.id) === target)) courseDestinations.set(course, "");
      const card = element("section", "", "cw-import-course");
      const header = element("div", "", "cw-import-course-head");
      header.appendChild(element("h4", title));
      const badge = element("span", "", "cw-status");
      groupCounts.set(course, badge);
      header.appendChild(badge);
      card.appendChild(header);
      card.appendChild(listPicker({
        label: "Import into",
        lists: window.Tidy.state.lists || [],
        suggested: course === "Unsorted" ? "" : title.slice(0, 30),
        value: courseDestinations.get(course),
        newName: courseNewNames.get(course) || (course === "Unsorted" ? "" : title.slice(0, 30)),
        onChange: (value, name) => {
          courseDestinations.set(course, value);
          if (value === "__create__") courseNewNames.set(course, name);
          queueSave();
          refresh();
        }
      }));
      const categoryPreference = coursePreferences.get(course) || {};
      const firstCategory = getChoice(items[0]).categoryId;
      card.appendChild(dropdown(
        "Category for this course",
        categoryOptionsForCourse(course),
        categoryPreference.categoryId !== undefined ? categoryPreference.categoryId : firstCategory,
        value => {
          const categoryId = value || null;
          coursePreferences.set(course, { ...(coursePreferences.get(course) || {}), categoryId });
          for (const event of items) {
            if (courseOf(event) === course) {
              getChoice(event).categoryId = categoryId;
              editedSelections.add(event.uid);
            }
          }
          queueSave();
          refresh();
        }
      ));
      const included = element("details", "", "cw-import-items");
      included.appendChild(element("summary", "Review assignments"));
      const skipped = element("details", "", "cw-import-items cw-import-skipped");
      const skipSummary = element("summary", "");
      skipped.appendChild(skipSummary);
      const leftOut = element("details", "", "cw-import-items cw-import-skipped cw-import-leftout");
      const leftOutSummary = element("summary", "");
      leftOut.appendChild(leftOutSummary);
      let skipCount = 0, leftOutCount = 0;
      for (const event of items) {
        const ai = review.mode === "ai" ? reviewCache.get(eventKey(event)) : null;
        const reason = defaultSkip(event) || ai?.reason || "";
        const touched = editedSelections.has(event.uid);
        const row = element("label", "", "cw-event-row");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = getChoice(event).selected;
        checkbox.addEventListener("change", () => {getChoice(event).selected = checkbox.checked; editedSelections.add(event.uid); queueSave(); refresh();});
        rowChecks.set(event.uid, checkbox);
        const copy = element("span", "", "cw-import-item-copy");
        const meta = element("span", "", "cw-import-item-meta");
        meta.appendChild(element("span", readableDate(event), "muted"));
        // Returning users: flag only what appeared since their last decisions.
        if (hasHistory && !touched) meta.appendChild(element("span", "New", "cw-list-picker-new"));
        copy.append(element("strong", (event.title || "Untitled").replace(/\s*\[[^\]]+\]\s*$/, "")), meta);
        if (reason) copy.appendChild(element("span", `${ai?.reason && !defaultSkip(event) ? "AI suggestion: " : ""}${reason}`, "cw-status"));
        row.append(checkbox, copy);
        // Things you've already unchecked stay out of the way, in their own folded section.
        if (touched && !getChoice(event).selected) { leftOut.appendChild(row); leftOutCount++; }
        else if (reason) { skipped.appendChild(row); skipCount++; }
        else included.appendChild(row);
      }
      if (included.children.length > 1) card.appendChild(included);
      if (skipCount) {skipSummary.textContent = `Suggested to leave out (${skipCount})`;card.appendChild(skipped);}
      if (leftOutCount) {leftOutSummary.textContent = `Left out by you (${leftOutCount})`;card.appendChild(leftOut);}
      courseArea.appendChild(card);
    }
    container.appendChild(element("p", "Canvas calendar feeds don’t show submission status. You can include older items or leave out work you’ve already finished.", "cw-import-hint"));
    container.appendChild(submit);
    if (imported.size) container.appendChild(element("p", `${imported.size} already-imported items are left unchanged.`, "cw-import-hint"));
    refresh();
    submit.addEventListener("click", async () => {
      if (canvasWorking || !selected().length) return;
      // Capture choices before replacing the review; create lists only on confirmation.
      const toImport = selected();
      const progress = element("div", "");
      container.replaceChildren(progress);
      setCanvasWorking(section, true);
      let importFinished = false;
      try {
        activity(progress, "loading", `Preparing ${toImport.length} assignments…`, "Setting up your chosen course lists.");
        await window.Tidy.reload();
        for (const course of new Set(toImport.map(courseOf))) {
          const destination = courseDestinations.get(course);
          if (destination === "__create__") {
            const title = newListName(course);
            // Refresh before creation and reuse lists created earlier in this import/retry.
            const existing = matchingList(title);
            const list = existing || await window.Tidy.addList(title);
            if (!list?.id) throw new Error("Could not prepare your course list. Please try again.");
            courseDestinations.set(course, String(list.id));
          } else if (destination && !window.Tidy.state.lists.some(l => String(l.id) === destination)) {
            throw new Error("A chosen list is no longer available. Choose another list or No list.");
          }
        }
        for (const event of fresh) getChoice(event).listId = courseDestinations.get(courseOf(event)) === "__create__" ? null : courseDestinations.get(courseOf(event)) || null;
        await resolveCourseCategorySuggestions(toImport);
        activity(progress, "loading", `Importing ${toImport.length} assignments…`, "Adding your selections to Coursewise. Keep this page open.");
        const result = await callFunction("canvas-import", {items: toImport.map(event => ({uid: event.uid, listId: getChoice(event).listId, categoryId: getChoice(event).categoryId || null}))});
        importFinished = true;
        for (const uid of result.clearedListUIDs || []) if (choices.has(uid)) choices.get(uid).listId = null;
        activity(progress, "loading", "Finishing up…", "Saving your choices and refreshing your tasks.");
        await callFunction("canvas-selections", {action: "save", items: fresh.map(event => ({uid: event.uid, selected: getChoice(event).selected, listId: getChoice(event).listId, categoryId: getChoice(event).categoryId || null}))});
        for (const e of fresh) editedSelections.add(e.uid);
        saveDirty = false;
        await window.Tidy.reload();
        const refreshed = await callFunction("canvas-selections", {action: "load"});
        imported.clear();
        for (const row of refreshed.imported || []) imported.set(row.CanvasUID, String(row.TaskID));
        if (canvasHistoryKey) try {localStorage.setItem(canvasHistoryKey, "1");} catch {}
        activity(progress, "complete", "Your assignments are ready", `${result.added ?? toImport.length} new assignments imported${result.skipped ? ` · ${result.skipped} existing or unavailable items skipped` : ""}.`);
        const tasks = element("a", "View tasks", "btn btn-primary");
        tasks.href = "todo.html";
        container.appendChild(tasks);
        message(section, "");
      } catch (error) {
        activity(progress, "error", importFinished ? "Imported, but saving choices needs attention" : "Import needs attention", `${error.message} Check your tasks before retrying; any lists already created will be reused.`);
        const back = element("button", "Back to review", "btn btn-outline");
        back.type = "button";
        back.addEventListener("click", async () => {
          back.disabled = true;
          try {
            const refreshed = await callFunction("canvas-selections", {action: "load"});
            imported.clear();
            for (const row of refreshed.imported || []) imported.set(row.CanvasUID, String(row.TaskID));
            renderPreview(section, events, imported, review);
          } catch {back.disabled = false;message(section, "Could not refresh imported items. Please check your tasks and try again.", true);}
        });
        container.appendChild(back);
      } finally {setCanvasWorking(section, false);}
    });
  }

  async function reviewWithAI(section, events, imported) {
    if (canvasWorking) return;
    const container = section.querySelector("#cw-canvas-preview");
    const card = element("div", "");
    const cancel = element("button", "Cancel", "btn btn-outline cw-ai-cancel");
    cancel.type = "button";
    container.replaceChildren(card, cancel);
    const run = ++aiRunId;
    setCanvasWorking(section, true);
    // Only items you haven't already sorted need AI attention.
    const scope = undecidedItems(events, imported);
    const pending = scope.filter(event => !reviewCache.has(eventKey(event)));
    let reviewed = scope.length - pending.length;
    let errorMessage = "";
    cancel.addEventListener("click", () => {
      // Results already received stay cached, so trying again later is cheap.
      aiRunId++;
      setCanvasWorking(section, false);
      showReviewChoice(section, events, imported);
    });
    try {
      for (let offset = 0; offset < pending.length; offset += 80) {
        if (!section.isConnected || run !== aiRunId) return;
        if (offset) {
          activity(card, "loading", "Preparing the next batch…", `${reviewed} of ${scope.length} items reviewed.`, reviewed, scope.length);
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
        if (!section.isConnected || run !== aiRunId) return;
        const batch = pending.slice(offset, offset + 80);
        activity(card, "loading", `Reviewing batch ${Math.floor(offset / 80) + 1} of ${Math.ceil(pending.length / 80)}…`, `${reviewed} of ${scope.length} items reviewed. Gemini is preparing your suggested import.`, reviewed, scope.length);
        const result = await callFunction("canvas-ai-suggestions", {items: batch.map((event, index) => ({index, title: event.title || "", eventType: event.type || event.eventType || event.kind || (/^event-calendar-event-/.test(event.uid || "") ? "calendar event" : /^event-assignment-/.test(event.uid || "") ? "assignment" : ""), due: event.due || ""}))});
        if (!Array.isArray(result?.suggestions)) throw new Error("Unexpected AI response.");
        const suggestions = new Map();
        for (const item of result.suggestions) if (item && Number.isInteger(item.index) && item.index >= 0 && item.index < batch.length && item.recommendSkip === true && typeof item.reason === "string") suggestions.set(item.index, item.reason.slice(0, 140));
        batch.forEach((event, index) => reviewCache.set(eventKey(event), {reason: suggestions.get(index) || ""}));
        reviewed += batch.length;
      }
    } catch (error) {
      errorMessage = error.message === "AI_SUGGESTION_LIMIT" ? "Gemini’s usage limit was reached. Try again later or continue below." : "AI review is unavailable right now.";
    } finally {
      // A cancelled run must not touch the state of a newer one.
      if (run === aiRunId) setCanvasWorking(section, false);
    }
    if (section.isConnected && run === aiRunId) renderPreview(section, events, imported, {mode: "ai", reviewed, total: scope.length, error: errorMessage, canGoBack: true});
  }

  function showReviewChoice(section, events, imported, options = {}) {
    const container = section.querySelector("#cw-canvas-preview");
    container.replaceChildren();
    const fresh = events.filter(event => !imported.has(event.uid));
    if (!fresh.length) {renderPreview(section, events, imported);return;}
    // Items you've already sorted don't count as "new", and don't get re-reviewed.
    const newItems = undecidedItems(events, imported);
    const sorted = fresh.length - newItems.length;
    if (!newItems.length && !options.force) {
      renderPreview(section, events, imported, {mode: "manual", upToDate: true});
      return;
    }
    const heading = newItems.length ? `${newItems.length} new item${newItems.length === 1 ? "" : "s"}` : "Everything is sorted";
    const note = newItems.length
      ? (sorted ? `Review before importing. ${sorted} you’ve already sorted ${sorted === 1 ? "is" : "are"} saved and won’t be asked about again.` : "Review before importing.")
      : `Your choices for all ${fresh.length} items are saved.`;
    container.append(element("h3", heading), element("p", note, "muted"));
    const actions = element("div", "", "cw-review-options");
    const manual = element("button", newItems.length ? "Review manually" : "Review my choices", newItems.length ? "btn btn-outline" : "btn btn-primary");
    manual.type = "button";
    manual.addEventListener("click", () => renderPreview(section, events, imported, {mode: "manual", canGoBack: true}));
    if (newItems.length) {
      const ai = element("button", "Review with AI", "btn btn-primary");
      ai.type = "button";
      ai.addEventListener("click", () => reviewWithAI(section, events, imported));
      actions.append(ai);
    }
    actions.append(manual);
    container.appendChild(actions);
    if (newItems.length) {
      const help = element("details", "", "cw-review-help");
      help.append(element("summary", "About AI review"), element("p", "Gemini reviews titles, event types and dates to suggest what to leave out. You choose what gets imported.", "cw-import-hint"));
      container.appendChild(help);
    }
  }

  async function previewCanvas(section) {
    const button =
      section.querySelector("#cw-preview-button");

    if (button.disabled || canvasWorking) return;
    setCanvasWorking(section, true);
    // The activity card is the only loading indicator; hide the preview button.
    button.hidden = true;
    const loadingCard = element("div", "");
    section.querySelector("#cw-canvas-preview").replaceChildren(loadingCard);
    activity(loadingCard, "loading", "Loading assignments…", "");
    message(section, "");

    try {
      console.time("Canvas parallel fetch");

      const [result, savedResult] = await Promise.all([
        callFunction("canvas-preview", {}),
        callFunction("canvas-selections", { action: "load" })
      ]);

      console.timeEnd("Canvas parallel fetch");

      if (!section.isConnected) return;

      const events = result.events || [];

      if (!Array.isArray(events)) {
        throw new Error("Unexpected Canvas response.");
      }


      // Update deadlines for all previously imported Canvas assignments.
      // This intentionally does NOT import new items or change their tags.
      if ((savedResult.imported || []).length) {
        activity(loadingCard, "loading", "Updating assignment dates…", "");
        const dateSync = await callFunction("canvas-import", {
          action: "sync-dates",
          items: []
        });
        if (dateSync.datesUpdated > 0) {
          await window.Tidy.reload();
        }
      }


      console.time("Canvas selections processing");

      const imported = await loadSelections(events, savedResult);

      console.timeEnd("Canvas selections processing");

      previewData = { events, imported };

      // Import history is based on server-saved rows, not just visible tasks.
      // The per-user browser flag also survives deleting every assignment.
      const { data: authData } = await client.auth.getUser();
      canvasHistoryKey = authData?.user?.id
        ? `coursewise-canvas-imported-${authData.user.id}` : null;
      let hadEarlierImport = Boolean(
        (savedResult.imported || []).length ||
        (savedResult.choices || []).length
      );
      if (canvasHistoryKey) {
        try { hadEarlierImport ||= localStorage.getItem(canvasHistoryKey) === "1"; }
        catch { /* Browser storage might be unavailable. */ }
      }

      console.time("Canvas rendering");

      showReviewChoice(section, events, imported);

      console.timeEnd("Canvas rendering");


      message(section, "");

    } catch (error) {
      message(section, error.message, true);
    } finally {
      setCanvasWorking(section, false);
      if (button.isConnected) {
        button.disabled = false;
        buttonLoading(button, false, "Check again");
      }
      loadingCard.remove();
    }
  }

  function showInterface(section) {
    const content =
      section.querySelector("#cw-canvas-content");

    if (!content) return;

    if (connected) {
      content.innerHTML = `
        <div class="cw-canvas-identity">
          <span class="cw-canvas-symbol" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="22" height="21" rx="5"/><path d="M11 4v6m10-6v6M5 14h22m-16 6 3 3 7-6"/></svg></span>
          <div class="cw-canvas-identity-copy"><strong>Course calendar</strong><span><i class="cw-status-dot" aria-hidden="true"></i>Connected</span></div>
        </div>
        <div class="cw-canvas-controls">
        <div class="cw-canvas-actions">
          <button type="button" id="cw-preview-button" class="btn btn-primary">Check for updates</button>
        </div>
        <div id="cw-canvas-preview" style="margin-top:20px"></div>
        <div class="cw-canvas-footer"><button type="button" id="cw-disconnect" class="btn btn-outline">Disconnect</button></div>
        </div>
      `;

      content.querySelector("#cw-preview-button")
        .addEventListener(
          "click",
          () => previewCanvas(section)
        );

      const disconnect =
        content.querySelector("#cw-disconnect");

      disconnect.addEventListener("click", async () => {
        if (!confirm("Disconnect your Canvas calendar?")) {
          return;
        }

        disconnect.disabled = true;

        try {
          await callCanvas("disconnect");
          connected = false;
          choices.clear();
          coursePreferences.clear();
          reviewCache.clear();
          editedSelections.clear();
          courseDestinations.clear();
          courseNewNames.clear();
          saveDirty = false;
          previewData = null;
          showInterface(section);
          message(section, "Canvas disconnected.");
        } catch (error) {
          message(section, error.message, true);
          disconnect.disabled = false;
        }
      });

    } else {
      content.innerHTML = `
        <p class="muted">
          Import your Canvas assignments into CourseWise.
        </p>
        <form id="cw-canvas-form" class="form">
          <div class="field">
            <label for="cw-canvas-url">
              Canvas Calendar Feed URL
            </label>
            <input
              type="url"
              id="cw-canvas-url"
              placeholder="https://your-school.instructure.com/feeds/calendars/..."
              required
              autocomplete="off"
              spellcheck="false"
            >
            <small>
              In Canvas, select Calendar → Calendar Feed.
              Keep your URL private.
            </small>
          </div>
          <button type="submit" class="btn btn-primary">
            Connect Canvas
          </button>
        </form>
      `;

      window.mountCanvasGuide?.(content);

      const form =
        content.querySelector("#cw-canvas-form");

      form.addEventListener("submit", async event => {
        event.preventDefault();

        const button = form.querySelector("button");
        const input = form.querySelector("#cw-canvas-url");

        button.disabled = true;
        message(section, "Connecting to Canvas...");

        try {
          await callCanvas("connect", input.value.trim());
          input.value = "";
          connected = true;
          choices.clear();
          coursePreferences.clear();
          reviewCache.clear();
          editedSelections.clear();
          courseDestinations.clear();
          courseNewNames.clear();
          saveDirty = false;
          showInterface(section);
          message(
            section,
            "Canvas connected successfully!"
          );
          await previewCanvas(section);
        } catch (error) {
          message(section, error.message, true);
          button.disabled = false;
        }
      });
    }
  }

  async function initializeCanvas(section) {
    if (section.dataset.canvasInitialized === "true") {
      return;
    }

    section.dataset.canvasInitialized = "true";
    currentSection = section;

    section.innerHTML = `
      <div class="section-head">
        <h2>Canvas</h2>
      </div>
      <div id="cw-canvas-content">
        <p class="muted">Checking Canvas connection...</p>
      </div>
      <p id="cw-canvas-message"
        role="status"
        aria-live="polite"
        style="margin-top:12px"></p>
    `;

    try {
      const result = await callCanvas("status");

      if (!section.isConnected) return;

      connected = Boolean(result.connected);
      showInterface(section);

    } catch (error) {
      if (!section.isConnected) return;

      const content =
        section.querySelector("#cw-canvas-content");

      content.innerHTML = `
        <p class="muted">
          Could not load Canvas connection status.
        </p>
        <button type="button"
                id="cw-retry"
                class="btn btn-outline">
          Try Again
        </button>
      `;

      content.querySelector("#cw-retry")
        .addEventListener("click", () => {
          delete section.dataset.canvasInitialized;
          initializeCanvas(section);
        });

      message(section, error.message, true);
    }
  }

  function checkForCanvas() {
    const section =
      document.getElementById("canvas");

    if (section) {
      initializeCanvas(section);
    }
  }

  const observer = new MutationObserver(checkForCanvas);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  checkForCanvas();

})();
