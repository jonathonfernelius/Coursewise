import { createClient } from "npm:@supabase/supabase-js@2";
import { validFeed } from "../_shared/canvas-feed.ts";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers
  });
}

async function readFeed(url: string) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(12000),
    headers: { Accept: "text/calendar" }
  });

  if (!response.ok) throw new Error("Canvas feed unavailable.");

  if (Number(response.headers.get("content-length") || 0) > 1000000) {
    throw new Error("Calendar is too large.");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty calendar.");

  const chunks: Uint8Array[] = [];
  let length = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 1000000) {
        await reader.cancel();
        throw new Error("Calendar is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  const raw = new TextDecoder().decode(bytes);
  if (!raw.includes("BEGIN:VCALENDAR") ||
      !raw.includes("END:VCALENDAR")) {
    throw new Error("Invalid calendar response.");
  }

  return raw;
}

function field(lines: string[], name: string) {
  const line = lines.find(l =>
    l.split(":")[0].split(";")[0].toUpperCase() === name
  );
  return line ? line.slice(line.indexOf(":") + 1) : "";
}


function parseEvents(raw: string) {
  const events = new Map<string, {
    title: string;
    due: string;
    hasTime: boolean;
  }>();

  const unfolded = raw.replace(/\r?\n[ \t]/g, "");

  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const lines = block.split(/\r?\n/);

    const uid = field(lines, "UID").trim();

    const title = field(lines, "SUMMARY")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\n/gi, " ")
      .trim();

    const date = field(lines, "DTSTART").trim();

    if (!uid || !title) continue;

    let due: string | null = null;
    let hasTime = false;

    // Timed Canvas events are normally expressed in UTC.
    const timed = date.match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/
    );

    // All-day events contain only a date.
    const allDay = date.match(
      /^(\d{4})(\d{2})(\d{2})$/
    );

    if (timed) {
      const iso =
        `${timed[1]}-${timed[2]}-${timed[3]}T` +
        `${timed[4]}:${timed[5]}:${timed[6]}Z`;

      const parsed = new Date(iso);

      if (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString() ===
          iso.replace(/Z$/, ".000Z")
      ) {
        due = parsed.toISOString();
        hasTime = true;
      }

    } else if (allDay) {
      const day = `${allDay[1]}-${allDay[2]}-${allDay[3]}`;
      const parsed = new Date(`${day}T00:00:00Z`);

      if (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === day
      ) {
        due = parsed.toISOString();
      }
    }

    // Skip unrecognized date formats instead of
    // importing potentially incorrect deadlines.
    if (!due) continue;

    events.set(uid, { title, due, hasTime });

    if (events.size >= 1000) break;
  }

  return events;
}


