/**
 * The network an address belongs to, as a prefix: `/24` for IPv4 and `/64` for
 * IPv6. Several devices reporting from one network is a fraud signal, and a
 * prefix answers that question without keeping an address that identifies a
 * household. Returns null when the server could not read an address at all.
 */
export function networkOf(ip: string): string | null {
  const address = ip.trim();
  if (!address) return null;

  // A dual-stack socket reports an IPv4 client as `::ffff:203.0.113.42`.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  const candidate = mapped?.[1] ?? address;

  if (candidate.includes(".")) {
    const groups = candidate.split(".");
    if (groups.length !== 4) return null;
    if (!groups.every((group) => /^\d{1,3}$/.test(group) && Number(group) <= 255)) return null;
    return `${groups[0]}.${groups[1]}.${groups[2]}.0/24`;
  }

  if (!candidate.includes(":")) return null;
  // `::` stands for a run of zero groups, so it is expanded before the first four
  // are read. Two addresses that shorten differently must give one prefix.
  const [head = "", tail = ""] = candidate.split("::", 2);
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const zeros = candidate.includes("::")
    ? Math.max(0, 8 - headGroups.length - tailGroups.length)
    : 0;
  const groups = candidate.includes("::")
    ? [...headGroups, ...Array.from({ length: zeros }, () => "0"), ...tailGroups]
    : candidate.split(":");
  if (groups.length < 4) return null;
  if (!groups.slice(0, 4).every((group) => /^[0-9a-f]{1,4}$/i.test(group))) return null;
  return `${groups.slice(0, 4).join(":").toLowerCase()}::/64`;
}
