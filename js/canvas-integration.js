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

  const style = document.createElement("style");
  style.textContent = `
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
            : stored?.CategoryID == null ? null : String(stored.CategoryID)
        });
      }
    }

    return imported;
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

  function renderPreview(section, events, imported, showNewPopup = false) {
    const container =
      section.querySelector("#cw-canvas-preview");

    container.replaceChildren();

    container.appendChild(element(
      "h3",
      `Canvas Calendar Preview (${events.length} items)`
    ));

    container.appendChild(element(
      "p",
      "Select assignments and organize them by course.",
      "muted"
    ));

    if (!events.length) {
      container.appendChild(element(
        "p",
        "No calendar events were found."
      ));
      return;
    }

    const groups = new Map();

    for (const event of events) {
      const course = event.course || "Unsorted";

      if (!groups.has(course)) {
        groups.set(course, []);
      }

      groups.get(course).push(event);
    }

    const rows = new Map();
    const aiSuggestionGroups = [];
    const counter = element("p", "");
    container.appendChild(counter);

    function refreshCheckboxes() {
      let selected = 0;

      for (const event of events) {
        const checked = getChoice(event).selected;

        if (checked) selected++;

        const row = rows.get(event.uid);
        if (row?.checkbox) row.checkbox.checked = checked;
        if (row?.action) row.action.textContent = checked ? "Deselect" : "Keep selected";
      }

      for (const group of aiSuggestionGroups) {
        const remaining = group.events.filter(event => getChoice(event).selected).length;
        group.button.disabled = remaining === 0;
        group.button.textContent = remaining
          ? `Deselect ${remaining} item${remaining === 1 ? "" : "s"}`
          : "All deselected";
        group.button.setAttribute(
          "aria-label",
          remaining
            ? `Deselect ${remaining} selected ${remaining === 1 ? "item" : "items"}. Reason: ${group.reason}`
            : `All items deselected. Reason: ${group.reason}`
        );
      }

      counter.textContent =
        `${selected} of ${events.length} selected`;
    }

    const allButton = element(
      "button",
      "Select / Deselect All",
      "btn btn-outline"
    );
    allButton.type = "button";

    allButton.addEventListener("click", () => {
      const allSelected = events.every(
        event => getChoice(event).selected
      );

      for (const event of events) {
        getChoice(event).selected = !allSelected;
      }

      refreshCheckboxes();
    });

    container.appendChild(allButton);

    const newEvents = events.filter(event => !imported.has(event.uid));
    const aiControls = element("div", "", "cw-ai-controls");
    const aiButton = element("button", "Get AI suggestions", "btn btn-outline");
    aiButton.type = "button";
    aiButton.disabled = !newEvents.length;
    const aiDisclosure = element(
      "p",
      "Gemini reviews item titles, event types, and due dates only. It will not change selections or import items.",
      "muted cw-ai-disclosure"
    );
    if (newEvents.length > 80) {
      aiButton.disabled = true;
      aiDisclosure.textContent = "AI can review up to 80 new Canvas items at a time. You can still review and import them manually.";
    }
    aiControls.append(aiButton, aiDisclosure);
    container.appendChild(aiControls);
    const aiStatus = element("p", "", "cw-ai-status");
    aiStatus.setAttribute("role", "status");
    aiStatus.setAttribute("aria-live", "polite");
    container.appendChild(aiStatus);
    const aiSummary = element("section", "", "cw-ai-summary");
    aiSummary.hidden = true;
    aiSummary.setAttribute("aria-labelledby", "cw-ai-summary-title");
    const aiSummaryTitle = element("h3", "Suggestions to skip by reason");
    aiSummaryTitle.id = "cw-ai-summary-title";
    const aiSummaryIntro = element(
      "p",
      "Deselect a whole group by reason, or adjust items one at a time below. Nothing is imported until you confirm.",
      "cw-ai-summary-intro"
    );
    const aiReasonGroups = element("div", "", "cw-ai-reason-groups");
    const aiMassStatus = element("p", "", "cw-ai-mass-status");
    aiMassStatus.setAttribute("role", "status");
    aiMassStatus.setAttribute("aria-live", "polite");
    aiSummary.append(aiSummaryTitle, aiSummaryIntro, aiReasonGroups, aiMassStatus);
    container.appendChild(aiSummary);

    const state = window.Tidy?.state;

    const listOptions = [
      { value: "", label: "No list" },
      ...(state?.lists || []).map(item => ({
        value: String(item.id),
        label: item.title
      }))
    ];

    const categoryOptions = [
      { value: "", label: "No category" },
      ...(state?.categories || []).map(item => ({
        value: String(item.id),
        label: item.name
      }))
    ];

    for (const [course, courseEvents] of groups) {
      const details = document.createElement("details");
      details.className = "cw-course";

      const summary = element(
        "summary",
        `${course} (${courseEvents.length} items)`
      );
      details.appendChild(summary);

      const settings = document.createElement("div");
      settings.className = "cw-course-settings";

      // Use saved defaults, or infer from the first item.
      const pref = coursePreferences.get(course) || {};
      const first = getChoice(courseEvents[0]);

      settings.appendChild(dropdown(
        "List for this course",
        listOptions,
        pref.listId ?? first.listId,
        value => applyCoursePreference(
          course, "listId", value, events
        )
      ));

      settings.appendChild(dropdown(
        "Category for this course",
        categoryOptions,
        pref.categoryId ?? first.categoryId,
        value => applyCoursePreference(
          course, "categoryId", value, events
        )
      ));

      details.appendChild(settings);

      const groupButton = element(
        "button",
        "Select / Deselect Course",
        "btn btn-outline"
      );
      groupButton.type = "button";

      groupButton.addEventListener("click", () => {
        const allSelected = courseEvents.every(
          event => getChoice(event).selected
        );

        for (const event of courseEvents) {
          getChoice(event).selected = !allSelected;
        }

        refreshCheckboxes();
      });

      details.appendChild(groupButton);

      for (const event of courseEvents) {
        const entry = element("div", "", "cw-event-entry");
        const row = document.createElement("label");
        row.className = "cw-event-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = getChoice(event).selected;

        checkbox.addEventListener("change", () => {
          getChoice(event).selected = checkbox.checked;
          refreshCheckboxes();
        });

        const info = document.createElement("div");
        info.appendChild(element(
          "strong",
          event.title || "Untitled"
        ));

        info.appendChild(element(
          "div",
          event.due
            ? `Date: ${event.due}`
            : "No date available",
          "muted"
        ));

        let label = imported.has(event.uid)
          ? "Already imported"
          : "New";

        if (!getChoice(event).selected) {
          label += " · Unselected";
        }

        info.appendChild(element(
          "div",
          label,
          "cw-status"
        ));

        row.append(checkbox, info);

        const aiNote = element("div", "", "cw-ai-note");
        aiNote.hidden = true;
        const aiReason = element("p", "");
        const aiAction = element("button", "Deselect", "btn btn-outline");
        aiAction.type = "button";
        aiAction.addEventListener("click", () => {
          const choice = getChoice(event);
          choice.selected = !choice.selected;
          refreshCheckboxes();
        });
        aiNote.append(aiReason, aiAction);
        rows.set(event.uid, { checkbox, note: aiNote, reason: aiReason, action: aiAction });
        entry.append(row, aiNote);
        details.appendChild(entry);
      }

      container.appendChild(details);
    }

    refreshCheckboxes();

    const buttons = document.createElement("div");
    buttons.className = "cw-actions";

    const importButton = element(
      "button",
      "Import New Assignments",
      "btn btn-primary"
    );
    importButton.type = "button";

    const updateButton = element(
      "button",
      "Update Selections",
      "btn btn-outline"
    );
    updateButton.type = "button";

    buttons.append(importButton, updateButton);
    container.appendChild(buttons);

    const feedback = element("p", "");
    feedback.setAttribute("role", "status");
    container.appendChild(feedback);

    function selectedItems() {
      return events.map(event => {
        const choice = getChoice(event);

        return {
          uid: event.uid,
          selected: choice.selected,
          listId: choice.listId,
          categoryId: choice.categoryId
        };
      });
    }

    function busy(value) {
      importButton.disabled = value;
      updateButton.disabled = value;
    }

    let aiSuggestionsLoaded = false;
    aiButton.addEventListener("click", async () => {
      if (!newEvents.length || aiSuggestionsLoaded) return;
      aiButton.disabled = true;
      aiButton.textContent = "Checking items...";
      busy(true);
      aiStatus.dataset.state = "loading";
      aiStatus.textContent = `AI is reviewing ${newEvents.length} new item${newEvents.length === 1 ? "" : "s"}...`;
      aiSummary.hidden = true;
      aiReasonGroups.replaceChildren();
      aiMassStatus.textContent = "";
      aiSuggestionGroups.length = 0;
      try {
        const result = await callFunction("canvas-ai-suggestions", {
          items: newEvents.map(event => ({
            index: events.indexOf(event),
            title: event.title || "",
            eventType: event.type || event.eventType || event.kind || "",
            due: event.due || ""
          }))
        });
        const suggestions = Array.isArray(result.suggestions)
          ? result.suggestions : [];
        let shown = 0;
        const groupedSuggestions = new Map();
        for (const suggestion of suggestions) {
          const event = events[suggestion.index];
          if (!event || imported.has(event.uid) || suggestion.recommendSkip !== true) continue;
          const reason = String(suggestion.reason || "").trim();
          if (!reason) continue;
          const row = rows.get(event.uid);
          if (!row) continue;
          row.reason.textContent = suggestion.kind === "past_due"
            ? `Past due: ${reason}`
            : `AI suggests skipping: ${reason}`;
          row.note.hidden = false;
          const kind = suggestion.kind === "past_due" ? "past_due" : "ai";
          const key = `${kind}:${reason.toLocaleLowerCase()}`;
          if (!groupedSuggestions.has(key)) {
            groupedSuggestions.set(key, { kind, reason, events: [] });
          }
          groupedSuggestions.get(key).events.push(event);
          shown++;
        }

        for (const group of groupedSuggestions.values()) {
          const row = element("div", "", "cw-ai-reason-group");
          const copy = element("div", "", "cw-ai-reason-copy");
          copy.append(
            element("span", group.kind === "past_due" ? "Past due" : "AI suggestion", "cw-ai-reason-label"),
            element("span", group.reason, "cw-ai-reason-text")
          );
          const action = element("button", "", "btn btn-outline");
          action.type = "button";
          const trackedGroup = { ...group, button: action };
          action.addEventListener("click", () => {
            const selectedEvents = trackedGroup.events.filter(event => getChoice(event).selected);
            if (!selectedEvents.length) return;
            for (const event of selectedEvents) getChoice(event).selected = false;
            refreshCheckboxes();
            aiMassStatus.textContent = `Deselected ${selectedEvents.length} item${selectedEvents.length === 1 ? "" : "s"}. You can change individual selections below before importing.`;
          });
          aiSuggestionGroups.push(trackedGroup);
          row.append(copy, action);
          aiReasonGroups.appendChild(row);
        }
        aiSummary.hidden = aiSuggestionGroups.length === 0;
        refreshCheckboxes();

        aiSuggestionsLoaded = true;
        aiButton.textContent = "AI suggestions ready";
        aiButton.disabled = true;
        aiStatus.dataset.state = "complete";
        aiStatus.textContent = shown
          ? `AI review complete — ${shown} suggestion${shown === 1 ? "" : "s"}. Review them below; no items have been deselected or imported.`
          : "AI review complete — no items were flagged. This means none clearly matched the skip criteria; the AI check did run. You can still review every item yourself.";
      } catch (error) {
        aiStatus.dataset.state = "error";
        aiStatus.textContent = error.message === "AI_SUGGESTION_LIMIT"
          ? "Sorry, AI suggestions have reached their limit for this period. Please try again later."
          : error.message === "AI suggestions are not configured yet."
            ? "AI suggestions are not set up yet. Check the GEMINI_API_KEY secret and deploy the canvas-ai-suggestions function."
            : "AI review could not finish. You can still review and import Canvas items; check the Supabase function logs for details.";
        aiButton.textContent = "Try AI suggestions again";
        aiButton.disabled = false;
      } finally {
        busy(false);
      }
    });

    // Save checked/unchecked status, lists, and categories.
    async function saveSelections() {
        const items = selectedItems();

        const ids = items.map(item => item.uid);

        const duplicateCount = ids.length - new Set(ids).size;

        const invalidUIDs = items.filter(item =>
            typeof item.uid !== "string" ||
            !item.uid ||
            item.uid.length > 500
        ).length;

        const invalidLists = items.filter(item =>
        item.listId != null &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(item.listId))
        ).length;

        const invalidCategories = items.filter(item =>
            item.categoryId != null &&
            !/^\d+$/.test(String(item.categoryId))
        ).length;

        console.log(
            "Invalid list values:",
            [...new Set(
                items
                .filter(item =>
                    item.listId != null &&
                    !/^\d+$/.test(String(item.listId))
                )
                .map(item => String(item.listId))
            )]
        );

        console.table({
            total: items.length,
            duplicateUIDs: duplicateCount,
            invalidUIDs,
            invalidLists,
            invalidCategories
        });

        // Don't save anything if validation fails.
        if (
            duplicateCount ||
            invalidUIDs ||
            invalidLists ||
            invalidCategories
        ) {
            throw new Error(
            "Selection validation failed. Check the console."
            );
        }

        return callFunction("canvas-selections", {
            action: "save",
            items
        });
     }


    // Updates existing tasks and remembers new-item choices.
    updateButton.addEventListener("click", async () => {
      busy(true);
      feedback.textContent = "Saving selections...";

      try {
        const result = await saveSelections();

        await window.Tidy.reload();

        feedback.textContent =
          `Saved! ${result.updated} imported tasks updated.`;

        message(
          section,
          "Selections saved. Hidden assignments will not " +
          "appear on Home, To-do, or Calendar after reload."
        );

      } catch (error) {
        feedback.textContent = error.message;
        message(section, error.message, true);
      } finally {
        busy(false);
      }
    });

    // Shared import path: the original batch button and the new-item popup
    // both use the same database functions and save the selected categories.
    async function importNewItems(newItems, feedbackTarget) {
      busy(true);
      feedbackTarget.textContent = "Importing...";
      try {
        const result = await callFunction("canvas-import", {
          items: newItems.map(item => ({
            uid: item.uid,
            listId: item.listId,
            categoryId: item.categoryId
          }))
        });

        const refreshed = await callFunction("canvas-selections", {
          action: "load"
        });
        imported.clear();
        for (const row of refreshed.imported || []) {
          imported.set(row.CanvasUID, String(row.TaskID));
        }

        await saveSelections();
        await window.Tidy.reload();
        if (canvasHistoryKey) {
          try { localStorage.setItem(canvasHistoryKey, "1"); }
          catch { /* Private browsing can restrict local storage. */ }
        }
        feedbackTarget.textContent =
          `${result.added ?? newItems.length} new assignments imported!`;
        message(section, "Canvas assignments imported successfully.");
        return true;
      } catch (error) {
        feedbackTarget.textContent = error.message +
          " Refresh and check your task list before retrying.";
        message(section, error.message, true);
        return false;
      } finally {
        busy(false);
      }
    }

    // Existing first-import batch workflow remains unchanged.
    importButton.addEventListener("click", async () => {
      const newItems = selectedItems().filter(
        item => item.selected && !imported.has(item.uid)
      );
      if (!newItems.length) {
        feedback.textContent = "No new selected assignments to import. " +
          "Use Update Selections for existing tasks.";
        return;
      }
      if (!confirm(`Import ${newItems.length} new Canvas items?`)) return;
      if (await importNewItems(newItems, feedback)) {
        renderPreview(section, events, imported);
      }
    });

    if (showNewPopup) {
      const newEvents = events.filter(event =>
        !imported.has(event.uid) && getChoice(event).selected
      );
      if (newEvents.length) {
        const overlay = element("div", "", "cw-new-overlay");
        const modal = element("section", "", "cw-new-modal");
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", "New Canvas assignments");

        modal.appendChild(element("h3", "New Canvas assignments!"));
        modal.appendChild(element("p",
          `${newEvents.length} new item${newEvents.length === 1 ? "" : "s"} found. ` +
          "Choose a list and category for each one before importing.", "muted"));

        // Suggest the last-known organization of this same course when possible.
        for (const event of newEvents) {
          const choice = getChoice(event);
          const other = events.find(item =>
            item.uid !== event.uid &&
            imported.has(item.uid) &&
            item.course === event.course &&
            (getChoice(item).listId || getChoice(item).categoryId)
          );
          if (other) {
            const previous = getChoice(other);
            if (!choice.listId) choice.listId = previous.listId;
            if (!choice.categoryId) choice.categoryId = previous.categoryId;
          }

          const item = element("div", "", "cw-new-item");
          item.appendChild(element("strong", event.title || "Untitled assignment"));
          item.appendChild(element("div",
            [event.course || "Unsorted", event.due || "No due date"]
              .filter(Boolean).join(" · "), "cw-status"));
          const settings = element("div", "", "cw-course-settings");
          settings.appendChild(dropdown("List", listOptions,
            choice.listId, value => { choice.listId = value || null; }));
          settings.appendChild(dropdown("Category", categoryOptions,
            choice.categoryId, value => { choice.categoryId = value || null; }));
          item.appendChild(settings);
          modal.appendChild(item);
        }

        const popupFeedback = element("p", "");
        popupFeedback.setAttribute("role", "status");
        const actions = element("div", "", "cw-actions");
        const later = element("button", "Not now", "btn btn-outline");
        later.type = "button";
        const save = element("button", "Import assignments", "btn btn-primary");
        save.type = "button";
        actions.append(later, save);
        modal.append(popupFeedback, actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        later.addEventListener("click", close);
        save.addEventListener("click", async () => {
          save.disabled = true;
          later.disabled = true;
          const items = newEvents.map(event => ({
            uid: event.uid,
            selected: true,
            listId: getChoice(event).listId,
            categoryId: getChoice(event).categoryId
          }));
          const success = await importNewItems(items, popupFeedback);
          if (success) {
            close();
            renderPreview(section, events, imported);
          } else {
            save.disabled = false;
            later.disabled = false;
          }
        });
        overlay.addEventListener("click", event => {
          if (event.target === overlay) close();
        });
        later.focus();
      }
    }

  }

  async function previewCanvas(section) {
    const button =
      section.querySelector("#cw-preview-button");

    button.disabled = true;
    button.textContent = "Loading Canvas calendar...";
    message(section, "Reading Canvas calendar...");

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

      renderPreview(section, events, imported, hadEarlierImport);

      console.timeEnd("Canvas rendering");


      message(
        section,
        `Found ${events.length} calendar items.`
      );

    } catch (error) {
      message(section, error.message, true);
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = "Preview Assignments";      }
    }
  }

  function showInterface(section) {
    const content =
      section.querySelector("#cw-canvas-content");

    if (!content) return;

    if (connected) {
      content.innerHTML = `
        <div class="cw-connection-status">
          <span class="cw-status-dot" aria-hidden="true"></span>
          <span>Canvas connected</span>
        </div>

        <p class="muted">
          Preview and manage assignments from your Canvas calendar.
        </p>

        <button
          type="button"
          id="cw-preview-button"
          class="btn btn-primary"
        >
          Preview Assignments
        </button>

        <div id="cw-canvas-preview"
            style="margin-top:20px"></div>

        <div class="cw-disconnect-action">
          <button
            type="button"
            id="cw-disconnect"
            class="btn btn-outline"
          >
            Disconnect Canvas
          </button>
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
          showInterface(section);
          message(
            section,
            "Canvas connected successfully!"
          );
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
        <h2>Canvas Integration</h2>
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
