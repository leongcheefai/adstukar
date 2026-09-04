import type {
  LedgerEntry,
  ListLedgerResponse,
  ModerationItem,
  PlacementWithTerms,
  Product,
  Release,
  StatsOverview,
  VerifyProductResponse,
} from "@repo/contracts/types";
import { domainOf } from "./url";

/**
 * Dev-only design mode.
 *
 * It lets the dashboard render with realistic data while the API is not running,
 * so UI work needs no database. It fakes the session and answers both read and
 * write endpoints from the fixtures below.
 *
 * Writes mutate the fixtures in memory only, so every button responds and the
 * screen updates. A page reload restores the starting data. The API stays the
 * only place that decides what a real write accepts.
 *
 * Turn on:  http://localhost:3000/dashboard?design=1
 * Turn off: http://localhost:3000/dashboard?design=0
 *
 * The choice persists in localStorage, so navigation keeps it.
 *
 * `designMode` starts with `import.meta.env.DEV`, which Vite replaces at transform
 * time. A production build gets `false && readFlag()`. The flag is then false, the
 * module has no start-up side effect, and the bundler removes the fixtures below.
 *
 * Vite reads NODE_ENV from the repo-root `.env`. `NODE_ENV=development` there makes
 * plain `pnpm build` produce a DEVELOPMENT bundle, which keeps these fixtures. To
 * check what production really contains, override it:
 *
 *   NODE_ENV=production pnpm --filter @repo/app build
 *   grep -c "prd_\|LaunchKit" apps/app/dist/assets/index-*.js
 *
 * `pnpm launch:check` rejects a production env whose NODE_ENV is not `production`.
 *
 * Keep every fixture inside a function or a plain data literal. A top-level
 * expression that spreads another fixture defeats the whole thing: a spread may
 * call a getter, so the bundler keeps it and pins the data it reads.
 *
 * Credential fields stay empty strings. `verificationToken` and `apiKey` carry no
 * fixture value, because any literal there looks like a leaked secret to a scanner.
 * The verify panel and the placement snippet therefore render a blank key in design
 * mode. That is expected. Start the API to see a real one. Never put a value back.
 */

const STORAGE_KEY = "adstukar:design-mode";

function readFlag(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    const flag = new URLSearchParams(window.location.search).get("design");
    if (flag === "1") {
      localStorage.setItem(STORAGE_KEY, "1");
      return true;
    }
    if (flag === "0") {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Private mode or blocked storage: stay off.
    return false;
  }
}

export const designMode = import.meta.env.DEV && readFlag();

const NOW = new Date("2026-09-01T12:00:00.000Z");

function iso(daysAgo: number, hours = 0): string {
  return new Date(NOW.getTime() - daysAgo * 86_400_000 - hours * 3_600_000).toISOString();
}

/** Matches the shape better-auth's useSession returns, minus fields no page reads. */
export const designSession = {
  user: {
    id: "usr_design",
    name: "Wai Hong",
    email: "waihong@example.com",
    emailVerified: true,
    image: null,
    role: "admin",
    createdAt: new Date(iso(120)),
    updatedAt: new Date(iso(2)),
  },
  session: {
    id: "ses_design",
    token: "design-mode-token",
    userId: "usr_design",
    expiresAt: new Date(NOW.getTime() + 7 * 86_400_000),
    createdAt: new Date(iso(1)),
    updatedAt: new Date(iso(1)),
  },
};

