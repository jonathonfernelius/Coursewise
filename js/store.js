/* Tidy — cloud data and recurrence helpers. Supabase is the source of truth. */
(() => {
  const pad = n => String(n).padStart(2, "0");
  const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const shift = n => { const d = new Date(); d.setDate(d.getDate() + n); return toKey(d); };
  const parseKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDate = k => parseKey(k).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const fmtTime = t => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`; };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const REPEATS = { daily: "Every day", weekdays: "Every weekday", weekly: "Every week", monthly: "Every month" };
  const THEMES = [["green", "Green"], ["teal", "Teal"], ["blue", "Blue"], ["purple", "Purple"], ["pink", "Pink"], ["orange", "Orange"]];
  const DAYN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const PRESETS = { daily: { unit: "day", interval: 1 }, weekdays: { unit: "week", interval: 1, days: [1, 2, 3, 4, 5] }, weekly: { unit: "week", interval: 1 }, monthly: { unit: "month", interval: 1 } };
  const asRule = r => (typeof r === "string" ? PRESETS[r] : r);

  /* The date after `d` for a repeat rule: { unit, interval, days?, end? } */
  function stepDate(d, rule, anchor) {
    const n = Math.max(1, rule.interval || 1);
    if (rule.unit === "day") { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
    if (rule.unit === "week") {
      const days = rule.days && rule.days.length ? rule.days : [d.getDay()];
      const sow = v => { const x = new Date(v); x.setDate(x.getDate() - x.getDay()); x.setHours(12, 0, 0, 0); return x; };
      const base = sow(d);
      for (let i = 1; i <= 7 * n + 7; i++) {
        const c = new Date(d); c.setDate(c.getDate() + i);
        if (days.includes(c.getDay()) && Math.round((sow(c) - base) / 604800000) % n === 0) return c;
      }
    }
    const months = rule.unit === "year" ? 12 * n : n;
    const y = new Date(d.getFullYear(), d.getMonth() + months, 1);
    y.setDate(Math.min(anchor, new Date(y.getFullYear(), y.getMonth() + 1, 0).getDate()));
    return y;
  }
  /* Next occurrence, always later than today */
  function nextDate(key, repeat) {
    const rule = asRule(repeat), today = toKey(new Date()), anchor = parseKey(key).getDate();
    let d = parseKey(key);
    do d = stepDate(d, rule, anchor); while (toKey(d) <= today);
    return toKey(d);
  }
  function weeklyTasks(task) {
    const rule = asRule(task.repeat);
    const days = rule?.unit === "week" && rule.days?.length > 1
      ? [...new Set(rule.days)].filter(day => Number.isInteger(day) && day >= 0 && day <= 6).sort((a, b) => a - b)
      : [];
    if (days.length < 2 || !task.due) return [task];

    const interval = Math.max(1, rule.interval || 1), base = parseKey(task.due);
    base.setHours(12, 0, 0, 0);
    const nextByDay = new Map(days.map(day => {
      const date = new Date(base);
      date.setDate(date.getDate() + (day - date.getDay() + 7) % 7);
      if (date < base) date.setDate(date.getDate() + interval * 7);
      return [day, date];
    }));
    const counts = new Map(days.map(day => [day, 1]));
    const end = rule.end || { type: "never" };

    if (end.type === "after") {
      for (const day of days) counts.set(day, 0);
      const next = new Map(nextByDay);
      for (let occurrence = 0; occurrence < Math.max(1, Number(end.count) || 1); occurrence++) {
        const day = days.reduce((first, candidate) => next.get(candidate) < next.get(first) ? candidate : first, days[0]);
        counts.set(day, counts.get(day) + 1);
        const date = new Date(next.get(day));
        date.setDate(date.getDate() + interval * 7);
        next.set(day, date);
      }
    }

    return days.filter(day => counts.get(day) > 0 && (end.type !== "on" || !end.date || toKey(nextByDay.get(day)) <= end.date))
      .map(day => {
        const dayRule = { ...rule, days: [day], seriesDays: days, seriesEnd: end };
        if (end.type === "after") dayRule.end = { type: "after", count: counts.get(day) };
        return { ...task, due: toKey(nextByDay.get(day)), repeat: dayRule };
      }).sort((a, b) => a.due.localeCompare(b.due));
  }
  function recurrenceTasks(task) {
    const rule = asRule(task.repeat), end = rule?.end;
    if (!rule || rule.materialized) return { tasks: [task], truncated: false };
    if (!end || !["after", "on"].includes(end.type)) {
      const seriesId = rule.seriesId || uid();
      return { tasks: weeklyTasks(task).map((item, index) => ({
        ...item, repeat: { ...asRule(item.repeat), seriesId, seriesPosition: index }
      })), truncated: false };
    }

    const anchor = parseKey(task.due).getDate();
    const seriesId = rule.seriesId || uid();
    let date = parseKey(task.due);
    date.setHours(12, 0, 0, 0);
    if (rule.unit === "week" && rule.days?.length && !rule.days.includes(date.getDay())) {
      date = stepDate(date, rule, anchor);
    }
    const count = end.type === "after" ? Math.max(1, Number(end.count) || 1) : Infinity;
    const tasks = [];
    let truncated = false;
    while (tasks.length < count && (end.type !== "on" || toKey(date) <= end.date)) {
      if (tasks.length === 100) { truncated = true; break; }
      const repeat = { ...rule, materialized: true, seriesId, seriesPosition: tasks.length };
      if (rule.unit === "week" && rule.days?.length > 1) {
        repeat.seriesDays = [...new Set(rule.days)];
        repeat.seriesEnd = end;
      }
      tasks.push({ ...task, due: toKey(date), repeat });
      date = stepDate(date, rule, anchor);
    }
    if (!tasks.length) throw new Error("The recurrence end must be on or after the first occurrence.");
    return { tasks, truncated };
  }
  function legacySeriesTasks(tasks, task) {
    const rule = task.repeat;
    if (!rule?.materialized || rule.seriesId || !rule.end || !["after", "on"].includes(rule.end.type)) return [];

    const { materialized, seriesPosition, seriesDays, seriesEnd, ...repeat } = rule;
    const identity = JSON.stringify({ title: task.title, categoryId: task.categoryId, listId: task.listId,
      time: task.time, reminder: task.reminder, repeat });
    const candidates = tasks.filter(item => {
      const candidate = item.repeat;
      if (!candidate?.materialized || candidate.seriesId || !candidate.end || !["after", "on"].includes(candidate.end.type)) return false;
      const { materialized: ignoredMaterialized, seriesPosition: ignoredPosition, seriesDays: ignoredDays, seriesEnd: ignoredEnd, ...candidateRepeat } = candidate;
      return JSON.stringify({ title: item.title, categoryId: item.categoryId, listId: item.listId,
        time: item.time, reminder: item.reminder, repeat: candidateRepeat }) === identity;
    }).sort((a, b) => a.due.localeCompare(b.due));
    if (candidates.length < 2) return candidates;

    const first = parseKey(candidates[0].due), anchor = first.getDate(), included = new Set([candidates[0].id]);
    let expected = first, steps = 0;
    for (const candidate of candidates.slice(1)) {
      while (toKey(expected) < candidate.due && steps < 1000) {
        expected = stepDate(expected, rule, anchor);
        steps++;
      }
      if (toKey(expected) === candidate.due) included.add(candidate.id);
    }
    return candidates.filter(item => included.has(item.id));
  }
  function taskDeletionIds(tasks, task, scope) {
    const ids = new Set(), addFollowing = start => {
      let current = start;
      while (current && !ids.has(current.id)) {
        ids.add(current.id);
        current = tasks.find(item => item.id === current.spawned);
      }
    };
    const seriesId = task.repeat?.seriesId, legacySeries = seriesId ? [] : legacySeriesTasks(tasks, task);
    if (seriesId) {
      const series = tasks.filter(item => item.repeat?.seriesId === seriesId), familyIds = new Set();
      series.forEach(start => {
        let current = start;
        while (current && !familyIds.has(current.id)) {
          familyIds.add(current.id);
          current = tasks.find(item => item.id === current.spawned);
        }
      });
      const family = tasks.filter(item => familyIds.has(item.id));
      const position = task.repeat?.materialized ? task.repeat.seriesPosition : null;
      const selected = scope === "all" ? family : scope === "following"
        ? family.filter(item => Number.isInteger(position) && item.repeat?.materialized && Number.isInteger(item.repeat.seriesPosition)
          ? item.repeat.seriesPosition >= position : item.due >= task.due)
        : [task];
      selected.forEach(addFollowing);
    } else if (legacySeries.length) {
      const familyIds = new Set();
      legacySeries.forEach(start => {
        let current = start;
        while (current && !familyIds.has(current.id)) {
          familyIds.add(current.id);
          current = tasks.find(item => item.id === current.spawned);
        }
      });
      const family = tasks.filter(item => familyIds.has(item.id));
      const selected = scope === "all" ? family : scope === "following"
        ? family.filter(item => item.due >= task.due) : [task];
      selected.forEach(addFollowing);
    } else if (scope === "this") {
      ids.add(task.id);
    } else {
      let first = task;
      if (scope === "all") {
        const seen = new Set([task.id]);
        while (true) {
          const previous = tasks.find(item => item.spawned === first.id && !seen.has(item.id));
          if (!previous) break;
          first = previous;
          seen.add(first.id);
        }
      }
      addFollowing(first);
    }
    return ids;
  }
  function repeatLabel(r) {
    if (typeof r === "string") return REPEATS[r];
    const n = r.interval || 1;
    let s = n === 1 ? `Every ${r.unit}` : `Every ${n} ${r.unit}s`;
    const days = r.seriesDays || r.days, end = r.seriesEnd || r.end;
    if (r.unit === "week" && days && days.length) s += " on " + [...days].sort().map(i => DAYN[i]).join(", ");
    if (end && end.type === "on") s += ", until " + parseKey(end.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    if (end && end.type === "after") s += `, ${end.count} times`;
    return s;
  }
  const uid = () => "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const db = window.tidyClient;
  const tones = ["sky", "grape", "sun", "mint", "rose", "slate", "teal", "coral", "indigo", "lime"];
  const empty = () => ({ signedIn: false, user: { first: '', last: '', email: '', username: '' }, prefs: { weekStart: 0, showDone: false, theme: 'green' }, categories: [], lists: [], tasks: [], canvasConnected: false });
  let state = empty(), authUser, owner;
  const requireDb = () => { if (!db) throw new Error('Could not load Supabase. Check your connection and reload.'); };
  async function result(query) { const {data, error} = await query; if (error) throw new Error(error.message); return data; }
  const id = n => n == null ? null : String(n);
  function parseRepeat(r) {
    if (!r) return null;
    let v; try { v = JSON.parse(r); } catch { v = r; }
    if (typeof v === 'string') return PRESETS[v] ? v : null;
    if (!v || !['day','week','month','year'].includes(v.unit)) return null;
    return { ...v, interval: Math.min(99, Math.max(1, Number(v.interval) || 1)) };
  }
  function taskFromRow(r) {
    const d = r.TaskDueDate ? new Date(r.TaskDueDate) : null;
    return { id: id(r.TaskID), title: r.Name, categoryId: id(r.CategoryID), listId: id(r.ListID),
      due: d ? (r.HasDueTime ? toKey(d) : r.TaskDueDate.slice(0,10)) : null,
      time: d && r.HasDueTime ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : null,
      reminder: r.Reminder, done: r.IsComplete, repeat: parseRepeat(r.Repeating),
      occ: r.Occurrence, spawned: id(r.SpawnedTaskID), fromCanvas: r.IsAssignment, sortOrder: r.SortOrder };
  }
  function dueStamp(p) { return p.due ? (p.time ? new Date(`${p.due}T${p.time}:00`).toISOString() : `${p.due}T00:00:00.000Z`) : null; }
  function taskToRow(p) {
    return { Name: p.title, CategoryID: p.categoryId || null, ListID: p.listId || null,
      ListName: state.lists.find(l => l.id === p.listId)?.title || null,
      TaskDueDate: dueStamp(p), HasDueTime: !!(p.due && p.time), Reminder: p.reminder || null,
      Repeating: p.repeat ? JSON.stringify(p.repeat) : null };
  }
  async function allRows(table, columns, order) {
    let rows = [];
    for (let offset = 0; ; offset += 1000) {
      const batch = await result(db.from(table).select(columns).eq('UserID', owner).order(order).range(offset, offset + 999));
      rows.push(...batch);
      if (batch.length < 1000) return rows;
    }
  }
  async function load() {
    if (!owner) throw new Error('Please log in again.');
    // Keep the prior screen intact if any request fails.
    const [profile, settings, categories, lists, tasks] = await Promise.all([
      result(db.from('User').select('UserID,FirstName,LastName,Username').eq('UserID', owner).single()),
      result(db.from('Settings').select('ColorTheme,WeekStart,ShowDone').eq('UserID', owner).single()),
      allRows('Categories','CategoryID,DisplayName,DisplayColor','CategoryID'),
      allRows('Lists','ListID,Title,SortOrder','SortOrder'),
      allRows('Tasks','*','TaskID')
    ]);
    state = { signedIn: true, user: { first: profile.FirstName, last: profile.LastName, username: profile.Username, email: authUser.email || '' },
      prefs: { theme: THEMES.some(t => t[0]===settings.ColorTheme) ? settings.ColorTheme : 'green', weekStart: settings.WeekStart, showDone: settings.ShowDone },
      categories: categories.map(c => ({id:id(c.CategoryID),name:c.DisplayName,tone:tones.includes(c.DisplayColor)?c.DisplayColor:'slate'})),
      lists: lists.map(l => ({id:id(l.ListID),title:l.Title,order:l.SortOrder})),
      tasks: tasks
        .filter(task => !task.CanvasExcluded)
        .map(taskFromRow)
        .sort((a,b) => a.sortOrder-b.sortOrder || a.id.localeCompare(b.id)),
      canvasConnected: false };
    if (window.CoursewiseTheme) window.CoursewiseTheme.apply(state.prefs.theme);
    else document.documentElement.dataset.theme = state.prefs.theme;
  }
  async function init() {
    requireDb();
    const {data:{session}, error} = await db.auth.getSession();
    if (error) throw error;
    if (!session) return false;
    authUser = session.user;
    const p = await result(db.from('User').select('UserID').eq('AuthUserID',authUser.id).maybeSingle());
    if (!p) throw new Error('This account has no Tidy profile. Run setup.sql before creating a new account. Existing demo accounts are not migrated.');
    owner = p.UserID;
    await load(); return true;
  }
  // Database writes finish before the UI reports success. A load failure is distinct
  // from a write failure so users do not repeat an already-committed write.
  async function refreshAfterSave() {
    try { await load(); } catch { throw new Error('Your change was saved, but the screen could not refresh. Reload the page before making another change.'); }
  }
  async function write(query) { await result(query); await refreshAfterSave(); }
  const Tidy = {
    toKey, shift, parseKey, fmtDate, fmtTime, esc, tones, themes: THEMES, repeats: REPEATS, repeatLabel, dayNames: DAYN,
    get categories() { return state.categories; }, get state() { return state; },
    cat: n => state.categories.find(c => c.id===n), init, reload: load,
    async login(email,password) { requireDb(); await result(db.auth.signInWithPassword({email,password})); },
    async signup(p,password) {
      requireDb(); return result(db.auth.signUp({ email:p.email, password, options:{
        emailRedirectTo: new URL('index.html',location.href).href,
        data:{ first_name:p.first,last_name:p.last,username:p.username }
      }}));
    },
    async logout() { requireDb(); await result(db.auth.signOut()); state=empty(); owner=null; authUser=null; },
    async resetPassword(email) { requireDb(); await result(db.auth.resetPasswordForEmail(email,{redirectTo:new URL('reset-password.html',location.href).href})); },
    async changePassword(password) { requireDb(); await result(db.auth.updateUser({password})); },
    async updateUser(p) {
      await write(db.from('User').update({FirstName:p.first,LastName:p.last,Username:p.username}).eq('UserID',owner).select('UserID').single());
    },
    async setPrefs(p) {
      const row={}; if ('theme' in p) row.ColorTheme=p.theme; if ('weekStart' in p) row.WeekStart=p.weekStart; if ('showDone' in p) row.ShowDone=p.showDone;
      await write(db.from('Settings').update(row).eq('UserID',owner).select('UserID').single());
    },
    async addCategory(name,tone) {
      const c=await result(db.from('Categories').insert({UserID:owner,DisplayName:name,DisplayColor:tone}).select('CategoryID').single());
      await refreshAfterSave(); return Tidy.cat(id(c.CategoryID));
    },
    async updateCategory(n,p) { await write(db.from('Categories').update({DisplayName:p.name,DisplayColor:p.tone}).eq('CategoryID',n).eq('UserID',owner).select('CategoryID').single()); },
    async deleteCategory(n) { await write(db.rpc('tidy_delete_category',{p_id:n})); },
    async addTask(p) {
      const {tasks,truncated}=recurrenceTasks(p), sortOrder=Math.max(-1,...state.tasks.filter(t=>t.listId===p.listId).map(t=>t.sortOrder))+1;
      await write(db.from('Tasks').insert(tasks.map((task,index)=>({...taskToRow(task),SortOrder:sortOrder+index,UserID:owner,IsComplete:false,IsAssignment:false}))));
      return {truncated};
    },
    async updateTask(n,p) {
      const existing=state.tasks.find(t=>t.id===n), sameRepeat=!!existing&&existing.due===p.due&&JSON.stringify(existing.repeat)===JSON.stringify(p.repeat);
      const plan=existing?.spawned&&sameRepeat?{tasks:[p],truncated:false}:recurrenceTasks(p), tasks=plan.tasks, row=taskToRow(tasks[0]);
      let sortOrder=existing?.sortOrder ?? 0;
      if (existing && existing.listId!==p.listId) sortOrder=Math.max(-1,...state.tasks.filter(t=>t.listId===p.listId).map(t=>t.sortOrder))+1;
      row.SortOrder=sortOrder;
      if (existing?.spawned&&!sameRepeat) {
        const descendants=[]; let childId=existing.spawned;
        while(childId&&!descendants.includes(childId)) {
          const child=state.tasks.find(t=>t.id===childId);
          if(!child) break;
          descendants.push(childId); childId=child.spawned;
        }
        if(descendants.length) await result(db.from('Tasks').delete().in('TaskID',descendants).eq('UserID',owner));
        row.SpawnedTaskID=null;
      }
      if (tasks.length > 1) {
        const nextOrder=Math.max(-1,...state.tasks.filter(t=>t.listId===p.listId).map(t=>t.sortOrder))+1;
        await result(db.from('Tasks').insert(tasks.slice(1).map((task,index)=>({...taskToRow(task),SortOrder:nextOrder+index,UserID:owner,IsComplete:false,IsAssignment:false}))));
      }
      await write(db.from('Tasks').update(row).eq('TaskID',n).eq('UserID',owner).select('TaskID').single());
      return {truncated:plan.truncated};
    },
    async reorderTasks(taskId,targetListId,targetTaskIds,sourceTaskIds) {
      await write(db.rpc('tidy_reorder_tasks',{
        p_task_id:taskId,
        p_target_list_id:targetListId,
        p_target_task_ids:targetTaskIds,
        p_source_task_ids:sourceTaskIds
      }));
    },
    async deleteTask(n, scope = 'this') {
      const task = state.tasks.find(item => item.id === n);
      if (!task) throw new Error('Task not found. Reload the page.');
      const ids = taskDeletionIds(state.tasks, task, scope);

      const predecessor = state.tasks.find(item => item.spawned && ids.has(item.spawned) && !ids.has(item.id));
      if (predecessor) {
        const nextId = scope === 'this' && task.spawned && state.tasks.some(item => item.id === task.spawned)
          ? task.spawned : null;
        await result(db.from('Tasks').update({SpawnedTaskID:nextId}).eq('TaskID',predecessor.id).eq('UserID',owner).select('TaskID').single());
      }
      await write(db.from('Tasks').delete().in('TaskID',[...ids]).eq('UserID',owner).select('TaskID'));
    },
    async toggleTask(n) {
      const t=state.tasks.find(t=>t.id===n); if (!t) throw new Error('Task not found. Reload the page.');
      let next, ended=false;
      if (!t.done && t.repeat && t.due && !asRule(t.repeat).materialized && !t.spawned) {
        const end=asRule(t.repeat).end || {type:'never'}, occ=t.occ || 1;
        next=nextDate(t.due,t.repeat);
        if ((end.type==='after' && occ>=end.count) || (end.type==='on' && end.date && next>end.date)) {next=undefined;ended=true;}
      }
      await write(db.rpc('tidy_toggle_task',{p_id:n,p_expected_done:t.done,p_next_due:next?dueStamp({...t,due:next}):null}));
      return {done:!t.done,next,ended};
    },
    async addList(title) {
      const order=Math.max(-1,...state.lists.map(l=>l.order))+1;
      const l=await result(db.from('Lists').insert({UserID:owner,Title:title,SortOrder:order}).select('ListID').single());
      await refreshAfterSave(); return state.lists.find(v=>v.id===id(l.ListID));
    },
    async reorderLists(listIds) { await write(db.rpc('tidy_reorder_lists',{p_list_ids:listIds})); },
    async renameList(n,title) { await write(db.rpc('tidy_rename_list',{p_id:n,p_title:title})); },
    async deleteList(n) { await write(db.from('Lists').delete().eq('ListID',n).eq('UserID',owner).select('ListID').single()); }
  };
  if (db) db.auth.onAuthStateChange((event, session) => {
    if (event==='SIGNED_OUT' || (authUser && session && session.user.id!==authUser.id)) {
      state=empty(); owner=null; authUser=null;
      if (!['login','signup','reset-password'].includes(document.body.dataset.page)) location.replace('index.html');
    }
  });
  window.Tidy=Tidy;
})();