Deno.serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return reply({ error: "POST only" }, 405);
  }

  try {
    const token = req.headers.get("Authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) return reply({ error: "Sign in required." }, 401);

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } =
      await db.auth.getUser(token);

    if (authError || !user) {
      return reply({ error: "Session expired." }, 401);
    }

    const body = await req.json();

    let accountId = typeof body.accountId === "string" ? body.accountId : "";
    if (accountId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accountId)) {
      return reply({ error: "Invalid Canvas connection." }, 400);
    }
    if (!accountId) {
      const { data: accounts, error } = await db.from("CanvasAccounts")
        .select("CanvasAccountID").eq("AuthUserID", user.id).eq("IsConnected", true);
      if (error) throw error;
      if (accounts?.length !== 1) return reply({ error: "Choose which Canvas connection to import." }, 400);
      accountId = accounts[0].CanvasAccountID;
    }

    if (!Array.isArray(body.items) || body.items.length > 1000) {
      return reply({ error: "Invalid selection." }, 400);
    }

    const items: Array<{
      uid: string;
      listId: string | null;
      categoryId: string | null;
    }> = body.items;

    if (items.some(i =>
      !i || typeof i.uid !== "string" ||
      i.uid.length > 500 ||
      (i.listId != null && typeof i.listId !== "string") ||
      (i.categoryId != null && typeof i.categoryId !== "string")
    )) {
      return reply({ error: "Invalid assignment settings." }, 400);
    }

    const { data: profile, error: profileError } = await db
      .from("User")
      .select("UserID")
      .eq("AuthUserID", user.id)
      .single();

    if (profileError || !profile) {
      return reply({ error: "Coursewise profile missing." }, 400);
    }

    const { data: connection, error: connectionError } = await db
      .from("CanvasAccounts")
      .select("FeedURL,CanvasAccountID")
      .eq("CanvasAccountID", accountId)
      .eq("AuthUserID", user.id)
      .eq("IsConnected", true)
      .maybeSingle();

    if (connectionError || !connection) {
      return reply({ error: "Connect Canvas first." }, 400);
    }

    const { data: lists, error: listError } = await db
      .from("Lists")
      .select("ListID,Title")
      .eq("UserID", profile.UserID);

    const { data: categories, error: catError } = await db
      .from("Categories")
      .select("CategoryID")
      .eq("UserID", profile.UserID);

    if (listError || catError) {
      throw new Error("Could not read lists or categories.");
    }

    const listMap = new Map(
      (lists || []).map(l => [String(l.ListID), l])
    );

    const categoryIds = new Set(
      (categories || []).map(c => String(c.CategoryID))
    );

    // Optional list IDs must resolve to a list owned by this user.
    // Stale/deleted/unavailable lists fall back to no list; never attach a
    // task to another user's list or block an otherwise valid import.
    const clearedListUIDs: string[] = [];
    for (const item of items) {
      item.listId = item.listId?.trim() || null;
      if (item.listId && !listMap.has(item.listId)) {
        item.listId = null;
        clearedListUIDs.push(item.uid);
      }
      if (item.categoryId &&
          !categoryIds.has(item.categoryId)) {
        return reply({ error: "Invalid category selection." }, 400);
      }
    }

    const raw = await readFeed(await validFeed(connection.FeedURL));
    const events = parseEvents(raw);

    const { data: existing, error: mappingError } = await db
      .from("CanvasImportedTasks")
      .select("CanvasUID,TaskID")
      .eq("AuthUserID", user.id)
      .eq("CanvasAccountID", accountId);


    if (mappingError) throw mappingError;

    const { data: allMappings, error: allMappingsError } = await db
      .from("CanvasImportedTasks")
      .select("TaskID")
      .eq("AuthUserID", user.id);
    if (allMappingsError) throw allMappingsError;

    
    const imported = new Map(
      (existing || []).map(row => [
      row.CanvasUID,
      row.TaskID
      ])
    );


    // A Canvas refresh must check ALL previously imported assignments,
    // not just the new assignments selected for import.
    if (body.action === "sync-dates") {
      const taskIds = [...new Set(
        [...imported.values()].filter(id => id != null).map(String)
      )];

      const { data: existingTasks, error: readError } = taskIds.length
        ? await db.from("Tasks")
            .select("TaskID,TaskDueDate,HasDueTime")
            .eq("UserID", profile.UserID)
            .eq("IsAssignment", true)
            .in("TaskID", taskIds)
        : { data: [], error: null };

      if (readError) throw readError;

      const current = new Map<string, {
        TaskID: string;
        TaskDueDate: string | null;
        HasDueTime: boolean | null;
      }>(
        (existingTasks || []).map(t => [
          String(t.TaskID),
          {
            TaskID: String(t.TaskID),
            TaskDueDate: t.TaskDueDate,
            HasDueTime: t.HasDueTime
          }
        ])
      );
      let datesUpdated = 0;
      let checked = 0;

      for (const [uid, taskId] of imported) {
        const event = events.get(uid);
        const task = current.get(String(taskId));
        // Calendar feeds do not always contain older or hidden events.
        // Never delete or overwrite a task when its event isn't present.
        if (!event || !task) continue;
        checked++;

        const currentTime = task.TaskDueDate == null
          ? NaN : new Date(task.TaskDueDate).getTime();
        const incomingTime = new Date(event.due).getTime();
        if (currentTime === incomingTime &&
            Boolean(task.HasDueTime) === event.hasTime) continue;

        const { data: updated, error: updateError } = await db
          .from("Tasks")
          .update({
            TaskDueDate: event.due,
            HasDueTime: event.hasTime
          })
          .eq("TaskID", taskId)
          .eq("UserID", profile.UserID)
          .eq("IsAssignment", true)
          .select("TaskID");

        if (updateError) throw updateError;
        if (updated?.length !== 1) {
          throw new Error("Could not refresh an existing assignment date.");
        }
        datesUpdated++;
      }

      return reply({ success: true, checked, datesUpdated });
    }

    let added = 0;
    let skipped = 0;
    const seen = new Set<string>();

    for (const item of items) {
      if (seen.has(item.uid)) {
        skipped++;
        continue;
      }

      seen.add(item.uid);

      const event = events.get(item.uid);

      if (!event) {
        skipped++;
        continue;
      }

      
      if (imported.has(item.uid)) {
        const taskId = imported.get(item.uid);

        // Always refresh the assignment's deadline.
        const updates: Record<string, unknown> = {
          TaskDueDate: event.due,
          HasDueTime: event.hasTime
        };

        // Only change the list if the user chose one.
        if (item.listId) {
          const chosenList = listMap.get(item.listId);

          updates.ListID = item.listId;
          updates.ListName = chosenList.Title;
        }

        // Only change the category if the user chose one.
        if (item.categoryId) {
          updates.CategoryID = Number(item.categoryId);
        }

        const { data: updated, error: updateError } = await db
          .from("Tasks")
          .update(updates)
          .eq("TaskID", taskId)
          .eq("UserID", profile.UserID)
          .select("TaskID");

        if (updateError) throw updateError;

        if (!updated || updated.length !== 1) {
          throw new Error("Existing Canvas task could not be updated.");
        }

        skipped++;
        continue;
      }



      // Earlier syncs may have created an assignment task without leaving
      // a CanvasImportedTasks mapping. Reconnect a UNIQUE exact match rather
      // than inserting another copy. Never guess between multiple matches.
      const { data: candidates, error: candidateError } = await db
        .from("Tasks")
        .select("TaskID")
        .eq("UserID", profile.UserID)
        .eq("IsAssignment", true)
        .eq("Name", event.title)
        .eq("TaskDueDate", event.due)
        .limit(20);

      if (candidateError) throw candidateError;

      const mappedTaskIds = new Set(
        (allMappings || []).map(row => String(row.TaskID))
      );
      const orphanCandidates = (candidates || []).filter(
        task => !mappedTaskIds.has(String(task.TaskID))
      );

      if (orphanCandidates.length > 1) {
        return reply({
          error: `Multiple older tasks match "${event.title}". ` +
            "No new task was created. Review duplicates before importing."
        }, 409);
      }

      if (orphanCandidates.length === 1) {
        const originalId = orphanCandidates[0].TaskID;

        // Restore the missing Canvas UID → Coursewise task link first.
        const { error: restoreError } = await db
          .from("CanvasImportedTasks")
          .insert({
            AuthUserID: user.id,
            CanvasAccountID: accountId,
            CanvasUID: item.uid,
            TaskID: originalId
          });

        if (restoreError) throw restoreError;

        const repairs: Record<string, unknown> = {
          TaskDueDate: event.due,
          HasDueTime: event.hasTime
        };
        if (item.listId) {
          repairs.ListID = item.listId;
          repairs.ListName = listMap.get(item.listId).Title;
        }
        if (item.categoryId) {
          repairs.CategoryID = Number(item.categoryId);
        }

        const { error: repairError } = await db
          .from("Tasks")
          .update(repairs)
          .eq("UserID", profile.UserID)
          .eq("TaskID", originalId);
        if (repairError) throw repairError;

        imported.set(item.uid, originalId);
        skipped++;
        continue;
      }

      const list = item.listId
        ? listMap.get(item.listId)
        : null;

      const { data: task, error: taskError } = await db
        .from("Tasks")
        .insert({
          UserID: profile.UserID,
          Name: event.title,
          IsComplete: false,
          IsAssignment: true,
          TaskDueDate: event.due,
          HasDueTime: event.hasTime,
          ListID: item.listId || null,
          ListName: list?.Title || null,
          CategoryID: item.categoryId
            ? Number(item.categoryId)
            : null
        })
        .select("TaskID")
        .single();

      if (taskError) throw taskError;

      const { error: mapError } = await db
        .from("CanvasImportedTasks")
        .insert({
          AuthUserID: user.id,
          CanvasAccountID: accountId,
          CanvasUID: item.uid,
          TaskID: task.TaskID
        });

      if (mapError) {
        // Don't leave an unmapped imported task behind.
        await db.from("Tasks")
          .delete()
          .eq("TaskID", task.TaskID)
          .eq("UserID", profile.UserID);
        throw mapError;
      }

      imported.set(item.uid, task.TaskID);
      added++;
    }

    return reply({ added, skipped, clearedListUIDs });

  } catch (error) {
    console.error(
      "canvas-import:",
      error instanceof Error ? error.message : error
    );

    return reply({
      error: "Import failed. Some assignments may already have been saved. Refresh before retrying."
    }, 500);
  }
});
