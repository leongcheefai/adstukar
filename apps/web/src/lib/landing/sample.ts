import { type DeviceTierRate, distributorKeeps, economy } from "@repo/config/economy";
import { project } from "@repo/config/project";
import type { LandingConfig } from "./config";
import { rng } from "./prng";

/**
 * The invented advertisers and venues the page shows. Every name is made up
 * and every card that prints one is labelled "Sample". The first four mirror
 * the screen app's own demo crawl, so the site and the product agree.
 */
export interface SampleAd {
  name: string;
  head: string;
  /** OKLCH hue of the advertiser's mark. Theirs, not ours: the brand stays off the crawl. */
  hue: number;
  mark: string;
}

const ADS: readonly SampleAd[] = [
  { name: "Kopi Lima", head: "1-for-1 iced latte", hue: 62, mark: "K" },
  { name: "Halcyon Dental", head: "New patient scan, $49", hue: 225, mark: "H" },
  { name: "Rumah Gym", head: "First month free", hue: 152, mark: "R" },
  { name: "Teluk Optics", head: "Two frames, one price", hue: 300, mark: "T" },
  { name: "Pantai Laundry", head: "Wash and fold by 6pm", hue: 200, mark: "P" },
  { name: "Bukit Bikes", head: "Free tune-up this month", hue: 30, mark: "B" },
  { name: "Sari Florist", head: "Same-day bouquets", hue: 340, mark: "S" },
  { name: "Nadi Yoga", head: "First class on us", hue: 120, mark: "N" },
  { name: "Lorong Books", head: "Open till late", hue: 20, mark: "L" },
  { name: "Mira Pet Clinic", head: "Vaccines from $18", hue: 270, mark: "M" },
];

export interface SampleVenue {
  name: string;
  kind: string;
}

const VENUES: readonly SampleVenue[] = [
  { name: "Kopi Lima", kind: "Café counter" },
  { name: "Rumah Gym", kind: "Gym floor" },
  { name: "Halcyon Dental", kind: "Waiting room" },
  { name: "Bukit Barbers", kind: "Barber shop" },
  { name: "Warung Sinar", kind: "Food stall" },
  { name: "Nadi Yoga", kind: "Studio lobby" },
];

export interface SampleNowPlaying {
  source: string;
  title: string;
  by: string;
}

/** What the sample screen is playing. The labels are the screen app's own sources. */
const NOW_PLAYING: readonly SampleNowPlaying[] = [
  { source: "Podcast", title: "Slow Mornings, ep. 41", by: "Kopi Hour" },
  { source: "Music", title: "Low Tide", by: "Pantai Radio" },
  { source: "Live clip", title: "Rain on the harbour", by: "Teluk Cam" },
  { source: "Photo Video", title: "Menu of the week", by: "Kopi Lima" },
  { source: "Firepit", title: "Evening fire", by: project.name },
];

const TIERS = Object.keys(economy.playRate) as DeviceTierRate[];
const DAYS = 30;

export interface LandingSample {
  ads: SampleAd[];
  venue: SampleVenue;
  nowPlaying: SampleNowPlaying;
  /** Screens on the network right now, as the sample screen's bar prints it. */
  online: number;
  tier: DeviceTierRate;
  /** Paid plays per day, oldest first. Never above the daily cap. */
  series: number[];
  /** Scans per day, oldest first, in step with `series`. */
  scanSeries: number[];
  plays: number;
  scans: number;
  /** What the advertiser paid, gross, at the crawl rate for the tier. */
  spent: number;
  /** What the venue kept, net of the fee, at the crawl rate for its tier. */
  earned: number;
}

/**
 * Everything invented on the page, from one seed. The economy numbers are
 * real: the sample venue earns exactly what a real one would at its tier.
 */
export function sampleLanding(config: LandingConfig): LandingSample {
  const r = rng(config.seed);

  const ads = r.shuffle(ADS).slice(0, config.adCount);
  const venue = r.pick(VENUES);
  const nowPlaying = r.pick(NOW_PLAYING);
  const online = r.int(900, 2400);
  const tier = r.pick(TIERS);

  const cap = economy.caps.dailyPlaysPerDevice;
  // A quiet screen at the start, and a drift from the trend knob. Noise is a
  // fraction of the level, so a busy day wobbles more than a slow one.
  let level = r.float(24, 60);
  const drift = (config.chartTrend * level) / DAYS;
  const series: number[] = [];
  for (let day = 0; day < DAYS; day++) {
    const wobble = (r.next() * 2 - 1) * config.chartNoise * level * 0.6;
    const weekend = day % 7 >= 5 ? 1.25 : 1;
    level = Math.max(4, level + drift);
    series.push(Math.min(cap, Math.max(0, Math.round((level + wobble) * weekend))));
  }

  const plays = series.reduce((sum, n) => sum + n, 0);
  // 3 to 6 percent, well above the ratio the payout review flags. Each day
  // wobbles around the rate on its own, so the two lines do not share a shape.
  const scanRatio = r.float(0.03, 0.06);
  const scanSeries = series.map((n) => Math.round(n * scanRatio * (0.6 + r.next() * 0.8)));
  const scans = scanSeries.reduce((sum, n) => sum + n, 0);
  const playRate = economy.playRate[tier].ticker;
  const scanRate = economy.scanRate[tier];
  const spent = plays * playRate + scans * scanRate;
  const earned = plays * distributorKeeps(playRate) + scans * distributorKeeps(scanRate);

  return { ads, venue, nowPlaying, online, tier, series, scanSeries, plays, scans, spent, earned };
}

/**
 * A smooth SVG path through the series, for the sample chart. Catmull-Rom
 * turned into cubic Béziers, so the line bends through every point instead
 * of cutting corners between them.
 */
export function seriesPath(
  series: readonly number[],
  width: number,
  height: number,
  pad = 4,
): { line: string; area: string } {
  if (series.length < 2) return { line: "", area: "" };
  const max = Math.max(...series, 1);
  const stepX = width / (series.length - 1);
  const pts = series.map((n, i) => ({
    x: i * stepX,
    y: pad + (height - pad * 2) * (1 - n / max),
  }));
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0]?.x ?? 0)} ${f(pts[0]?.y ?? 0)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    if (!p0 || !p1 || !p2 || !p3) continue;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  const last = pts[pts.length - 1];
  const area = `${d} V${f(height)} H0 Z`;
  return last ? { line: d, area } : { line: "", area: "" };
}
