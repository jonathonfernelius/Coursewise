// canvas preview
import { createClient } from "npm:@supabase/supabase-js@2";

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

function decodeIcal(s: string) {
  return s.replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseEvents(raw: string) {
  const unfolded = raw.replace(/\r?\n[ \t]/g, "");
  const results = [];

  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const lines = block.split(/\r?\n/);

    const field = (name: string) => {
      const line = lines.find(
        l => l.toUpperCase().split(":")[0].split(";")[0] === name
      );
      return line?.slice(line.indexOf(":") + 1) ?? "";
    };

    const uid = field("UID").trim();
    const title = decodeIcal(field("SUMMARY")).trim();
    const dateValue = field("DTSTART") || field("DUE");

    if (!uid || !title) continue;

    const m = dateValue.match(/^(\d{4})(\d{2})(\d{2})/);
    const due = m ? `${m[1]}-${m[2]}-${m[3]}` : null;

    // Only guess a course when the title has [Course].
    const bracket = title.match(/\[([^\]]+)\]\s*$/);

    results.push({
      uid,
      title,
      due,
      course: bracket?.[1] || "Unsorted",
      kind: /assignment/i.test(
        field("DESCRIPTION") + " " + title
      ) ? "possible_assignment" : "calendar_event"
    });

    if (results.length >= 1000) break;
  }

  return results;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return reply({ error: "POST only." }, 405);
  }

  try {
    const bearer = req.headers.get("Authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!bearer) {
      return reply({ error: "Please sign in again." }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !key) {
      return reply({ error: "Server configuration missing." }, 500);
    }

    const db = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: { user }, error: authError } =
      await db.auth.getUser(bearer);

    if (authError || !user) {
      return reply({ error: "Sign-in expired." }, 401);
    }

    let body: { accountId?: string };
    try { body = await req.json(); } catch { return reply({ error: "Invalid request." }, 400); }
    let accountId = body.accountId;
    if (accountId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accountId)) {
      return reply({ error: "Invalid Canvas connection." }, 400);
    }
    if (!accountId) {
      const { data: connectedAccounts, error: listError } = await db.from("CanvasAccounts")
        .select("CanvasAccountID").eq("AuthUserID", user.id).eq("IsConnected", true);
      if (listError) throw listError;
      if (connectedAccounts?.length !== 1) return reply({ error: "Choose which Canvas connection to preview." }, 400);
      accountId = connectedAccounts[0].CanvasAccountID;
    }
    if (!accountId) return reply({ error: "Choose which Canvas connection to preview." }, 400);

    const { data, error } = await db
      .from("CanvasAccounts")
      .select("FeedURL,CanvasAccountID,Label")
      .eq("CanvasAccountID", accountId)
      .eq("AuthUserID", user.id)
      .eq("IsConnected", true)
      .maybeSingle();

    if (error) throw error;

    if (!data?.FeedURL) {
      return reply({
        error: "Connect your Canvas calendar first."
      }, 400);
    }

    let feedHref: string;
    try {
      feedHref = await validFeed(data.FeedURL);
    } catch {
      return reply({
        error: "Saved feed URL is not a recognized Canvas calendar URL. Please reconnect Canvas."
      }, 400);
    }

    const canvasStart = performance.now();

    const response = await fetch(feedHref, {
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "text/calendar" }
    });

    console.log(
      "Canvas fetch:",
      Math.round(performance.now() - canvasStart),
      "ms"
    );

    if (!response.ok) {
      return reply({
        error: "Canvas feed could not be read."
      }, 502);
    }

    if (
      Number(response.headers.get("content-length") || 0)
      > 1000000
    ) {
      return reply({ error: "Calendar feed is too large." }, 413);
    }

    const reader = response.body?.getReader();

    if (!reader) {
      return reply({ error: "Empty Canvas response." }, 502);
    }

    const chunks: Uint8Array[] = [];
    let size = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        size += value.byteLength;

        if (size > 1000000) {
          await reader.cancel();
          return reply({ error: "Calendar feed too large." }, 413);
        }

        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const bytes = new Uint8Array(size);
    let p = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, p);
      p += chunk.length;
    }

    const ics = new TextDecoder().decode(bytes);

    console.log(
      "Canvas fetch + download:",
      Math.round(performance.now() - canvasStart),
      "ms"
    );

    if (!ics.includes("BEGIN:VCALENDAR")) {
      return reply({ error: "Not a calendar feed." }, 502);
    }

    const events = parseEvents(ics);

    return reply({
      accountId: data.CanvasAccountID,
      accountLabel: data.Label,
      events,
      count: events.length,
      note: "Preview only. No tasks have been imported."
    });

  } catch (err) {
    console.error(
      "canvas-preview:",
      err instanceof Error ? err.message : err
    );

    return reply({
      error: "Could not preview Canvas calendar."
    }, 500);
  }
});