let products: Product[] = [
  {
    id: "prd_launchkit",
    name: "LaunchKit",
    url: "https://launchkit.dev",
    domain: "launchkit.dev",
    tagline: "Ship your side project before the weekend ends.",
    logoUrl: null,
    status: "approved",
    rejectionReason: null,
    verificationToken: "",
    verifiedAt: iso(28),
    advertise: true,
    showAds: true,
    createdAt: iso(30),
    updatedAt: iso(28),
  },
  // Three tagline variants on one domain, so the campaign grouping is visible.
  {
    id: "prd_launchkit_b",
    name: "LaunchKit",
    url: "https://launchkit.dev",
    domain: "launchkit.dev",
    tagline: "From empty repo to live site in one evening.",
    logoUrl: null,
    status: "approved",
    rejectionReason: null,
    verificationToken: "",
    verifiedAt: iso(20),
    advertise: true,
    showAds: true,
    createdAt: iso(21),
    updatedAt: iso(20),
  },
  {
    id: "prd_launchkit_c",
    name: "LaunchKit",
    url: "https://launchkit.dev",
    domain: "launchkit.dev",
    tagline: "Stop configuring. Start shipping.",
    logoUrl: null,
    status: "pending",
    rejectionReason: null,
    verificationToken: "",
    verifiedAt: iso(4),
    advertise: false,
    showAds: true,
    createdAt: iso(5),
    updatedAt: iso(4),
  },
  {
    id: "prd_launchkit_d",
    name: "LaunchKit",
    url: "https://launchkit.dev",
    domain: "launchkit.dev",
    tagline: "The boring parts of a launch, already done.",
    logoUrl: null,
    status: "approved",
    rejectionReason: null,
    verificationToken: "",
    verifiedAt: iso(12),
    advertise: true,
    showAds: true,
    createdAt: iso(13),
    updatedAt: iso(12),
  },
  {
    id: "prd_inboxzero",
    name: "InboxZero",
    url: "https://inboxzero.app",
    domain: "inboxzero.app",
    tagline: "One keyboard shortcut clears your whole morning.",
    logoUrl: null,
    status: "pending",
    rejectionReason: null,
    verificationToken: "",
    verifiedAt: null,
    advertise: true,
    showAds: false,
    createdAt: iso(3),
    updatedAt: iso(3),
  },
  {
    id: "prd_pixelpush",
    name: "PixelPush",
    url: "https://pixelpush.io",
    domain: "pixelpush.io",
    tagline: "Design tokens that survive a rebrand.",
    logoUrl: null,
    status: "rejected",
    rejectionReason: "The landing page did not carry the verification token.",
    verificationToken: "",
    verifiedAt: null,
    advertise: false,
    showAds: true,
    createdAt: iso(14),
    updatedAt: iso(11),
  },
];

let placements: PlacementWithTerms[] = [
  {
    placement: {
      id: "plc_launchkit_docs",
      productId: "prd_launchkit",
      apiKey: "",
      size: "small",
      houseAdPct: 10,
      createdAt: iso(27),
    },
    excludedTerms: ["casino", "crypto", "forex"],
  },
  {
    placement: {
      id: "plc_launchkit_blog",
      productId: "prd_launchkit",
      apiKey: "",
      size: "medium",
      houseAdPct: 0,
      createdAt: iso(9),
    },
    excludedTerms: [],
  },
];

function ledgerEntries(): LedgerEntry[] {
  const rows: LedgerEntry[] = [
    {
      id: "led_0001",
      delta: 50,
      state: "settled",
      reason: "grant",
      impressionId: null,
      relatedEntryId: null,
      createdAt: iso(28),
      settlesAt: null,
      settledAt: iso(28),
    },
  ];
  for (let i = 0; i < 24; i++) {
    const day = Math.floor(i / 3);
    const earn = i % 3 !== 2;
    rows.push({
      id: `led_${String(i + 2).padStart(4, "0")}`,
      delta: earn ? 1 : -2,
      state: day === 0 ? "pending" : "settled",
      reason: earn ? "earn" : "spend",
      impressionId: `imp_${(90_000 + i).toString(36)}`,
      relatedEntryId: null,
      createdAt: iso(day, i % 7),
      settlesAt: earn ? iso(day - 1, i % 7) : null,
      settledAt: day === 0 ? null : iso(day - 1, i % 7),
    });
  }
  return rows;
}

function series(): StatsOverview["series"] {
  return Array.from({ length: 30 }, (_, i) => {
    const day = 29 - i;
    const shown = 40 + Math.round(30 * Math.sin(i / 3.2)) + (i % 5) * 4;
    const received = Math.round(shown * 0.46);
    return {
      day: iso(day).slice(0, 10),
      shown,
      received,
      clicks: Math.max(0, Math.round(received * 0.07)),
    };
  });
}

const stats: StatsOverview = {
  balance: { settled: 1284, pending: 36 },
  today: { shown: 62, received: 28, clicks: 3, ctr: 3 / 28 },
  series: series(),
};

/**
 * Built on first read, never at module load. The second row spreads a product, and a
 * spread can call a getter, so a bundler must assume the initializer has a side effect
 * and keep it. A top-level one would therefore pin `products` into every production
 * bundle. Inside a function it is unreachable, so the whole fixture set drops.
 */
let moderation: ModerationItem[] | null = null;

