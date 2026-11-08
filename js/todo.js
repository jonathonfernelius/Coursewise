/* To-do page */
(() => {
  const T = Tidy, U = T.ui, root = document.getElementById("main");
  const collapsed = new Set(); let orderSaving = false, taskOrderSaving = false;
  const selected = new Set(); let selecting = false, deletingSelection = false, completingSelection = false;
  const sortSettings = new Map();
  let sortSettingsOwner = null;

  const sortModes = [
    ["manual", "Manual"],
    ["title", "Alphabetically"],
    ["due", "Due date"],
    ["created", "Recently added"],
    ["category", "Category"]
  ];
  function ensureSortSettings() {
    const owner = T.state.user.email || T.state.user.username || "default";
    if (owner === sortSettingsOwner) return;
    sortSettingsOwner = owner;
    sortSettings.clear();
    try {
      const saved = JSON.parse(localStorage.getItem(`cw-todo-sort-v1:${owner}`) || "{}");
      for (const [id, value] of Object.entries(saved)) {
        if (sortModes.some(([mode]) => mode === value?.mode)) {
          sortSettings.set(id, { mode: value.mode, direction: value.direction === "desc" ? "desc" : "asc" });
        }
      }
    } catch {}
  }
  function sortFor(listId) { return sortSettings.get(listId) || { mode: "manual", direction: "asc" }; }
  function saveSortSettings() {
    try { localStorage.setItem(`cw-todo-sort-v1:${sortSettingsOwner || "default"}`, JSON.stringify(Object.fromEntries(sortSettings))); } catch {}
  }
  function setSort(listId, value) { sortSettings.set(listId, value); saveSortSettings(); }
  function sortedTasks(tasks, listId) {
    const { mode, direction } = sortFor(listId);
    if (mode === "manual") return tasks;
    const sign = direction === "desc" ? -1 : 1;
    const compareText = (a, b) => String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
    return [...tasks].sort((a, b) => {
      let left, right;
      if (mode === "title") { left = a.title; right = b.title; }
      else if (mode === "due") { left = a.due; right = b.due; }
      else if (mode === "created") { left = a.createdAt; right = b.createdAt; }
      else { left = T.cat(a.categoryId)?.name; right = T.cat(b.categoryId)?.name; }
      const leftMissing = left == null || left === "", rightMissing = right == null || right === "";
      if (leftMissing !== rightMissing) return leftMissing ? (direction === "asc" ? 1 : -1) : (direction === "asc" ? -1 : 1);
      if (leftMissing) return (a.sortOrder - b.sortOrder) || a.id.localeCompare(b.id);
      return sign * (mode === "due" || mode === "created"
        ? String(left).localeCompare(String(right))
        : compareText(left, right)) || (a.sortOrder - b.sortOrder) || a.id.localeCompare(b.id);
    });
  }


  function exitSelection() { selecting = false; selected.clear(); render(); }
  function toggleSelected(id) {
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    selecting = true;
    updateSelectionUI();
  }
  function updateSelectionUI() {
    const count = selected.size;
    const bar = root.querySelector('#bulk-task-bar');
    if (bar) {
      bar.hidden = !selecting;
      bar.querySelector('#bulk-selected-count').textContent = `${count} ${count === 1 ? 'task' : 'tasks'} selected`;
      bar.querySelector('#bulk-delete').disabled = !count || deletingSelection || completingSelection;
      bar.querySelector('#bulk-done').disabled = !count || deletingSelection || completingSelection;
    }
    root.querySelector('#select-tasks')?.setAttribute('aria-pressed', String(selecting));
    root.querySelectorAll('.task[data-task-id]').forEach(row => {
      const checked = selected.has(row.dataset.taskId);
      row.classList.toggle('bulk-selected', selecting && checked);
      row.classList.toggle('bulk-selectable', selecting);
      row.setAttribute('draggable', String(!selecting && !!row.querySelector('[data-drag-task]')));
      row.querySelector('.bulk-checkbox')?.remove();
      if (selecting) {
        const indicator = document.createElement('span');
        indicator.className = 'bulk-checkbox';
        indicator.setAttribute('aria-hidden', 'true');
        indicator.textContent = checked ? '✓' : '';
        row.querySelector('.task-body')?.before(indicator);
      }
    });
  }

  function confirmBulkDelete() {
    const ids = [...selected];
    if (!ids.length || deletingSelection) return;
    const count = ids.length;
    const d = U.modal(`<form class="dialog-body"><h2>Delete ${count} ${count === 1 ? 'task' : 'tasks'}?</h2>
      <p class="muted">Only the selected tasks will be deleted. This cannot be undone.</p>
      <div class="dialog-actions"><button type="button" class="btn btn-outline" data-close>Cancel</button>
      <button class="btn btn-danger" type="submit">${U.icons.trash} Delete ${count} ${count === 1 ? 'task' : 'tasks'}</button></div></form>`);
    d.querySelector('form').onsubmit = e => {
      e.preventDefault();
      if (deletingSelection) return;
      deletingSelection = true;
      const button = d.querySelector('[type=submit]');
      button.disabled = true;
      (async () => {
        try {
          await T.deleteTasks(ids);
          d.close();
          selecting = false; selected.clear();
          U.toast(`${count} ${count === 1 ? 'task' : 'tasks'} deleted`);
          render();
        } catch (error) {
          U.toast(error.message || 'Could not delete tasks. Please try again.');
        } finally {
          deletingSelection = false;
          if (button.isConnected) button.disabled = false;
          updateSelectionUI();
        }
      })();
    };
  }


  async function markSelectedDone() {
    if (completingSelection || deletingSelection || !selected.size) return;
    const ids = [...selected];
    const pending = ids.filter(id => {
      const task = T.state.tasks.find(item => item.id === id);
      return task && !task.done;
    });
    if (!pending.length) {
      U.toast('Selected tasks are already complete');
      exitSelection();
      return;
    }
    completingSelection = true;
    updateSelectionUI();
    let completed = 0;
    try {
      // Use the existing completion action to preserve repeating-task behavior.
      for (const id of pending) {
        await T.toggleTask(id);
        completed++;
      }
      selected.clear(); selecting = false;
      U.toast(`${completed} ${completed === 1 ? 'task' : 'tasks'} marked as done`);
    } catch (error) {
      // Retain tasks that have not been processed so a retry won't toggle completed tasks off.
      selected.clear();
      pending.slice(completed).forEach(id => selected.add(id));
      U.toast(error.message || 'Some tasks could not be completed. Please retry.');
    } finally {
      completingSelection = false;
      render();
    }
  }


  function unassignedMarkup(S) {
    const listIds = new Set(S.lists.map(list => String(list.id)));
    const all = S.tasks.filter(task => task.listId == null || !listIds.has(String(task.listId)));
    if (!all.length && S.lists.length) return "";
    const items = all.filter(task => S.prefs.showDone || !task.done);
    const open = !collapsed.has("__unassigned__");
    return `<section class="card list-card" data-unassigned="true">
      <div class="list-head"><button class="list-toggle" data-collapse="__unassigned__" aria-expanded="${open}">${U.icons.down}<h2>Unassigned</h2><span class="count">${items.length}</span></button></div>
      ${open ? `<p class="muted" style="font-size:.8rem;margin:.2rem 0 .8rem">Tasks without a list. Use the pencil to organize them.</p>
        <div class="task-list">${items.length ? items.map(task => U.taskRow(task, { selectable: true })).join("") : `<p class="empty">${all.length ? 'Only completed tasks are here. Turn on Show completed to see them.' : 'Tasks imported without a list will appear here.'}</p>`}</div>` : ""}
    </section>`;
  }

  function render() {
    const S = T.state;
    ensureSortSettings();
    root.innerHTML = `<div class="container">
      <div class="page-head"><div><h1>To-do</h1><p>Drag the grips to reorder lists and tasks or move tasks between lists.</p></div>
        <div class="head-actions"><button class="btn btn-outline" type="button" id="show-completed" aria-pressed="${S.prefs.showDone}">${S.prefs.showDone ? 'Hide completed' : 'Show completed'}</button><button class="btn btn-outline" id="new-list">${U.icons.plus} New list</button>
        <button class="btn btn-outline" type="button" id="select-tasks" aria-pressed="${selecting}">${U.icons.check} ${selecting ? 'Done selecting' : 'Select tasks'}</button>
        <button class="btn btn-primary" id="add">${U.icons.plus} Add task</button></div></div>
      <div id="bulk-task-bar" class="bulk-task-bar" role="toolbar" aria-label="Selected task actions" ${selecting ? '' : 'hidden'}>
        <span id="bulk-selected-count" aria-live="polite">${selected.size} tasks selected</span>
        <div class="bulk-actions"><button type="button" class="btn btn-outline" id="bulk-select-all">Select all visible</button>
        <button type="button" class="btn btn-primary" id="bulk-done" ${selected.size ? '' : 'disabled'}>${U.icons.check} Mark as done</button>
        <button type="button" class="btn btn-danger" id="bulk-delete" ${selected.size ? '' : 'disabled'}>${U.icons.trash} Delete selected</button>
        <button type="button" class="btn btn-outline" id="bulk-cancel">Cancel</button></div>
      </div>
      <div class="lists">${S.lists.map(l => {
        const items = sortedTasks(S.tasks.filter(t => t.listId === l.id && (S.prefs.showDone || !t.done)), l.id), open = !collapsed.has(l.id);
        const sort = sortFor(l.id), directionLabel = sort.direction === "asc" ? "ascending" : "descending";
        return `<section class="card list-card" data-list-id="${T.esc(l.id)}"><div class="list-head">
          <button class="list-drag" draggable="true" data-drag-list="${T.esc(l.id)}" aria-label="Reorder ${T.esc(l.title)}" aria-keyshortcuts="ArrowUp ArrowDown" title="Drag to reorder; use arrow keys to move">${U.icons.grip}</button>
          <button class="list-toggle" data-collapse="${l.id}" aria-expanded="${open}">${U.icons.down}<h2>${T.esc(l.title)}</h2><span class="count">${items.length}</span></button>
          <div class="list-sort"><label class="sr-only" for="sort-${T.esc(l.id)}">Sort ${T.esc(l.title)} tasks</label>
            <select id="sort-${T.esc(l.id)}" data-sort-list="${T.esc(l.id)}" aria-label="Sort ${T.esc(l.title)} tasks">${sortModes.map(([value,label]) => `<option value="${value}"${sort.mode === value ? " selected" : ""}>${label}</option>`).join("")}</select>
            <button type="button" class="sort-direction" data-sort-direction="${T.esc(l.id)}" aria-label="Sort ${T.esc(l.title)} ${directionLabel}; switch to ${sort.direction === "asc" ? "descending" : "ascending"}" title="Switch to ${sort.direction === "asc" ? "descending" : "ascending"}"${sort.mode === "manual" ? " hidden" : ""}>${sort.direction === "asc" ? "↑" : "↓"}</button>
          </div>
          <button class="icon-btn" data-rename="${l.id}" aria-label="Rename ${T.esc(l.title)}">${U.icons.pencil}</button>
          <button class="icon-btn danger" data-delete="${l.id}" aria-label="Delete ${T.esc(l.title)}">${U.icons.trash}</button></div>
          ${open ? `<div class="task-list" data-task-list="${T.esc(l.id)}">${items.length ? items.map(t => U.taskRow(t, { draggable: true })).join("") : '<p class="empty">No tasks in this list.</p>'}</div>` : ""}</section>`;
      }).join("")}${unassignedMarkup(S)}</div></div>`;

    root.querySelector('#show-completed').onclick = e => U.run(async () => {
      await T.setPrefs({ showDone: !T.state.prefs.showDone });
      selected.clear(); selecting = false;
      render();
    }, e.currentTarget);
    document.getElementById("add").onclick = () => U.taskDialog({ done: render });
    root.querySelector('#select-tasks').onclick = () => selecting ? exitSelection() : (selecting = true, render());
    root.querySelector('#bulk-cancel').onclick = exitSelection;
    root.querySelector('#bulk-delete').onclick = confirmBulkDelete;
    root.querySelector('#bulk-done').onclick = markSelectedDone;
    root.querySelector('#bulk-select-all').onclick = () => {
      root.querySelectorAll('.task[data-task-id]').forEach(row => selected.add(row.dataset.taskId));
      updateSelectionUI();
    };
    updateSelectionUI();
    document.getElementById("new-list").onclick = () => nameDialog("New list", "", async v => { await T.addList(v); U.toast("List added"); render(); });
    root.querySelectorAll("[data-collapse]").forEach(b => b.onclick = () => { const id = b.dataset.collapse; collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); render(); });
    root.querySelectorAll("[data-sort-list]").forEach(select => select.onchange = () => {
      const current = sortFor(select.dataset.sortList);
      setSort(select.dataset.sortList, { mode: select.value, direction: select.value === current.mode ? current.direction : "asc" });
      render();
    });
    root.querySelectorAll("[data-sort-direction]").forEach(button => button.onclick = () => {
      const listId = button.dataset.sortDirection, current = sortFor(listId);
      if (current.mode === "manual") return;
      setSort(listId, { ...current, direction: current.direction === "asc" ? "desc" : "asc" });
      render();
    });
    root.querySelectorAll("[data-rename]").forEach(b => b.onclick = () => { const l = S.lists.find(x => x.id === b.dataset.rename); nameDialog("Rename list", l.title, async v => { await T.renameList(l.id, v); render(); }); });
    root.querySelectorAll("[data-delete]").forEach(b => b.onclick = () => {
      const l = S.lists.find(x => x.id === b.dataset.delete);
      const d = U.modal(`<div class="dialog-body"><h2>Delete “${T.esc(l.title)}”?</h2><p class="muted">Every task in this list will be removed.</p>
        <div class="dialog-actions"><button class="btn btn-primary" id="yes">Delete list</button><button class="btn btn-outline" data-close>Cancel</button></div></div>`);
      d.querySelector("#yes").onclick = e => U.run(async () => { await T.deleteList(l.id); d.close(); U.toast("List deleted"); render(); }, e.currentTarget);
    });
    const listContainer = root.querySelector(".lists");
    // Double-click once to enter selection mode; double-click again to exit.
    // Normal single clicks toggle selection only while the mode is active.
    listContainer.addEventListener('dblclick', e => {
      const row = e.target.closest('.task[data-task-id]');
      if (!row || e.target.closest('button, input, select, a, textarea')) return;
      e.preventDefault();
      e.stopPropagation();
      if (selecting) exitSelection();
      else { selecting = true; selected.add(row.dataset.taskId); updateSelectionUI(); }
    });
    listContainer.addEventListener('click', e => {
      if (!selecting) return;
      const row = e.target.closest('.task[data-task-id]');
      if (!row) return;
      e.preventDefault(); e.stopImmediatePropagation();
      toggleSelected(row.dataset.taskId);
    }, true);
    listContainer.addEventListener('keydown', e => {
      if (!selecting || !['Enter', ' '].includes(e.key)) return;
      const row = e.target.closest('.task[data-task-id]');
      if (!row) return;
      e.preventDefault(); e.stopImmediatePropagation(); toggleSelected(row.dataset.taskId);
    }, true);
    root.querySelectorAll('.task[data-task-id]').forEach(row => {
      row.setAttribute('tabindex', '0');
      row.setAttribute('title', 'Double-click to select multiple tasks');
    });
    let draggedId = null, initialOrder = [], dropped = false;
    listContainer.querySelectorAll("[data-drag-list]").forEach(handle => {
      handle.addEventListener("dragstart", e => {
        draggedId = handle.dataset.dragList;
        initialOrder = [...listContainer.querySelectorAll("[data-list-id]")].map(card => card.dataset.listId);
        dropped = false;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedId);
        handle.closest(".list-card").classList.add("is-dragging");
      });
      handle.addEventListener("keydown", e => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const ids = S.lists.map(list => list.id);
        const index = ids.indexOf(handle.dataset.dragList), next = index + (e.key === "ArrowUp" ? -1 : 1);
        if (next < 0 || next >= ids.length) return;
        [ids[index], ids[next]] = [ids[next], ids[index]];
        persistListOrder(ids);
      });
    });
    listContainer.addEventListener("dragover", e => {
      const target = e.target.closest(".list-card[data-list-id]");
      if (!draggedId || !target) return;
      e.preventDefault();
      const dragged = [...listContainer.querySelectorAll("[data-list-id]")].find(card => card.dataset.listId === draggedId);
      if (dragged === target) return;
      const bounds = target.getBoundingClientRect();
      listContainer.insertBefore(dragged, e.clientY > bounds.top + bounds.height / 2 ? target.nextSibling : target);
      e.dataTransfer.dropEffect = "move";
    });
    listContainer.addEventListener("drop", e => {
      if (!draggedId || !e.target.closest(".list-card[data-list-id]")) return;
      e.preventDefault();
      const ids = [...listContainer.querySelectorAll("[data-list-id]")].map(card => card.dataset.listId);
      dropped = true;
      if (ids.some((id, index) => id !== initialOrder[index])) persistListOrder(ids);
    });
    listContainer.addEventListener("dragend", e => {
      e.target.closest(".list-card")?.classList.remove("is-dragging");
      if (!dropped && draggedId) render();
      draggedId = null;
    });

    let draggedTaskId = null, draggedTaskSourceId = null, taskDropped = false;
    listContainer.addEventListener('dragstart', e => { if (selecting) e.preventDefault(); }, true);
    listContainer.querySelectorAll("[data-drag-task]").forEach(handle => {
      handle.closest(".task").addEventListener("dragstart", e => {
        if (taskOrderSaving) { e.preventDefault(); return; }
        if (e.target.closest("button:not(.task-drag), input, select, textarea, a, [contenteditable=true]")) {
          e.preventDefault(); return;
        }
        e.stopPropagation();
        const row = handle.closest(".task");
        draggedTaskId = row.dataset.taskId;
        draggedTaskSourceId = handle.closest(".list-card").dataset.listId;
        taskDropped = false;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedTaskId);
        row.classList.add("is-dragging");
      });
      handle.addEventListener("keydown", e => {
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();
        if (taskOrderSaving) return;
        moveTaskWithKeyboard(handle.dataset.dragTask, e.key);
      });
    });
    listContainer.addEventListener("dragover", e => {
      if (!draggedTaskId) return;
      const card = e.target.closest(".list-card[data-list-id]");
      if (!card) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      listContainer.querySelectorAll(".list-card.is-drop-target").forEach(el => el.classList.remove("is-drop-target"));
      listContainer.querySelectorAll(".task-drop-before, .task-drop-after").forEach(el => el.classList.remove("task-drop-before", "task-drop-after"));
      listContainer.querySelectorAll(".task-list.is-drop-end").forEach(el => el.classList.remove("is-drop-end"));
      card.classList.add("is-drop-target");
      const target = e.target.closest(".task[data-task-id]");
      if (target && target.dataset.taskId !== draggedTaskId) {
        const bounds = target.getBoundingClientRect();
        target.classList.add(e.clientY > bounds.top + bounds.height / 2 ? "task-drop-after" : "task-drop-before");
      } else if (!target) card.querySelector(".task-list")?.classList.add("is-drop-end");
    });
    listContainer.addEventListener("drop", e => {
      if (!draggedTaskId) return;
      const card = e.target.closest(".list-card[data-list-id]");
      if (!card) return;
      e.preventDefault();
      taskDropped = true;
      const targetListId = card.dataset.listId;
      const target = e.target.closest(".task[data-task-id]");
      if (target?.dataset.taskId === draggedTaskId) return;
      const targetVisible = [...card.querySelectorAll(".task[data-task-id]")]
        .map(row => row.dataset.taskId)
        .filter(id => id !== draggedTaskId);
      if (target && target.dataset.taskId !== draggedTaskId) {
        const index = targetVisible.indexOf(target.dataset.taskId);
        const after = e.clientY > target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
        targetVisible.splice(index + (after ? 1 : 0), 0, draggedTaskId);
      } else targetVisible.push(draggedTaskId);
      const targetIds = withHiddenTasks(targetListId, targetVisible, draggedTaskId);
      const sourceCard = [...listContainer.querySelectorAll(".list-card")]
        .find(item => item.dataset.listId === draggedTaskSourceId);
      const sourceIds = targetListId === draggedTaskSourceId ? [] : withHiddenTasks(
        draggedTaskSourceId,
        [...sourceCard.querySelectorAll(".task[data-task-id]")]
          .map(row => row.dataset.taskId).filter(id => id !== draggedTaskId),
        draggedTaskId
      );
      const oldTargetIds = T.state.tasks.filter(task => task.listId === targetListId).map(task => task.id);
      if (targetListId !== draggedTaskSourceId || targetIds.some((id, index) => id !== oldTargetIds[index])) {
        setSort(targetListId, { mode: "manual", direction: "asc" });
        if (targetListId !== draggedTaskSourceId) setSort(draggedTaskSourceId, { mode: "manual", direction: "asc" });
        persistTaskOrder(draggedTaskId, targetListId, targetIds, sourceIds);
      }
    });
    listContainer.addEventListener("dragend", e => {
      if (!draggedTaskId) return;
      e.target.closest(".task")?.classList.remove("is-dragging");
      listContainer.querySelectorAll(".list-card.is-drop-target").forEach(el => el.classList.remove("is-drop-target"));
      listContainer.querySelectorAll(".task-drop-before, .task-drop-after").forEach(el => el.classList.remove("task-drop-before", "task-drop-after"));
      listContainer.querySelectorAll(".task-list.is-drop-end").forEach(el => el.classList.remove("is-drop-end"));
      if (!taskDropped) render();
      draggedTaskId = null;
      draggedTaskSourceId = null;
    });
  }

  function withHiddenTasks(listId, visibleIds, movedId) {
    const existing = T.state.tasks.filter(task => task.listId === listId && task.id !== movedId);
    let visibleIndex = 0;
    const ordered = [];
    for (const task of existing) {
      if (!T.state.prefs.showDone && task.done) ordered.push(task.id);
      else if (visibleIndex < visibleIds.length) ordered.push(visibleIds[visibleIndex++]);
    }
    ordered.push(...visibleIds.slice(visibleIndex));
    return ordered;
  }

  function moveTaskWithKeyboard(taskId, key) {
    const task = T.state.tasks.find(item => item.id === taskId);
    if (!task) return;
    const listIds = T.state.lists.map(list => list.id), listIndex = listIds.indexOf(task.listId);
    if (key === "ArrowLeft" || key === "ArrowRight") {
      const nextListId = listIds[listIndex + (key === "ArrowLeft" ? -1 : 1)];
      if (!nextListId) return;
      const targetIds = withHiddenTasks(nextListId, [
        ...visibleIdsForList(nextListId),
        taskId
      ], taskId);
      const sourceIds = withHiddenTasks(task.listId, visibleIdsForList(task.listId).filter(id => id !== taskId), taskId);
      setSort(task.listId, { mode: "manual", direction: "asc" });
      setSort(nextListId, { mode: "manual", direction: "asc" });
      persistTaskOrder(taskId, nextListId, targetIds, sourceIds, true);
      return;
    }
    const visibleIds = visibleIdsForList(task.listId);
    const index = visibleIds.indexOf(taskId), next = index + (key === "ArrowUp" ? -1 : 1);
    if (next < 0 || next >= visibleIds.length) return;
    [visibleIds[index], visibleIds[next]] = [visibleIds[next], visibleIds[index]];
    setSort(task.listId, { mode: "manual", direction: "asc" });
    persistTaskOrder(taskId, task.listId, withHiddenTasks(task.listId, visibleIds, null), [], true);
  }

  function visibleIdsForList(listId) {
    const card = [...root.querySelectorAll(".list-card")].find(item => item.dataset.listId === listId);
    const rows = card?.querySelectorAll(".task-list .task[data-task-id]");
    if (rows) return [...rows].map(row => row.dataset.taskId);
    return sortedTasks(T.state.tasks.filter(item => item.listId === listId && (T.state.prefs.showDone || !item.done)), listId).map(item => item.id);
  }

  function persistTaskOrder(taskId, targetListId, targetIds, sourceIds, restoreFocus = false) {
    if (taskOrderSaving) return;
    taskOrderSaving = true;
    U.run(async () => {
      try { await T.reorderTasks(taskId, targetListId, targetIds, sourceIds); }
      catch (error) { render(); if (restoreFocus) focusTaskHandle(taskId); throw error; }
      render();
      if (restoreFocus) focusTaskHandle(taskId);
    }).finally(() => { taskOrderSaving = false; });
  }

  function focusTaskHandle(taskId) {
    [...root.querySelectorAll("[data-drag-task]")].find(handle => handle.dataset.dragTask === taskId)?.focus();
  }

  function persistListOrder(ids) {
    if (orderSaving) return;
    orderSaving = true;
    U.run(async () => {
      try { await T.reorderLists(ids); }
      catch (error) { render(); throw error; }
      render();
    }).finally(() => { orderSaving = false; });
  }

  function nameDialog(title, value, onSave) {
    const d = U.modal(`<form class="dialog-body"><h2>${title}</h2><div class="field"><label for="n">List name</label><input id="n" required value="${T.esc(value)}"></div>
      <div class="dialog-actions"><button class="btn btn-primary">Save</button><button type="button" class="btn btn-outline" data-close>Cancel</button></div></form>`);
    d.querySelector("form").onsubmit = e => { e.preventDefault(); const v = d.querySelector("#n").value.trim(); if (v) U.run(async () => { await onSave(v); d.close(); }, e.submitter); };
  }
  U.page({ render });
})();
