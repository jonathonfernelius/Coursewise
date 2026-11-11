// Coursewise — Canvas connection Edge Function (step 2)
// Deploy as: canvas-connect
// Handles connecting, checking status, and disconnecting a Canvas calendar feed.
// Works with any school's Canvas (school.instructure.com or a school's own domain).
// Does not import tasks yet. The feed URL is never returned to the browser.
import { createClient } from 'npm:@supabase/supabase-js@2';

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: jsonHeaders });

// ---------------------------------------------------------------------------
// Canvas feed validation (works for any school; no hostname allowlist).
// Because this function fetches whatever address a user pastes, it only accepts a
// public https Canvas calendar feed: /feeds/calendars/<token>.ics on a public DNS name
// that does not resolve to a private or reserved address. Fetches must use
// redirect: "manual" and the response must be an iCalendar file.
// ---------------------------------------------------------------------------
type DnsResolver = (hostname: string) => Promise<string[] | null>;

const FEED_PATH = /^\/feeds\/calendars\/[^/]+\.ics$/i;
const INTERNAL_SUFFIXES = [
  ".localhost", ".local", ".internal", ".intranet", ".lan", ".home", ".corp", ".private", ".arpa"
];

function ipv4Parts(host: string): number[] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every(n => n <= 255) ? parts : null;
}

function isPrivateIPv4(p: number[]): boolean {
  const [a, b, c] = p;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||      // carrier-grade NAT
    (a === 169 && b === 254) ||                // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19)) ||   // benchmarking
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224                                   // multicast and reserved
  );
}

function ipv6Groups(input: string): number[] | null {
  let addr = input.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  // Embedded IPv4 tail, e.g. ::ffff:10.0.0.1
  const tail = addr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (tail) {
    const v4 = ipv4Parts(tail[1]);
    if (!v4) return null;
    addr = addr.slice(0, -tail[1].length) +
      ((v4[0] << 8) | v4[1]).toString(16) + ":" + ((v4[2] << 8) | v4[3]).toString(16);
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...rest]
    .map(g => parseInt(g, 16));
  return groups.length === 8 && groups.every(g => Number.isInteger(g) && g >= 0 && g <= 0xffff)
    ? groups : null;
}

function isPrivateIPv6(addr: string): boolean {
  const g = ipv6Groups(addr);
  if (!g) return true; // unparseable: treat as unsafe
  if (g.every(n => n === 0)) return true;                              // ::
  if (g.slice(0, 7).every(n => n === 0) && g[7] === 1) return true;   // ::1
  if ((g[0] & 0xfe00) === 0xfc00) return true;                         // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true;                         // fe80::/10 link-local
  if ((g[0] & 0xffc0) === 0xfec0) return true;                         // fec0::/10 site-local
  if ((g[0] & 0xff00) === 0xff00) return true;                         // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true;                 // documentation
  const v4 = [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255];
  const mapped = g.slice(0, 5).every(n => n === 0) && g[5] === 0xffff; // ::ffff:a.b.c.d
  const nat64 = g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every(n => n === 0);
  const compat = g.slice(0, 6).every(n => n === 0);                    // ::a.b.c.d
  return (mapped || nat64 || compat) ? isPrivateIPv4(v4) : false;
}

function isPrivateAddress(ip: string): boolean {
  const v4 = ipv4Parts(ip);
  return v4 ? isPrivateIPv4(v4) : isPrivateIPv6(ip);
}

// Default resolver: A and AAAA records via Deno. Returns null when DNS lookups are unavailable
// in the runtime, in which case the hostname rules above are the only host check.
const denoResolver: DnsResolver = async hostname => {
  const d = (globalThis as any).Deno;
  if (!d?.resolveDns) return null;
  const found: string[] = [];
  let hardFailure = false;
  for (const type of ["A", "AAAA"]) {
    try {
      found.push(...await d.resolveDns(hostname, type));
    } catch (error) {
      if ((error as Error)?.name !== "NotFound") hardFailure = true;
    }
  }
  if (!found.length && hardFailure) return null;
  return found;
};