function moderationRows(): ModerationItem[] {
  moderation ??= [
    {
      product: products[1] as Product,
      owner: { name: "Wai Hong", email: "waihong@example.com" },
    },
    {
      product: {
        ...(products[2] as Product),
        id: "prd_queued",
        name: "TinyCharts",
        domain: "tinycharts.dev",
        url: "https://tinycharts.dev",
        tagline: "Charts that fit in a tweet.",
        status: "pending",
        rejectionReason: null,
        createdAt: iso(1),
        updatedAt: iso(1),
      },
      owner: { name: "Sam Rivera", email: "sam@tinycharts.dev" },
    },
  ];
  return moderation;
}

const releases: Release[] = [
  {
    id: "rel_002",
    tag: "v0.3.0",
    name: "Placement rotation",
    body: "- Rotate a placement API key without losing history\n- Excluded terms editor",
    url: "https://github.com/example/adstukar/releases/tag/v0.3.0",
    prerelease: false,
    publishedAt: iso(6),
    syncedAt: iso(0, 2),
  },
  {
    id: "rel_001",
    tag: "v0.2.0",
    name: "CapyPoints filters",
    body: "- Filter CapyPoints by reason and state\n- Infinite scroll at 50 rows a page",
    url: "https://github.com/example/adstukar/releases/tag/v0.2.0",
    prerelease: false,
    publishedAt: iso(20),
    syncedAt: iso(0, 2),
  },
];

/** The size union, taken from the entity so no db enum import reaches the browser. */
type PlacementSize = PlacementWithTerms["placement"]["size"];

function nowIso(): string {
  return new Date().toISOString();
}

function fakeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "example.com";
  }
}

function replaceProduct(next: Product): Product {
  products = products.map((row) => (row.id === next.id ? next : row));
  return next;
}

function replacePlacement(next: PlacementWithTerms): PlacementWithTerms {
  placements = placements.map((row) => (row.placement.id === next.placement.id ? next : row));
  return next;
}

/**
 * Answers a write request by replacing the matching fixture. Every update builds
 * a new object rather than editing one in place: React Query compares the old
 * and new results, so a mutated object would look unchanged and the row would
 * never repaint.
 *
 * Returns `undefined` when nothing matches, which the caller turns into an error.
 */
