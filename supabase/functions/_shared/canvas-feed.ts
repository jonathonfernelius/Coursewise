// Shared Canvas feed validation, used by every function that fetches a Canvas calendar feed.
//
// Coursewise supports any school, so there is no hostname allowlist. Schools use
// <school>.instructure.com or their own domain (canvas.school.edu, learn.school.edu, ...).
// Because this server fetches whatever address a user pastes, the checks below keep it from
// being pointed at anything that is not a public Canvas calendar feed:
//   - https only, default port, no credentials or fragment
//   - the path must look like a Canvas feed: /feeds/calendars/<token>.ics
//   - the host must be a public DNS name (no IP addresses, localhost, or internal-only suffixes)
//   - the host must not resolve to a private, loopback, link-local or otherwise reserved address
// Callers must also fetch with redirect: "manual" and confirm the body is an iCalendar file.

export type DnsResolver = (hostname: string) => Promise<string[] | null>;

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

export function isPrivateIPv4(p: number[]): boolean {
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

export function isPrivateIPv6(addr: string): boolean {
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

export function isPrivateAddress(ip: string): boolean {
  const v4 = ipv4Parts(ip);
  return v4 ? isPrivateIPv4(v4) : isPrivateIPv6(ip);
}

// Default resolver: A and AAAA records via Deno. Returns null when DNS lookups are unavailable
// in the runtime, in which case the hostname rules above are the only host check.
export const denoResolver: DnsResolver = async hostname => {
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

export async function validFeed(input: string, resolver: DnsResolver = denoResolver): Promise<string> {
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
