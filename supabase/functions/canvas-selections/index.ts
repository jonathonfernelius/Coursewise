// canvas selections
import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function reply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  if (req.method !== "POST") {
    return reply({ error: "POST required." }, 405);
  }

  try {
    const token = req.headers.get("Authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      return reply({ error: "Please sign in." }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !key) {
      throw new Error("Supabase server settings missing.");
    }

    const db = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

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
      if (accounts?.length !== 1) return reply({ error: "Choose which Canvas connection to review." }, 400);
      accountId = accounts[0].CanvasAccountID;
    }
    const { data: account, error: accountError } = await db.from("CanvasAccounts")
      .select("CanvasAccountID").eq("CanvasAccountID", accountId)
      .eq("AuthUserID", user.id).eq("IsConnected", true).maybeSingle();
    if (accountError) throw accountError;
    if (!account) return reply({ error: "Canvas connection is disconnected or unavailable." }, 404);

    // Load previously saved selections.
    if (body.action === "load") {
      const { data, error } = await db
        .from("CanvasSelections")
        .select("CanvasUID,Selected,ListID,CategoryID")
        .eq("AuthUserID", user.id)
        .eq("CanvasAccountID", accountId)
        .limit(1000);

      if (error) throw error;

      const { data: imported, error: importError } = await db
        .from("CanvasImportedTasks")
        .select("CanvasUID,TaskID")
        .eq("AuthUserID", user.id)
        .eq("CanvasAccountID", accountId)
        .limit(1000);

      if (importError) throw importError;

      return reply({
        accountId,
        choices: data || [],
        imported: imported || []
      });
    }

    if (body.action !== "save") {
      return reply({ error: "Unknown action." }, 400);
    }

    const items = body.items;

    if (!Array.isArray(items) || items.length > 1000) {
      return reply({ error: "Invalid selections." }, 400);
    }

    // Validate all submitted choices.
    const seen = new Set<string>();

    for (const item of items) {
      if (
        !item ||
        typeof item.uid !== "string" ||
        !item.uid ||
        item.uid.length > 500 ||
        typeof item.selected !== "boolean" ||
        (item.listId != null &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(item.listId))) ||
        (item.categoryId != null &&
          !/^\d+$/.test(String(item.categoryId))) ||
        seen.has(item.uid)
      ) {
        return reply({
          error: "Invalid or duplicate assignment."
        }, 400);
      }

      seen.add(item.uid);
    }

    // Find the signed-in user's Coursewise profile.
    const { data: profile, error: profileError } = await db
      .from("User")
      .select("UserID")
      .eq("AuthUserID", user.id)
      .single();

    if (profileError || !profile) {
      return reply({
        error: "Coursewise user profile not found."
      }, 400);
    }

    // Only permit lists and categories owned by this user.
    const { data: lists, error: listError } = await db
      .from("Lists")
      .select("ListID,Title")
      .eq("UserID", profile.UserID);

    const { data: categories, error: categoryError } = await db
      .from("Categories")
      .select("CategoryID")
      .eq("UserID", profile.UserID);

    if (listError || categoryError) {
      throw new Error("Could not validate organization.");
    }


    const listMap = new Map<
      string,
      { ListID: string; Title: string }
    >(
      (lists || []).map(l => [
        String(l.ListID),
        {
          ListID: String(l.ListID),
          Title: l.Title
        }
      ])
    );


    const categoryIds = new Set(
      (categories || []).map(c => String(c.CategoryID))
    );

    for (const item of items) {
      if (
        item.listId != null &&
        !listMap.has(String(item.listId))
      ) {
        return reply({ error: "List not found." }, 400);
      }

      if (
        item.categoryId != null &&
        !categoryIds.has(String(item.categoryId))
      ) {
        return reply({ error: "Category not found." }, 400);
      }
    }

    // Match the selections with this user's imported tasks.
    const { data: imported, error: mappingError } = await db
      .from("CanvasImportedTasks")
      .select("CanvasUID,TaskID")
      .eq("AuthUserID", user.id)
      .eq("CanvasAccountID", accountId)
      .limit(1000);

    if (mappingError) throw mappingError;

    const taskMap = new Map(
      (imported || []).map(row => [
        row.CanvasUID,
        row.TaskID
      ])
    );

    // Save all checkbox and organization preferences.
    const preferences = items.map(item => ({
      AuthUserID: user.id,
      CanvasAccountID: accountId,
      CanvasUID: item.uid,
      Selected: item.selected,
      ListID: item.listId == null
        ? null : String(item.listId),
      CategoryID: item.categoryId == null
        ? null : Number(item.categoryId),
      UpdatedAt: new Date().toISOString()
    }));

    if (preferences.length) {
      const { error: preferenceError } = await db
        .from("CanvasSelections")
        .upsert(preferences, {
          onConflict: "CanvasAccountID,CanvasUID"
        });

      if (preferenceError) throw preferenceError;
    }


    // Load existing imported tasks in one request.
    const taskIds = [...new Set(taskMap.values())];

    const { data: currentTasks, error: readError } =
      taskIds.length
        ? await db
            .from("Tasks")
            .select("TaskID,CanvasExcluded,ListID,CategoryID")
            .eq("UserID", profile.UserID)
            .eq("IsAssignment", true)
            .in("TaskID", taskIds)
        : { data: [], error: null };

    if (readError) throw readError;


    const currentTaskMap = new Map<
      string,
      {
        TaskID: string;
        CanvasExcluded: boolean;
        ListID: string | null;
        CategoryID: number | null;
      }
    >(
      (currentTasks || []).map(task => [
        String(task.TaskID),
        {
          TaskID: String(task.TaskID),
          CanvasExcluded: Boolean(task.CanvasExcluded),
          ListID: task.ListID,
          CategoryID: task.CategoryID
        }
      ])
    );


    let updated = 0;
    let hidden = 0;

    // Only update assignments that actually changed.
    for (const item of items) {
      const taskId = taskMap.get(item.uid);

      if (taskId == null) continue;

      const current = currentTaskMap.get(String(taskId));

      if (!current) {
        throw new Error("Imported task not found.");
      }

      const newExcluded = !item.selected;

      const newListId = item.listId == null
        ? null : String(item.listId);

      const newCategoryId = item.categoryId == null
        ? null : String(item.categoryId);

      const oldListId = current.ListID == null
        ? null : String(current.ListID);

      const oldCategoryId = current.CategoryID == null
        ? null : String(current.CategoryID);

      const changed =
        Boolean(current.CanvasExcluded) !== newExcluded ||
        oldListId !== newListId ||
        oldCategoryId !== newCategoryId;

      if (!changed) continue;

      const chosenList = newListId == null
        ? null : listMap.get(newListId);

      const { data, error } = await db
        .from("Tasks")
        .update({
          CanvasExcluded: newExcluded,
          ListID: newListId,
          ListName: chosenList?.Title || null,
          CategoryID: newCategoryId == null
            ? null : Number(newCategoryId)
        })
        .eq("TaskID", taskId)
        .eq("UserID", profile.UserID)
        .eq("IsAssignment", true)
        .select("TaskID");

      if (error) throw error;

      if (data?.length !== 1) {
        throw new Error("Could not update an imported task.");
      }

      updated++;

      if (newExcluded) hidden++;
    }
   

    return reply({
      success: true,
      updated,
      hidden,
      preferencesSaved: items.length
    });

  } catch (error) {
    console.error("canvas-selections:", error);

    return reply({
      error: "Could not save all selections. Retry after refreshing."
    }, 500);
  }
});