function designWrite(route: string, method: string, body?: unknown): unknown {
  const seg = route.split("/").filter(Boolean);
  const patch = (body ?? {}) as Record<string, unknown>;

  if (method === "POST" && route === "/products") {
    const input = patch as { name: string; url: string; tagline: string; logoUrl?: string | null };
    const created: Product = {
      id: fakeId("prd"),
      name: input.name,
      url: input.url,
      domain: hostOf(input.url),
      tagline: input.tagline,
      logoUrl: input.logoUrl ?? null,
      status: "pending",
      rejectionReason: null,
      verificationToken: "",
      verifiedAt: null,
      advertise: true,
      showAds: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    products = [...products, created];
    return created;
  }

  if (seg[0] === "products" && seg[1]) {
    const target = products.find((row) => row.id === seg[1]);
    if (!target) return undefined;

    if (method === "PATCH" && seg.length === 2) {
      const input = patch as Partial<Product>;
      const next: Product = { ...target, ...input, updatedAt: nowIso() };
      // Mirror updateProduct in the API: a new domain needs new proof of
      // ownership and a fresh review. Without this the fixture reports success
      // while the listing never moves the ad to its new campaign.
      if (input.url) {
        const domain = domainOf(input.url);
        if (domain && domain !== target.domain) {
          next.domain = domain;
          next.verifiedAt = null;
          next.status = "pending";
          next.rejectionReason = null;
        }
      }
      return replaceProduct(next);
    }
    if (method === "DELETE" && seg.length === 2) {
      products = products.filter((row) => row.id !== target.id);
      placements = placements.filter((row) => row.placement.productId !== target.id);
      moderation = moderationRows().filter((row) => row.product.id !== target.id);
      return { id: target.id };
    }
    if (method === "POST" && seg[2] === "verify") {
      replaceProduct({ ...target, verifiedAt: nowIso(), updatedAt: nowIso() });
      const response: VerifyProductResponse = {
        verified: true,
        method: "well-known",
        message: "Design mode accepts any token. The API does the real check.",
      };
      return response;
    }
  }

  if (method === "POST" && route === "/placements") {
    const input = patch as { productId: string; size?: PlacementSize; houseAdPct?: number };
    const created: PlacementWithTerms = {
      placement: {
        id: fakeId("plc"),
        productId: input.productId,
        apiKey: "",
        size: input.size ?? "small",
        houseAdPct: input.houseAdPct ?? 0,
        createdAt: nowIso(),
      },
      excludedTerms: [],
    };
    placements = [...placements, created];
    return created;
  }

  if (seg[0] === "placements" && seg[1]) {
    const target = placements.find((row) => row.placement.id === seg[1]);
    if (!target) return undefined;

    if (method === "PATCH" && seg.length === 2) {
      const size = patch.size as PlacementSize | undefined;
      const houseAdPct = patch.houseAdPct as number | undefined;
      return replacePlacement({
        ...target,
        placement: {
          ...target.placement,
          ...(size !== undefined ? { size } : {}),
          ...(houseAdPct !== undefined ? { houseAdPct } : {}),
        },
      });
    }
    if (method === "POST" && seg[2] === "rotate-key") {
      return replacePlacement({
        ...target,
        placement: { ...target.placement, apiKey: "" },
      });
    }
    if (method === "PUT" && seg[2] === "excluded-terms") {
      const phrases = (patch.phrases as string[] | undefined) ?? [];
      return replacePlacement({ ...target, excludedTerms: [...phrases] });
    }
    if (method === "DELETE" && seg.length === 2) {
      placements = placements.filter((row) => row.placement.id !== target.placement.id);
      return { id: target.placement.id };
    }
  }

  // A queued item is not always in `products`, so the moderation row is the source.
  if (method === "POST" && seg[0] === "admin" && seg[1] === "products" && seg[2]) {
    const productId = seg[2];
    const queued = moderationRows().find((row) => row.product.id === productId);
    const target = products.find((row) => row.id === productId) ?? queued?.product;
    if (!target) return undefined;

    let decided: Product | null = null;
    if (seg[3] === "approve") {
      decided = {
        ...target,
        status: "approved",
        rejectionReason: null,
        verifiedAt: target.verifiedAt ?? nowIso(),
        updatedAt: nowIso(),
      };
    }
    if (seg[3] === "reject") {
      decided = {
        ...target,
        status: "rejected",
        rejectionReason: (patch.reason as string | undefined) ?? "No reason given.",
        updatedAt: nowIso(),
      };
    }
    if (!decided) return undefined;

    moderation = moderationRows().filter((row) => row.product.id !== productId);
    if (products.some((row) => row.id === productId)) replaceProduct(decided);
    return decided;
  }

  // The presigned PUT never leaves the browser in design mode; `uploadLogo`
  // short-circuits before it. This only keeps the call from throwing.
  if (method === "POST" && route === "/uploads/logo/presign") {
    return {
      uploadUrl: "https://example.invalid/upload",
      publicUrl: "https://example.invalid/logo",
    };
  }

  return undefined;
}

/**
 * Answers a request from the fixtures. Returns `undefined` when nothing matches,
 * which the caller turns into an explicit error.
 */
export function designResponse(path: string, method: string, body?: unknown): unknown {
  const route = path.split("?")[0] ?? path;

  // The one write design mode answers: reading a page's metadata changes nothing.
  if (method === "POST" && route === "/products/metadata") {
    const url = (body as { url?: string } | undefined)?.url ?? "";
    let host = "example.com";
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      // Leave the placeholder host.
    }
    const label = host.split(".")[0] ?? "";
    return {
      name: label.charAt(0).toUpperCase() + label.slice(1),
      tagline: "Ship notes for indie makers.",
      logoUrl: null,
    };
  }

  if (method !== "GET") return designWrite(route, method, body);

  switch (route) {
    case "/stats/overview":
      return stats;
    case "/products":
      return products.map((row) => ({ ...row }));
    case "/placements":
      return placements.map((row) => ({
        placement: { ...row.placement },
        excludedTerms: [...row.excludedTerms],
      }));
    case "/admin/moderation":
      return moderationRows().map((row) => ({
        product: { ...row.product },
        owner: { ...row.owner },
      }));
    case "/releases":
      return releases;
    case "/me/has-password":
      return { hasPassword: true };
    default:
      break;
  }

  if (route === "/ledger") {
    const response: ListLedgerResponse = { items: ledgerEntries(), nextCursor: null };
    return response;
  }

  return undefined;
}