async function validFeed(input: string, resolver: DnsResolver = denoResolver): Promise<string> {
  const bad = () => new Error(
    "That doesn't look like a Canvas calendar feed link. In Canvas, open Calendar, choose Calendar Feed, and copy the address that ends in .ics."
  );

  let url: URL;
  try { url = new URL(String(input).trim()); } catch { throw bad(); }

  if (
    url.protocol !== "https:" || url.port || url.username || url.password || url.hash ||
    !FEED_PATH.test(url.pathname)
  ) throw bad();

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const isIpLiteral = ipv4Parts(host) !== null || host.includes(":") || host.startsWith("[") ||
    /^[\d.]+$/.test(host);
  if (
    !host || isIpLiteral || !host.includes(".") || host === "localhost" ||
    INTERNAL_SUFFIXES.some(s => host.endsWith(s)) || !/^[a-z0-9.-]+$/.test(host)
  ) throw bad();

  const addresses = await resolver(host);
  if (addresses) {
    if (!addresses.length) throw new Error("We couldn't find that Canvas address. Check the link and try again.");
    if (addresses.some(isPrivateAddress)) throw bad();
  }
  return url.href;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt || jwt === authHeader) return reply({ error: 'Please sign in to Coursewise.' }, 401);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // The legacy service_role key is used only inside this trusted Edge Function.
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return reply({ error: 'Server configuration is incomplete.' }, 500);
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: userError } = await db.auth.getUser(jwt);
    if (userError || !user) return reply({ error: 'Your session has expired. Please sign in again.' }, 401);

    let data: { action?: string; feedUrl?: string; label?: string; accountId?: string; deleteImportedTasks?: boolean };
    try { data = await req.json(); } catch { return reply({ error: 'Invalid request.' }, 400); }
    if (data.action === 'status') {
      const { data: accounts, error } = await db.from('CanvasAccounts')
        .select('CanvasAccountID,Label,HostName,IsConnected,ConnectedAt,LastSyncedAt,LastSyncError,CreatedAt')
        .eq('AuthUserID', user.id).order('CreatedAt', { ascending: true });
      if (error) throw error;
      const rows = accounts || [];
      return reply({
        connected: rows.some(account => account.IsConnected),
        accounts: rows
      });
    }
    if (data.action === 'disconnect') {
      let accountId = data.accountId;
      if (!accountId) {
        const { data: rows, error } = await db.from('CanvasAccounts')
          .select('CanvasAccountID').eq('AuthUserID', user.id).eq('IsConnected', true);
        if (error) throw error;
        if (rows?.length !== 1) return reply({ error: 'Choose which Canvas connection to disconnect.' }, 400);
        accountId = rows[0].CanvasAccountID;
      }
      const { data: account, error: readError } = await db.from('CanvasAccounts')
        .select('CanvasAccountID,Label').eq('CanvasAccountID', accountId)
        .eq('AuthUserID', user.id).maybeSingle();
      if (readError) throw readError;
      if (!account) return reply({ error: 'Canvas connection not found.' }, 404);
      if (data.deleteImportedTasks === true) {
        const { data: removed, error } = await db.rpc('coursewise_remove_canvas_account', {
          p_auth_user_id: user.id,
          p_canvas_account_id: account.CanvasAccountID
        });
        if (error) throw error;
        return reply({ connected: false, removed: true, deletedTasks: Number(removed) || 0 });
      }
      const { error } = await db.from('CanvasAccounts').update({
        IsConnected: false,
        LastSyncError: null
      }).eq('CanvasAccountID', account.CanvasAccountID).eq('AuthUserID', user.id);
      if (error) throw error;
      return reply({ connected: false, removed: false, label: account.Label });
    }
    if (data.action === 'rename') {
      if (!data.accountId || typeof data.label !== 'string') return reply({ error: 'Choose a connection and enter a label.' }, 400);
      const label = data.label.trim().replace(/\s+/g, ' ');
      if (!label || label.length > 50) return reply({ error: 'Use a label from 1 to 50 characters.' }, 400);
      const { data: accounts, error: listError } = await db.from('CanvasAccounts')
        .select('CanvasAccountID,Label').eq('AuthUserID', user.id);
      if (listError) throw listError;
      if ((accounts || []).some(row => row.CanvasAccountID !== data.accountId && row.Label.toLocaleLowerCase() === label.toLocaleLowerCase())) {
        return reply({ error: 'That label is already used for another Canvas connection.' }, 409);
      }
      const { data: renamed, error } = await db.from('CanvasAccounts').update({ Label: label })
        .eq('CanvasAccountID', data.accountId).eq('AuthUserID', user.id)
        .select('CanvasAccountID,Label').maybeSingle();
      if (error) throw error;
      if (!renamed) return reply({ error: 'Canvas connection not found.' }, 404);
      return reply({ account: renamed });
    }
    if (data.action === 'reconnect') {
      if (!data.accountId) return reply({ error: 'Choose a Canvas connection to reconnect.' }, 400);
      const { data: account, error: readError } = await db.from('CanvasAccounts')
        .select('CanvasAccountID,Label,FeedURL,HostName,ConnectedAt')
        .eq('CanvasAccountID', data.accountId).eq('AuthUserID', user.id).maybeSingle();
      if (readError) throw readError;
      if (!account?.FeedURL) return reply({ error: 'Canvas connection not found. Add it again with its calendar feed URL.' }, 404);
      let savedFeed: string;
      try { savedFeed = await validFeed(account.FeedURL); } catch {
        return reply({ error: 'Saved Canvas feed is no longer valid. Add this connection again with its calendar feed URL.' }, 400);
      }
      const response = await fetch(savedFeed, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { Accept: 'text/calendar' } });
      if (!response.ok) return reply({ error: 'Canvas feed could not be reached. Check the feed in Canvas and add the connection again.' }, 400);
      const { data: updated, error } = await db.from('CanvasAccounts').update({ IsConnected: true, ConnectedAt: new Date().toISOString(), LastSyncError: null })
        .eq('CanvasAccountID', account.CanvasAccountID).eq('AuthUserID', user.id)
        .select('CanvasAccountID,Label,HostName,IsConnected,ConnectedAt').single();
      if (error) throw error;
      return reply({ connected: true, account: updated });
    }
    if (data.action !== 'connect') return reply({ error: 'Unknown action.' }, 400);
    if (typeof data.feedUrl !== 'string' || data.feedUrl.length > 2500) {
      return reply({ error: 'Enter your Canvas calendar feed URL.' }, 400);
    }
    let feedUrl: string;
    try { feedUrl = await validFeed(data.feedUrl); } catch (e) { return reply({ error: (e as Error).message }, 400); }
    if (data.accountId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.accountId)) {
      return reply({ error: 'Invalid Canvas connection.' }, 400);
    }

    // Verify feed is accessible. Never follow redirects to other hosts or internal networks.
    const response = await fetch(feedUrl, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { Accept: 'text/calendar' } });
    if (!response.ok) return reply({ error: 'Canvas did not return a readable feed. Check the link and try again.' }, 400);
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > 1_000_000) return reply({ error: 'This calendar feed is too large.' }, 400);
    // Bound actual downloaded bytes too, even if Content-Length is absent.
    const reader = response.body?.getReader();
    if (!reader) return reply({ error: 'Canvas returned an empty response.' }, 400);
    const chunks: Uint8Array[] = []; let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        total += value.byteLength;
        if (total > 1_000_000) { await reader.cancel(); return reply({ error: 'This calendar feed is too large.' }, 400); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const ics = new TextDecoder().decode(bytes).replace(/^\uFEFF/, '');
    if (!ics.includes('BEGIN:VCALENDAR') || !ics.includes('END:VCALENDAR')) return reply({ error: 'That link did not return an iCal calendar.' }, 400);

    const hostname = new URL(feedUrl).hostname.toLowerCase();
    const parts = hostname.split('.');
    const defaultLabel = ['www', 'canvas', 'learn'].includes(parts[0]) && parts[1] ? parts[1] : parts[0];
    let label = typeof data.label === 'string' ? data.label.trim().replace(/\s+/g, ' ') : '';
    if (label.length > 50) return reply({ error: 'Use a label up to 50 characters.' }, 400);

    const { data: accounts, error: accountsError } = await db.from('CanvasAccounts')
      .select('CanvasAccountID,Label,FeedURL,IsConnected,ConnectedAt').eq('AuthUserID', user.id);
    if (accountsError) throw accountsError;
    let existing = data.accountId
      ? (accounts || []).find(row => row.CanvasAccountID === data.accountId)
      : (accounts || []).find(row => row.FeedURL === feedUrl);
    if (data.accountId && !existing) return reply({ error: 'Canvas connection not found.' }, 404);
    const customLabel = Boolean(label);
    if (!label) label = existing?.Label || defaultLabel || 'Canvas';
    const duplicateLabel = (accounts || []).some(row => row.CanvasAccountID !== existing?.CanvasAccountID && row.Label.toLocaleLowerCase() === label.toLocaleLowerCase());
    if (duplicateLabel && customLabel) return reply({ error: 'That label is already used for another Canvas connection.' }, 409);
    if (duplicateLabel) {
      const base = label.slice(0, 44);
      let suffix = 2;
      while ((accounts || []).some(row => row.CanvasAccountID !== existing?.CanvasAccountID && row.Label.toLocaleLowerCase() === `${base} ${suffix}`.toLocaleLowerCase())) suffix++;
      label = `${base} ${suffix}`;
    }

    const { data: saved, error: saveError } = await db.from('CanvasAccounts').upsert({
      ...(existing ? { CanvasAccountID: existing.CanvasAccountID } : {}),
      AuthUserID: user.id,
      Label: label,
      HostName: hostname,
      FeedURL: feedUrl,
      IsConnected: true,
      ConnectedAt: existing?.ConnectedAt || new Date().toISOString(),
      LastSyncedAt: null,
      LastSyncError: null
    }, { onConflict: 'CanvasAccountID' }).select('CanvasAccountID,Label,HostName,IsConnected,ConnectedAt').single();
    if (saveError) throw saveError;
    return reply({ connected: true, account: saved, message: 'Canvas calendar connected.' });
  } catch (err) {
    console.error('canvas-connect error', err instanceof Error ? err.message : err);
    return reply({ error: 'Could not complete the Canvas request.' }, 500);
  }
});
