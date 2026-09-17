import { economy, pointsToUsdCents } from "@repo/config/economy";
import type {
  Campaign,
  CampaignWithListings,
  DeviceForAdmin,
  DeviceTier,
  DeviceWithTerms,
  LedgerEntry,
  ListLedgerResponse,
  Listing,
  ModerationQueue,
  PayoutAccount,
  PayoutOverview,
  PayoutQueue,
  PayoutRequest,
  Placement,
  PlacementFormat,
  PlacementSize,
  Release,
  StatsOverview,
  Topup,
  TopupOverview,
  TopupQueue,
  TopupRefundBlock,
  VenueType,
  VerifyCampaignResponse,
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
 *   grep -c "cmp_\|LaunchKit" apps/app/dist/assets/index-*.js
 *
 * `pnpm launch:check` rejects a production env whose NODE_ENV is not `production`.
 *
 * Keep every fixture inside a function or a plain data literal. A top-level
 * expression that spreads another fixture defeats the whole thing: a spread may
 * call a getter, so the bundler keeps it and pins the data it reads.
 *
 * Credential fields stay empty strings. `verificationToken` and `apiKey` carry no
 * fixture value, because any literal there looks like a leaked secret to a scanner.
 * The verify panel and the device detail therefore render a blank key in design
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

function campaignFixture(
  id: string,
  name: string,
  url: string,
  state: Campaign["state"],
  verifiedDaysAgo: number | null,
  createdDaysAgo: number,
  /** Set on a campaign the system stopped, so the pause note is on screen. */
  pauseReason: Campaign["pauseReason"] = null,
): Campaign {
  return {
    id,
    name,
    url,
    domain: domainOf(url),
    state,
    pauseReason,
    pausedAt: pauseReason === null ? null : iso(0),
    dailyBudget: economy.caps.defaultDailyBudget,
    verificationToken: "",
    verifiedAt: verifiedDaysAgo === null ? null : iso(verifiedDaysAgo),
    createdAt: iso(createdDaysAgo),
    updatedAt: iso(Math.max(0, createdDaysAgo - 2)),
  };
}

function listingFixture(
  id: string,
  campaignId: string,
  tagline: string,
  state: Listing["state"],
  createdDaysAgo: number,
  rejectionReason: string | null = null,
): Listing {
  return {
    id,
    campaignId,
    tagline,
    logoUrl: null,
    state,
    rejectionReason,
    createdAt: iso(createdDaysAgo),
    updatedAt: iso(Math.max(0, createdDaysAgo - 1)),
  };
}

let campaigns: CampaignWithListings[] = [
  {
    campaign: campaignFixture(
      "cmp_launchkit",
      "LaunchKit",
      "https://launchkit.dev",
      "active",
      28,
      30,
    ),
    // Four taglines on one campaign, so the full grid is visible.
    listings: [
      listingFixture(
        "lst_launchkit_a",
        "cmp_launchkit",
        "Ship your side project before the weekend ends.",
        "approved",
        30,
      ),
      listingFixture(
        "lst_launchkit_b",
        "cmp_launchkit",
        "From empty repo to live site in one evening.",
        "approved",
        21,
      ),
      listingFixture(
        "lst_launchkit_c",
        "cmp_launchkit",
        "Stop configuring. Start shipping.",
        "pending",
        5,
      ),
      listingFixture(
        "lst_launchkit_d",
        "cmp_launchkit",
        "The boring parts of a launch, already done.",
        "approved",
        13,
      ),
    ],
    spentToday: 8_400,
  },
  {
    campaign: campaignFixture(
      "cmp_inboxzero",
      "InboxZero",
      "https://inboxzero.app",
      "draft",
      null,
      3,
    ),
    listings: [
      listingFixture(
        "lst_inboxzero",
        "cmp_inboxzero",
        "One keyboard shortcut clears your whole morning.",
        "pending",
        3,
      ),
    ],
    spentToday: 0,
  },
  {
    // Stopped by its own budget, so the pause note is on screen in design mode.
    campaign: campaignFixture(
      "cmp_pixelpush",
      "PixelPush",
      "https://pixelpush.io",
      "paused",
      14,
      14,
      "budget",
    ),
    listings: [
      listingFixture(
        "lst_pixelpush",
        "cmp_pixelpush",
        "Design tokens that survive a rebrand.",
        "rejected",
        14,
        "The landing page did not carry the verification token.",
      ),
    ],
    spentToday: economy.caps.defaultDailyBudget,
  },
];

let devices: DeviceWithTerms[] = [
  {
    device: {
      id: "dev_bangsar",
      name: "Counter screen",
      openHour: 8,
      closeHour: 18,
      timezone: "Asia/Kuala_Lumpur",
      deviceId: "K7QW-3MTP",
      apiKey: "",
      venueType: "cafe",
      location: "Front counter, Jalan Telawi",
      photoUrl: null,
      promotionName: "Kedai Kopi",
      promotionTagline: "Two for one before 11am",
      promotionUrl: "https://kedaikopi.example",
      promotionLogoUrl: null,
      tier: "premium",
      state: "approved",
      rejectionReason: null,
      dailyPlayCap: economy.caps.dailyPlaysPerDevice,
      approvedAt: iso(26),
      createdAt: iso(27),
      updatedAt: iso(26),
    },
    excludedTerms: ["casino", "crypto", "forex"],
    vetoedListingIds: [],
  },
  {
    device: {
      id: "dev_ss15",
      name: "Weights floor screen",
      openHour: null,
      closeHour: null,
      timezone: null,
      deviceId: "R4NB-8XJD",
      apiKey: "",
      venueType: "gym",
      location: "Weights floor, SS15",
      photoUrl: null,
      promotionName: null,
      promotionTagline: null,
      promotionUrl: null,
      promotionLogoUrl: null,
      tier: "standard",
      state: "pending",
      rejectionReason: null,
      dailyPlayCap: economy.caps.dailyPlaysPerDevice,
      approvedAt: null,
      createdAt: iso(2),
      updatedAt: iso(2),
    },
    excludedTerms: [],
    vetoedListingIds: [],
  },
];

let placements: Placement[] = [
  {
    id: "plc_bangsar_band",
    deviceId: "dev_bangsar",
    format: "band",
    size: "medium",
    dwellSeconds: economy.placement.dwellSeconds.default,
    gapSeconds: economy.placement.gapSeconds.default,
    createdAt: iso(26),
  },
  {
    id: "plc_bangsar_ticker",
    deviceId: "dev_bangsar",
    format: "ticker",
    size: "small",
    dwellSeconds: 8,
    gapSeconds: 300,
    createdAt: iso(9),
  },
];

function ledgerEntries(): LedgerEntry[] {
  const rows: LedgerEntry[] = [
    {
      id: "led_0001",
      delta: economy.grants.firstListingApproval,
      state: "settled",
      reason: "grant",
      lot: "granted",
      playId: null,
      relatedEntryId: null,
      createdAt: iso(28),
      settlesAt: null,
      settledAt: iso(28),
    },
  ];
  // Each play writes three rows: the advertiser's spend, the earn, and the fee
  // that comes back off the earn. Showing all three is the point of the page.
  for (let i = 0; i < 24; i++) {
    const day = Math.floor(i / 3);
    const kind = i % 3;
    const playId = `ply_${(90_000 + i).toString(36)}`;
    const settled = day !== 0;
    rows.push({
      id: `led_${String(i + 2).padStart(4, "0")}`,
      delta: kind === 0 ? 12 : kind === 1 ? -3 : -12,
      state: settled ? "settled" : "pending",
      reason: kind === 0 ? "earn" : kind === 1 ? "fee" : "spend",
      lot: kind === 2 ? "bought" : "earned",
      playId,
      relatedEntryId: null,
      createdAt: iso(day, i % 7),
      settlesAt: kind === 2 ? null : iso(day - 1, i % 7),
      settledAt: settled ? iso(day - 1, i % 7) : null,
    });
  }
  return rows;
}

function series(): StatsOverview["series"] {
  return Array.from({ length: 30 }, (_, i) => {
    const day = 29 - i;
    const played = 40 + Math.round(30 * Math.sin(i / 3.2)) + (i % 5) * 4;
    const received = Math.round(played * 0.46);
    return {
      day: iso(day).slice(0, 10),
      played,
      received,
      scans: Math.max(0, Math.round(received * 0.07)),
      earned: played * 6,
    };
  });
}

const stats: StatsOverview = {
  balance: { settled: 12_840, pending: 360, bought: 6_200, earned: 1_640, granted: 5_000 },
  today: { played: 62, received: 28, scans: 3, earned: 372, scanRate: 3 / 28 },
  series: series(),
};

/**
 * Built on first read, never at module load. The rows spread a fixture, and a
 * spread can call a getter, so a bundler must assume the initializer has a side
 * effect and keep it. A top-level one would therefore pin the fixtures into every
 * production bundle. Inside a function it is unreachable, so the whole set drops.
 */
let moderation: ModerationQueue | null = null;

function moderationQueue(): ModerationQueue {
  moderation ??= {
    listings: [
      {
        listing: campaigns[0]?.listings[2] as Listing,
        campaign: campaigns[0]?.campaign as Campaign,
        owner: { name: "Wai Hong", email: "waihong@example.com" },
      },
      {
        listing: campaigns[1]?.listings[0] as Listing,
        campaign: campaigns[1]?.campaign as Campaign,
        owner: { name: "Sam Rivera", email: "sam@inboxzero.app" },
      },
    ],
    devices: [
      {
        device: devices[1]?.device as DeviceWithTerms["device"],
        owner: { name: "Nur Aisyah", email: "aisyah@example.com" },
      },
    ],
  };
  return moderation;
}

/**
 * The cash-out panel. One payout already paid, so the history table has a row,
 * and enough left over the hold that the button is live.
 */
let payoutAccount: PayoutAccount | null = {
  id: "pay_acct_1",
  legalName: "Nur Aisyah binti Rahman",
  country: "MY",
  method: "bank",
  destination: "1234567890",
  createdAt: iso(40),
  updatedAt: iso(40),
};

let payoutRequests: PayoutRequest[] = [
  {
    id: "pay_req_1",
    points: 24_000,
    usdCents: 2_400,
    state: "paid",
    ledgerEntryId: "led_0001",
    reference: "MBB-2026-08-01",
    rejectionReason: null,
    reviewedAt: iso(35),
    createdAt: iso(38),
  },
];

let withdrawable = 31_400;

let topups: Topup[] = [
  {
    id: "top_2",
    points: 25_000,
    usdCents: 2_500,
    state: "paid",
    ledgerEntryId: "led_0004",
    refundedPoints: null,
    refundUsdCents: null,
    refundLedgerEntryId: null,
    createdAt: iso(3),
    paidAt: iso(3),
    refundedAt: null,
  },
  {
    id: "top_1",
    points: 10_000,
    usdCents: 1_000,
    state: "paid",
    ledgerEntryId: "led_0003",
    refundedPoints: null,
    refundUsdCents: null,
    refundLedgerEntryId: null,
    createdAt: iso(90),
    paidAt: iso(90),
    refundedAt: null,
  },
];

/**
 * What each top-up may still give back. The API derives these from the bought
 * balance and the processor fee; design mode names them, the same way
 * `payoutOverview` names its own block rather than importing the rule. The
 * fixture shows one top-up inside the window with points left, and one the
 * window has closed on.
 */
const refundable: Record<
  string,
  { points: number; netCents: number; block: TopupRefundBlock | null }
> = {
  top_2: { points: 18_000, netCents: 1_748, block: null },
  top_1: { points: 0, netCents: 0, block: "window-closed" },
};

function topupOverview(): TopupOverview {
  return {
    packs: economy.topup.packs.map((pack) => ({ ...pack })),
    refundWindowDays: economy.topup.refundWindowDays,
    items: topups.map((topup) => {
      const money = refundable[topup.id] ?? { points: 0, netCents: 0, block: "nothing-left" };
      return {
        topup: { ...topup },
        refundablePoints: topup.state === "paid" ? money.points : 0,
        refundNetCents: topup.state === "paid" ? money.netCents : 0,
        block: topup.state === "paid" ? money.block : "not-paid",
      };
    }),
  };
}

/** The refund desk: the same rows, with the member they belong to. */
function topupQueue(): TopupQueue {
  const overview = topupOverview();
  return {
    refundWindowDays: overview.refundWindowDays,
    items: overview.items.map((item) => ({
      ...item,
      owner: { name: designSession.user.name, email: designSession.user.email },
    })),
  };
}

function payoutOverview(): PayoutOverview {
  const open = payoutRequests.some((row) => row.state === "requested");
  return {
    account: payoutAccount ? { ...payoutAccount } : null,
    withdrawable,
    minimumPoints: economy.payout.minimumPoints,
    holdDays: economy.payout.holdDays,
    block: open
      ? "open-request"
      : payoutAccount === null
        ? "identity"
        : withdrawable < economy.payout.minimumPoints
          ? "below-minimum"
          : null,
    requests: payoutRequests.map((row) => ({ ...row })),
  };
}

/** Plays that stop overnight, the shape a room that closes leaves behind. */
function openHours(peak: number): number[] {
  return Array.from({ length: 24 }, (_, hour) =>
    hour >= 8 && hour < 20 ? peak - Math.abs(14 - hour) * 3 : 0,
  );
}

/** Plays that never stop, the shape a screen in a drawer leaves behind. */
function allHours(peak: number): number[] {
  return Array.from({ length: 24 }, () => peak);
}

let payoutQueue: PayoutQueue | null = null;

function payoutReviewQueue(): PayoutQueue {
  payoutQueue ??= {
    windowDays: economy.payout.reviewWindowDays,
    items: [
      {
        request: {
          id: "pay_req_2",
          points: 46_500,
          usdCents: 4_650,
          state: "requested",
          ledgerEntryId: "led_0002",
          reference: null,
          rejectionReason: null,
          reviewedAt: null,
          createdAt: iso(2),
        },
        owner: { name: "Wai Hong", email: "waihong@example.com" },
        account: {
          id: "pay_acct_2",
          legalName: "Lim Wai Hong",
          country: "MY",
          method: "paypal",
          destination: "waihong@example.com",
          createdAt: iso(6),
          updatedAt: iso(6),
        },
        devices: [
          {
            deviceId: "dev_bangsar",
            name: "Front counter",
            location: "12 Jalan Telawi, Bangsar",
            tier: "premium",
            state: "approved",
            plays: 6_240,
            scans: 71,
            playsByHour: openHours(40),
            openHour: 8,
            closeHour: 20,
            lastSeenAt: iso(0, 3),
            lastNetwork: "203.0.113.0/24",
            flags: {
              scanRatio: 71 / 6_240,
              lowScanRatio: false,
              activeHours: 12,
              outOfHoursPlays: 0,
              daysSilent: 0,
              sharedNetwork: false,
              sharedLocation: false,
            },
          },
          {
            deviceId: "dev_storeroom",
            name: "Spare screen",
            location: "12 Jalan Telawi, Bangsar",
            tier: "standard",
            state: "approved",
            plays: 9_800,
            scans: 2,
            playsByHour: allHours(21),
            openHour: 8,
            closeHour: 20,
            lastSeenAt: iso(0, 1),
            lastNetwork: "203.0.113.0/24",
            flags: {
              scanRatio: 2 / 9_800,
              lowScanRatio: true,
              activeHours: 24,
              outOfHoursPlays: 252,
              daysSilent: 0,
              sharedNetwork: true,
              sharedLocation: true,
            },
          },
        ],
      },
    ],
  };
  return payoutQueue;
}

const releases: Release[] = [
  {
    id: "rel_002",
    tag: "v0.3.0",
    name: "Device regions",
    body: "- Several overlay regions on one device\n- Excluded terms editor",
    url: "https://github.com/example/adstukar/releases/tag/v0.3.0",
    prerelease: false,
    publishedAt: iso(6),
    syncedAt: iso(0, 2),
  },
  {
    id: "rel_001",
    tag: "v0.2.0",
    name: "CapyPoints filters",
    body: "- Filter CapyPoints by reason, state and lot\n- Infinite scroll at 50 rows a page",
    url: "https://github.com/example/adstukar/releases/tag/v0.2.0",
    prerelease: false,
    publishedAt: iso(20),
    syncedAt: iso(0, 2),
  },
];

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

function replaceCampaign(next: CampaignWithListings): CampaignWithListings {
  campaigns = campaigns.map((row) => (row.campaign.id === next.campaign.id ? next : row));
  return next;
}

/**
 * The shape the admin routes answer with: everything the owner sees except the
 * device key. Written out field by field rather than destructured, so adding a
 * device column fails typecheck here instead of quietly reaching an admin.
 */
function forAdmin(device: DeviceForAdmin): DeviceForAdmin {
  return {
    id: device.id,
    name: device.name,
    deviceId: device.deviceId,
    venueType: device.venueType,
    location: device.location,
    openHour: device.openHour,
    closeHour: device.closeHour,
    timezone: device.timezone,
    photoUrl: device.photoUrl,
    promotionName: device.promotionName,
    promotionTagline: device.promotionTagline,
    promotionUrl: device.promotionUrl,
    promotionLogoUrl: device.promotionLogoUrl,
    tier: device.tier,
    state: device.state,
    rejectionReason: device.rejectionReason,
    dailyPlayCap: device.dailyPlayCap,
    approvedAt: device.approvedAt,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

function replaceDevice(next: DeviceWithTerms): DeviceWithTerms {
  devices = devices.map((row) => (row.device.id === next.device.id ? next : row));
  return next;
}

/** The campaign a listing belongs to, or undefined when nothing holds it. */
function ownerOf(listingId: string): CampaignWithListings | undefined {
  return campaigns.find((row) => row.listings.some((l) => l.id === listingId));
}

function writeCampaigns(seg: string[], method: string, patch: Record<string, unknown>): unknown {
  if (method === "POST" && seg.length === 1) {
    const input = patch as { name: string; url: string; dailyBudget?: number };
    // Mirror createCampaign in the API: a domain this member already proved
    // needs no second check, so the campaign starts running at once.
    const domain = hostOf(input.url);
    const verifiedAt =
      campaigns.find((row) => row.campaign.domain === domain && row.campaign.verifiedAt !== null)
        ?.campaign.verifiedAt ?? null;
    const created: CampaignWithListings = {
      campaign: {
        id: fakeId("cmp"),
        name: input.name,
        url: input.url,
        domain,
        state: verifiedAt ? "active" : "draft",
        pauseReason: null,
        pausedAt: null,
        dailyBudget: input.dailyBudget ?? economy.caps.defaultDailyBudget,
        verificationToken: "",
        verifiedAt,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      listings: [],
      spentToday: 0,
    };
    campaigns = [...campaigns, created];
    return created;
  }

  const target = campaigns.find((row) => row.campaign.id === seg[1]);
  if (!target) return undefined;

  if (method === "PATCH" && seg.length === 2) {
    const input = patch as Partial<Campaign>;
    const next: Campaign = { ...target.campaign, ...input, updatedAt: nowIso() };
    // Mirror updateCampaign in the API: a new domain needs new proof of
    // ownership, so the campaign stops running until it is verified again.
    if (input.url) {
      const domain = domainOf(input.url);
      if (domain && domain !== target.campaign.domain) {
        next.domain = domain;
        next.verifiedAt = null;
        next.state = "draft";
      }
    }
    // A person moved this campaign, so the system's reason for stopping it goes.
    if (input.state !== undefined || next.state !== target.campaign.state) {
      next.pauseReason = null;
      next.pausedAt = null;
    }
    return replaceCampaign({ ...target, campaign: next });
  }

  if (method === "DELETE" && seg.length === 2) {
    campaigns = campaigns.filter((row) => row.campaign.id !== target.campaign.id);
    return { id: target.campaign.id };
  }

  if (method === "POST" && seg[2] === "verify") {
    replaceCampaign({
      ...target,
      campaign: {
        ...target.campaign,
        verifiedAt: nowIso(),
        state: target.campaign.state === "draft" ? "active" : target.campaign.state,
        updatedAt: nowIso(),
      },
    });
    const response: VerifyCampaignResponse = {
      verified: true,
      method: "well-known",
      message: "Design mode accepts any token. The API does the real check.",
    };
    return response;
  }
  return undefined;
}

function writeListings(seg: string[], method: string, patch: Record<string, unknown>): unknown {
  if (method === "POST" && seg.length === 1) {
    const input = patch as { campaignId: string; tagline: string; logoUrl?: string | null };
    const owner = campaigns.find((row) => row.campaign.id === input.campaignId);
    if (!owner) return undefined;
    const created: Listing = {
      id: fakeId("lst"),
      campaignId: input.campaignId,
      tagline: input.tagline,
      logoUrl: input.logoUrl ?? null,
      state: "pending",
      rejectionReason: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    replaceCampaign({ ...owner, listings: [...owner.listings, created] });
    return created;
  }

  const listingId = seg[1];
  if (!listingId) return undefined;
  const owner = ownerOf(listingId);
  const target = owner?.listings.find((l) => l.id === listingId);
  if (!owner || !target) return undefined;

  if (method === "PATCH" && seg.length === 2) {
    const input = patch as Partial<Listing>;
    // Mirror updateListing in the API: a state-only patch pauses or starts the
    // listing, and an edited creative goes back to the review queue.
    const moved = input.state !== undefined;
    const next: Listing = {
      ...target,
      ...input,
      state: moved ? (input.state ?? target.state) : "pending",
      rejectionReason: moved ? target.rejectionReason : null,
      updatedAt: nowIso(),
    };
    replaceCampaign({
      ...owner,
      listings: owner.listings.map((l) => (l.id === listingId ? next : l)),
    });
    return next;
  }

  if (method === "DELETE" && seg.length === 2) {
    replaceCampaign({ ...owner, listings: owner.listings.filter((l) => l.id !== listingId) });
    return { id: listingId };
  }
  return undefined;
}

function writeDevices(seg: string[], method: string, patch: Record<string, unknown>): unknown {
  if (method === "POST" && seg.length === 1) {
    const input = patch as {
      name: string;
      location: string;
      venueType?: VenueType;
      photoUrl?: string | null;
      openHour?: number | null;
      closeHour?: number | null;
      timezone?: string | null;
    };
    const created: DeviceWithTerms = {
      device: {
        id: fakeId("dev"),
        name: input.name,
        deviceId: "XXXX-XXXX",
        apiKey: "",
        openHour: input.openHour ?? null,
        closeHour: input.closeHour ?? null,
        timezone: input.timezone ?? null,
        venueType: input.venueType ?? "other",
        location: input.location,
        photoUrl: input.photoUrl ?? null,
        promotionName: null,
        promotionTagline: null,
        promotionUrl: null,
        promotionLogoUrl: null,
        tier: "standard",
        state: "pending",
        rejectionReason: null,
        dailyPlayCap: economy.caps.dailyPlaysPerDevice,
        approvedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      excludedTerms: [],
      vetoedListingIds: [],
    };
    devices = [...devices, created];
    return created;
  }

  const target = devices.find((row) => row.device.id === seg[1]);
  if (!target) return undefined;

  if (method === "PATCH" && seg.length === 2) {
    const input = patch as Partial<DeviceWithTerms["device"]>;
    // Mirror updateDevice in the API: the tier is priced on the room, so only a
    // moved screen goes back to the review queue. A new name or a new photo does
    // not, and `approvedAt` records the first approval either way.
    const rereview = input.location !== undefined || input.venueType !== undefined;
    return replaceDevice({
      ...target,
      device: {
        ...target.device,
        ...input,
        state: rereview ? "pending" : target.device.state,
        rejectionReason: rereview ? null : target.device.rejectionReason,
        updatedAt: nowIso(),
      },
    });
  }
  if (method === "POST" && seg[2] === "rotate-key") {
    return replaceDevice({ ...target, device: { ...target.device, apiKey: "" } });
  }
  if (method === "PUT" && seg[2] === "excluded-terms") {
    const phrases = (patch.phrases as string[] | undefined) ?? [];
    return replaceDevice({ ...target, excludedTerms: [...phrases] });
  }
  if (method === "PUT" && seg[2] === "vetoes") {
    const listingIds = (patch.listingIds as string[] | undefined) ?? [];
    return replaceDevice({ ...target, vetoedListingIds: [...listingIds] });
  }
  if (method === "PUT" && seg[2] === "promotion") {
    const input = patch as {
      name?: string | null;
      tagline?: string | null;
      url?: string | null;
      logoUrl?: string | null;
    };
    // The API keeps the fields together: with no name or no tagline there is no
    // promotion, and the screen falls back to the CapyAds card.
    const complete = Boolean(input.name && input.tagline);
    return replaceDevice({
      ...target,
      device: {
        ...target.device,
        promotionName: complete ? (input.name ?? null) : null,
        promotionTagline: complete ? (input.tagline ?? null) : null,
        promotionUrl: complete ? (input.url ?? null) : null,
        promotionLogoUrl: complete ? (input.logoUrl ?? null) : null,
        updatedAt: nowIso(),
      },
    });
  }
  if (method === "DELETE" && seg.length === 2) {
    devices = devices.filter((row) => row.device.id !== target.device.id);
    placements = placements.filter((row) => row.deviceId !== target.device.id);
    return { id: target.device.id };
  }
  return undefined;
}

function writePlacements(seg: string[], method: string, patch: Record<string, unknown>): unknown {
  if (method === "POST" && seg.length === 1) {
    const input = patch as {
      deviceId: string;
      format?: PlacementFormat;
      size?: PlacementSize;
      dwellSeconds?: number;
      gapSeconds?: number;
    };
    const created: Placement = {
      id: fakeId("plc"),
      deviceId: input.deviceId,
      format: input.format ?? "band",
      size: input.size ?? "medium",
      dwellSeconds: input.dwellSeconds ?? economy.placement.dwellSeconds.default,
      gapSeconds: input.gapSeconds ?? economy.placement.gapSeconds.default,
      createdAt: nowIso(),
    };
    placements = [...placements, created];
    return created;
  }

  const target = placements.find((row) => row.id === seg[1]);
  if (!target) return undefined;

  if (method === "PATCH" && seg.length === 2) {
    const next: Placement = { ...target, ...(patch as Partial<Placement>) };
    placements = placements.map((row) => (row.id === target.id ? next : row));
    return next;
  }
  if (method === "DELETE" && seg.length === 2) {
    placements = placements.filter((row) => row.id !== target.id);
    return { id: target.id };
  }
  return undefined;
}

function writeAdmin(seg: string[], patch: Record<string, unknown>): unknown {
  const queue = moderationQueue();

  if (seg[1] === "listings" && seg[2]) {
    const listingId = seg[2];
    const queued = queue.listings.find((row) => row.listing.id === listingId);
    const owner = ownerOf(listingId);
    const target = owner?.listings.find((l) => l.id === listingId) ?? queued?.listing;
    if (!target) return undefined;

    const decided: Listing | null =
      seg[3] === "approve"
        ? { ...target, state: "approved", rejectionReason: null, updatedAt: nowIso() }
        : seg[3] === "reject"
          ? {
              ...target,
              state: "rejected",
              rejectionReason: (patch.reason as string | undefined) ?? "No reason given.",
              updatedAt: nowIso(),
            }
          : null;
    if (!decided) return undefined;

    moderation = { ...queue, listings: queue.listings.filter((r) => r.listing.id !== listingId) };
    if (owner) {
      replaceCampaign({
        ...owner,
        listings: owner.listings.map((l) => (l.id === listingId ? decided : l)),
      });
    }
    return decided;
  }

  if (seg[1] === "devices" && seg[2]) {
    const deviceId = seg[2];
    const queued = queue.devices.find((row) => row.device.id === deviceId);
    const owned = devices.find((row) => row.device.id === deviceId);
    const target = owned?.device ?? queued?.device;
    if (!target) return undefined;

    // The admin routes answer with the shape that carries no `apiKey`, so the
    // decision is built on that shape and merged onto the owner's row separately.
    const decision: Partial<DeviceForAdmin> | null =
      seg[3] === "approve"
        ? {
            state: "approved",
            tier: (patch.tier as DeviceTier | undefined) ?? target.tier,
            rejectionReason: null,
            approvedAt: nowIso(),
            updatedAt: nowIso(),
          }
        : seg[3] === "reject"
          ? {
              state: "rejected",
              rejectionReason: (patch.reason as string | undefined) ?? "No reason given.",
              approvedAt: null,
              updatedAt: nowIso(),
            }
          : null;
    if (!decision) return undefined;

    const decided: DeviceForAdmin = { ...forAdmin(target), ...decision };

    moderation = { ...queue, devices: queue.devices.filter((r) => r.device.id !== deviceId) };
    if (owned) replaceDevice({ ...owned, device: { ...owned.device, ...decision } });
    return decided;
  }
  return undefined;
}

/** The distributor's own side: save the details, or ask for the money. */
function writePayouts(seg: string[], method: string, patch: Record<string, unknown>): unknown {
  if (method === "PUT" && seg[1] === "account") {
    payoutAccount = {
      id: payoutAccount?.id ?? fakeId("pay_acct"),
      legalName: (patch.legalName as string | undefined) ?? "",
      country: (patch.country as string | undefined) ?? "MY",
      method: (patch.method as PayoutAccount["method"] | undefined) ?? "bank",
      destination: (patch.destination as string | undefined) ?? "",
      createdAt: payoutAccount?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    };
    return { ...payoutAccount };
  }

  if (method === "POST" && seg.length === 1) {
    const opened: PayoutRequest = {
      id: fakeId("pay_req"),
      points: withdrawable,
      usdCents: pointsToUsdCents(withdrawable),
      state: "requested",
      ledgerEntryId: fakeId("led"),
      reference: null,
      rejectionReason: null,
      reviewedAt: null,
      createdAt: nowIso(),
    };
    // The points leave the account the moment the request is made, exactly as
    // the API does it, so the panel below the button reads right afterwards.
    withdrawable = 0;
    payoutRequests = [opened, ...payoutRequests];
    return { ...opened };
  }
  return undefined;
}

/**
 * Buying. Design mode cannot open a real checkout, so the buy request returns
 * no URL and the panel says so rather than navigating away.
 */
function writeTopups(seg: string[], method: string): unknown {
  if (method === "POST" && seg[1] === "checkout") return { url: null };
  return undefined;
}

/** The admin side of a top-up: give the unspent part back. */
function writeTopupRefund(seg: string[]): unknown {
  if (seg[3] !== "refund") return undefined;
  const target = topups.find((row) => row.id === seg[2]);
  const money = target ? refundable[target.id] : undefined;
  if (!target || !money) return undefined;
  const refunded: Topup = {
    ...target,
    state: "refunded",
    refundedPoints: money.points,
    refundUsdCents: money.netCents,
    refundLedgerEntryId: fakeId("led"),
    refundedAt: nowIso(),
  };
  topups = topups.map((row) => (row.id === target.id ? refunded : row));
  return { ...refunded };
}

/** The admin side: pay the request, or refuse it and hand the points back. */
function writePayoutReview(seg: string[], patch: Record<string, unknown>): unknown {
  const queue = payoutReviewQueue();
  const item = queue.items.find((row) => row.request.id === seg[2]);
  if (!item) return undefined;

  const decided: PayoutRequest | null =
    seg[3] === "pay"
      ? {
          ...item.request,
          state: "paid",
          reference: (patch.reference as string | undefined) ?? "",
          reviewedAt: nowIso(),
        }
      : seg[3] === "reject"
        ? {
            ...item.request,
            state: "rejected",
            rejectionReason: (patch.reason as string | undefined) ?? "No reason given.",
            reviewedAt: nowIso(),
          }
        : null;
  if (!decided) return undefined;

  payoutQueue = { ...queue, items: queue.items.filter((row) => row.request.id !== seg[2]) };
  return decided;
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

  if (seg[0] === "campaigns") return writeCampaigns(seg, method, patch);
  if (seg[0] === "listings") return writeListings(seg, method, patch);
  if (seg[0] === "devices") return writeDevices(seg, method, patch);
  if (seg[0] === "placements") return writePlacements(seg, method, patch);
  if (seg[0] === "payouts") return writePayouts(seg, method, patch);
  if (seg[0] === "topups") return writeTopups(seg, method);
  if (method === "POST" && seg[0] === "admin" && seg[1] === "payouts") {
    return writePayoutReview(seg, patch);
  }
  if (method === "POST" && seg[0] === "admin" && seg[1] === "topups") {
    return writeTopupRefund(seg);
  }
  if (method === "POST" && seg[0] === "admin") return writeAdmin(seg, patch);

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
  if (method === "POST" && route === "/campaigns/metadata") {
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

  // Every approved listing a screen could show, with the ones it refuses marked.
  // The fixtures hold one member, so nothing filters the owner out here.
  const eligible = /^\/devices\/([^/]+)\/eligible-listings$/.exec(route);
  if (eligible) {
    const target = devices.find((row) => row.device.id === eligible[1]);
    const vetoed = new Set(target?.vetoedListingIds ?? []);
    return campaigns.flatMap((row) =>
      row.listings
        .filter((listing) => listing.state === "approved")
        .map((listing) => ({
          listingId: listing.id,
          name: row.campaign.name,
          tagline: listing.tagline,
          logoUrl: listing.logoUrl,
          vetoed: vetoed.has(listing.id),
        })),
    );
  }

  if (route === "/placements") {
    const deviceId = new URLSearchParams(path.split("?")[1] ?? "").get("deviceId");
    return placements
      .filter((row) => !deviceId || row.deviceId === deviceId)
      .map((row) => ({ ...row }));
  }

  switch (route) {
    case "/stats/overview":
      return stats;
    case "/campaigns":
      // The return type is the contract, so a field the contract gains and this
      // copy forgets fails typecheck instead of crashing the page in design mode.
      return campaigns.map(
        (row): CampaignWithListings => ({
          campaign: { ...row.campaign },
          listings: row.listings.map((l) => ({ ...l })),
          spentToday: row.spentToday,
        }),
      );
    case "/devices":
      return devices.map(
        (row): DeviceWithTerms => ({
          device: { ...row.device },
          excludedTerms: [...row.excludedTerms],
          vetoedListingIds: [...row.vetoedListingIds],
        }),
      );
    case "/payouts":
      return payoutOverview();
    case "/topups":
      return topupOverview();
    case "/admin/topups":
      return topupQueue();
    case "/admin/payouts": {
      const queue = payoutReviewQueue();
      return { windowDays: queue.windowDays, items: queue.items.map((row) => ({ ...row })) };
    }
    case "/admin/moderation": {
      const queue = moderationQueue();
      return {
        listings: queue.listings.map((row) => ({ ...row })),
        devices: queue.devices.map((row) => ({ ...row })),
      };
    }
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
