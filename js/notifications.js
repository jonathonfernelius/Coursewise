/* Per-device Web Push setup. Permission is requested only after a user action. */
(() => {
  const db = window.tidyClient;
  const table = "coursewise_push_subscriptions";
  const supported = () => "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  function decodeVapidKey(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
    return Uint8Array.from(raw, char => char.charCodeAt(0));
  }

  async function registration() {
    if (!supported()) throw new Error("This browser does not support web push notifications.");
    const script = new URL("service-worker.js", document.baseURI);
    const scope = new URL("./", script).pathname;
    return navigator.serviceWorker.register(script.href, { scope });
  }

  async function currentUserId() {
    if (!db) throw new Error("Could not load Supabase. Reload the page and try again.");
    const { data, error } = await db.auth.getUser();
    if (error || !data?.user?.id) throw new Error("Please sign in again to set up notifications.");
    return data.user.id;
  }

  async function status() {
    if (!supported()) return { supported: false, enabled: false, permission: "unsupported" };
    const permission = Notification.permission;
    if (permission !== "granted") return { supported: true, enabled: false, permission };
    try {
      const reg = await navigator.serviceWorker.getRegistration(new URL("./", document.baseURI).pathname);
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return { supported: true, enabled: false, permission };
      const userId = await currentUserId();
      const { data, error } = await db.from(table).select("id")
        .eq("auth_user_id", userId).eq("endpoint", sub.endpoint).maybeSingle();
      return { supported: true, enabled: !error && !!data, permission, needsSync: !!error || !data };
    } catch {
      return { supported: true, enabled: false, permission, needsSync: true };
    }
  }

  async function enable() {
    await currentUserId();
    if (!supported()) throw new Error("This browser does not support web push notifications. Try a current version of Chrome, Edge, Firefox, or Safari.");
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const installed = window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
    if (ios && !installed) throw new Error("On iPhone or iPad, first use Safari’s Share button → Add to Home Screen, then open Coursewise from its new Home Screen icon and enable notifications there.");
    const publicKey = window.TidyConfig?.vapidPublicKey;
    if (!publicKey) throw new Error("Notifications are not configured yet. Add the public VAPID key to js/supabase.js and reload.");

    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error(permission === "denied"
        ? "Notifications are blocked for Coursewise in your browser or device settings. Allow them there, then try again."
        : "Notification permission was not granted.");
    }

    const pendingRegistration = await registration();
    const readyRegistration = await navigator.serviceWorker.ready;
    const reg = readyRegistration.scope === pendingRegistration.scope ? readyRegistration : pendingRegistration;
    const subscription = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey)
    });
    const { error } = await db.rpc("coursewise_save_push_subscription", {
      p_endpoint: subscription.endpoint,
      p_subscription: subscription.toJSON(),
      p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    });
    if (error) throw new Error(`The browser allowed notifications, but Coursewise could not save this device: ${error.message}`);
    return status();
  }

  async function disable() {
    const userId = await currentUserId();
    if (!supported()) return { enabled: false, supported: false };
    const reg = await navigator.serviceWorker.getRegistration(new URL("./", document.baseURI).pathname);
    const subscription = await reg?.pushManager.getSubscription();
    if (!subscription) return { enabled: false, supported: true, permission: Notification.permission };
    const { error } = await db.from(table).delete()
      .eq("auth_user_id", userId).eq("endpoint", subscription.endpoint);
    if (error) throw new Error(`Could not remove this device from Coursewise notifications: ${error.message}`);
    await subscription.unsubscribe();
    return { enabled: false, supported: true, permission: Notification.permission };
  }

  window.CoursewiseNotifications = { supported, status, enable, disable };
})();
