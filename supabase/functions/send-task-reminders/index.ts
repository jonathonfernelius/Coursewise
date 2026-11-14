import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const jsonHeaders = { "Content-Type": "application/json" };
const minute = 60_000;
const reminderOffsets: Record<string, number> = {
  "15m": 15 * minute,
  "1h": 60 * minute,
  "1d": 24 * 60 * minute,
  "1w": 7 * 24 * 60 * minute
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function zonedLocalTimeToUtc(dateKey: string, time: string, timezone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minutePart] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minutePart, 0, 0);
  let guess = desired;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    guess += desired - represented;
  }
  return new Date(guess);
}

function dueInstant(task: Record<string, unknown>, timezone: string) {
  if (typeof task.TaskDueDate !== "string") return null;
  if (task.HasDueTime) {
    const parsed = new Date(task.TaskDueDate);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  const dateKey = task.TaskDueDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  try {
    return zonedLocalTimeToUtc(dateKey, "09:00", timezone || "UTC");
  } catch {
    return zonedLocalTimeToUtc(dateKey, "09:00", "UTC");
  }
}

function reminderInstant(dueAt: Date, reminder: string, timezone: string) {
  const offset = reminderOffsets[reminder];
  if (!offset) return null;
  if (reminder === "15m" || reminder === "1h") return new Date(dueAt.getTime() - offset);
  try {
    const local = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(dueAt).map(part => [part.type, part.value]));
    const days = reminder === "1w" ? 7 : 1;
    const prior = new Date(Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day) - days));
    const dateKey = `${prior.getUTCFullYear()}-${String(prior.getUTCMonth() + 1).padStart(2, "0")}-${String(prior.getUTCDate()).padStart(2, "0")}`;
    return zonedLocalTimeToUtc(dateKey, `${local.hour}:${local.minute}`, timezone || "UTC");
  } catch {
    return new Date(dueAt.getTime() - offset);
  }
}

function validSubscription(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const sub = value as Record<string, unknown>;
  if (typeof sub.endpoint !== "string" || typeof sub.keys !== "object" || !sub.keys) return false;
  try {
    const endpoint = new URL(sub.endpoint);
    const host = endpoint.hostname.toLowerCase();
    const allowed = host === "fcm.googleapis.com"
      || host === "push.services.mozilla.com"
      || host.endsWith(".push.services.mozilla.com")
      || host.endsWith(".push.apple.com")
      || host === "notify.windows.com"
      || host.endsWith(".notify.windows.com");
    return endpoint.protocol === "https:" && allowed;
  } catch {
    return false;
  }
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: jsonHeaders });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  const expectedSecret = Deno.env.get("REMINDER_CRON_SECRET");
  if (!expectedSecret || request.headers.get("x-coursewise-cron-secret") !== expectedSecret) {
    return reply({ error: "Unauthorized." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");
  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate || !vapidSubject) {
    console.error("Task reminder sender is missing required configuration.");
    return reply({ error: "Task reminder sender is not configured." }, 500);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date();
  const windowStart = new Date(now.getTime() - 90_000);
  const windowEnd = new Date(now.getTime() + minute);
  let sent = 0, failed = 0, skipped = 0;

  const { data: subscriptions, error: subscriptionError } = await db.from("coursewise_push_subscriptions")
    .select("id,auth_user_id,endpoint,subscription,timezone");
  if (subscriptionError) {
    console.error("Could not load push subscriptions:", subscriptionError.message);
    return reply({ error: "Could not load notification subscriptions." }, 500);
  }
  if (!subscriptions?.length) return reply({ sent: 0, failed: 0, skipped: 0 });

  const authIds = [...new Set(subscriptions.map(row => row.auth_user_id))];
  const { data: users, error: userError } = await db.from("User").select("UserID,AuthUserID").in("AuthUserID", authIds);
  if (userError) {
    console.error("Could not map notification accounts:", userError.message);
    return reply({ error: "Could not load notification accounts." }, 500);
  }
  const userIdByAuth = new Map((users || []).map(user => [user.AuthUserID, String(user.UserID)]));
  const tasksByUser = new Map<string, Record<string, unknown>[]>();

  for (const authId of authIds) {
    const userId = userIdByAuth.get(authId);
    if (!userId) continue;
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from("Tasks")
        .select("TaskID,UserID,TaskDueDate,HasDueTime,Reminder,IsComplete")
        .eq("UserID", userId).eq("IsComplete", false).not("Reminder", "is", null)
        .not("TaskDueDate", "is", null).range(offset, offset + 999);
      if (error) {
        console.error("Could not load pending task reminders:", error.message);
        return reply({ error: "Could not load task reminders." }, 500);
      }
      rows.push(...(data || []));
      if ((data || []).length < 1000) break;
    }
    tasksByUser.set(authId, rows);
  }

  for (const device of subscriptions) {
    if (!validSubscription(device.subscription)
      || (device.subscription as Record<string, unknown>).endpoint !== device.endpoint) { skipped++; continue; }
    const tasks = tasksByUser.get(device.auth_user_id) || [];
    for (const task of tasks) {
      const reminder = String(task.Reminder);
      if (!reminderOffsets[reminder]) { skipped++; continue; }
      const dueAt = dueInstant(task, String(device.timezone || "UTC"));
      if (!dueAt) { skipped++; continue; }
      const remindAt = reminderInstant(dueAt, reminder, String(device.timezone || "UTC"));
      if (!remindAt) { skipped++; continue; }
      if (remindAt < windowStart || remindAt > windowEnd) continue;

      const taskId = String(task.TaskID);
      const dueIso = dueAt.toISOString();
      const { data: claim, error: claimError } = await db.from("coursewise_task_reminder_deliveries")
        .upsert({ task_id: taskId, due_at: dueIso, subscription_id: device.id }, {
          onConflict: "task_id,due_at,subscription_id", ignoreDuplicates: true
        }).select("id").maybeSingle();
      if (claimError) {
        console.error("Could not claim task reminder delivery:", claimError.message);
        failed++;
        continue;
      }
      if (!claim) continue;

      try {
        await webpush.sendNotification(device.subscription, JSON.stringify({
          title: "Coursewise task reminder",
          body: "A task you scheduled is coming up.",
          tag: `coursewise-task-${taskId}-${dueAt.getTime()}`,
          url: "home.html"
        }), { TTL: 3600, urgency: "normal" });
        sent++;
      } catch (error) {
        failed++;
        const statusCode = Number((error as { statusCode?: number })?.statusCode);
        if (statusCode === 404 || statusCode === 410) {
          await db.from("coursewise_push_subscriptions").delete().eq("id", device.id);
        } else {
          // Let the next minute retry transient push-service failures.
          await db.from("coursewise_task_reminder_deliveries").delete()
            .eq("task_id", taskId).eq("due_at", dueIso).eq("subscription_id", device.id);
        }
      }
    }
  }

  // Keep the idempotency ledger bounded without retaining task or endpoint details.
  await db.from("coursewise_task_reminder_deliveries")
    .delete().lt("sent_at", new Date(now.getTime() - 90 * 24 * 60 * minute).toISOString());
  return reply({ sent, failed, skipped });
});
