import { type DeviceTierRate, economy, playRateRange, rateTable } from "@repo/config/economy";
import { project } from "@repo/config/project";
import { Container, Logo, Section, SectionHeader } from "@repo/ui";
import type { CSSProperties, ReactNode } from "react";
import { landingFaq } from "../../lib/faq";
import type { LandingConfig } from "../../lib/landing/config";
import { type LandingSample, sampleLanding, seriesPath } from "../../lib/landing/sample";
import { Faq } from "./Faq";
import { Screen } from "./Screen";

/**
 * The landing page as one pure function of its config. The site renders it
 * on the server from `landing.config.json`; the lab renders the same function
 * in the browser with a live config. Nothing here reads the clock, the
 * network, or Math.random: `ticker` is the live thing, and it comes in from
 * outside.
 */
export interface LandingProps {
  config: LandingConfig;
  /** The site ticker for the foot of a hero that has one, carrying the same figure. */
  ticker?: ReactNode;
}

const POINTS = project.pointsName;
const { lowest: LOWEST_RATE, highest: HIGHEST_RATE } = playRateRange();
const PEG = economy.pointsPerUsd.toLocaleString("en-US");

type Tone = "slab" | "light" | "dark";

/**
 * The lockup is the headline. The words stay for a reader who cannot see it,
 * and the ON AIR word keeps breathing from the shared logo. `tone` picks the
 * ink for the ground the hero sits on.
 */
function Headline({ tone }: { tone: Tone }) {
  const ink = tone === "light" ? "text-primary" : "text-white";
  return (
    <h1 className="hero-lockup">
      <span className="sr-only">{project.tagline}</span>
      <Logo className={`hero-logo ${ink}`} aria-hidden="true" />
    </h1>
  );
}

/* --- Hero: one per mode ------------------------------------------------- */

/**
 * The blue slab fills the first screen: the header floats on it, the lockup
 * sits in the middle, and the ticker is its foot. When the fixed foot ticker
 * is on it already covers that edge, so the hero leaves the height and draws
 * nothing there; two tickers on one edge would part as the page scrolls.
 */
function HeroFloat({ config, ticker }: { config: LandingConfig; ticker?: ReactNode }) {
  return (
    <Section
      spacing="none"
      className="hero hero-float flex flex-col overflow-hidden bg-slab text-slab-foreground"
    >
      <Container className="flex w-full flex-1 flex-col items-center justify-center text-center">
        <Headline tone="slab" />
      </Container>
      {!config.footCrawl && ticker}
    </Section>
  );
}

function HeroSet({ sample, config }: { sample: LandingSample; config: LandingConfig }) {
  return (
    <Section spacing="none" className="hero hero-set overflow-hidden">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="text-center lg:text-left">
          <Headline tone="light" />
        </div>
        <Screen sample={sample} crawlSeconds={config.crawlSeconds} className="set-hero" />
      </Container>
    </Section>
  );
}

function HeroStrap({
  sample,
  ticker,
}: {
  sample: LandingSample;
  ticker?: ReactNode;
}) {
  return (
    <Section spacing="none" className="hero hero-strap overflow-hidden bg-black text-white">
      <Container className="hero-strap-body">
        <div className="hero-strap-bar">
          <span className="set-lockup">
            <Logo aria-hidden="true" />
          </span>
          <span className="set-live">
            <i />
            <b>{sample.online.toLocaleString("en-US")}</b> online
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <Headline tone="dark" />
        </div>
      </Container>
      {ticker}
    </Section>
  );
}

/* --- Sections ----------------------------------------------------------- */

const STEPS = [
  {
    title: `Open ${project.name}`,
    body: "In a browser, on any screen: a TV, a stick, a tablet, an old laptop. Nothing to install.",
  },
  {
    title: "Play something",
    body: `Music, a podcast, a video, a live clip. ${project.name} plays it full frame. Nothing covers the picture.`,
  },
  {
    title: "Earn",
    body: `Listings crawl in one line along the foot. Each play earns ${POINTS}, and a scan pays a bonus on top.`,
  },
] as const;

/**
 * How it works: the title, the three steps, and the drawn screen under them.
 * The screen is the picture the steps describe, so it follows them. In "set"
 * mode the hero already shows it, and the section leaves it out.
 */
function Steps({
  sample,
  config,
  className,
}: {
  sample?: LandingSample;
  config: LandingConfig;
  className?: string;
}) {
  return (
    <Section id="how-it-works" spacing={config.density} className={className}>
      <Container>
        <h2 className="landing-title text-center">How it works</h2>
        <ol className="steps-row relative mt-8 grid gap-12 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="step-card relative flex flex-col items-center gap-4 text-center"
              style={{ ["--n" as string]: i }}
            >
              <span className="relative flex size-11 items-center justify-center rounded-full bg-primary font-mono text-base font-medium tabular-nums text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-medium tracking-tight">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {sample && (
          <Screen sample={sample} crawlSeconds={config.crawlSeconds} className="set-section" />
        )}
      </Container>
    </Section>
  );
}

const TIER_LABEL: Record<DeviceTierRate, string> = {
  standard: "Standard",
  premium: "Premium",
  flagship: "Flagship",
};

/** The table is derived once, in the config, so the dashboard shows the same rows. */
const RATE_ROWS = rateTable().map((row) => ({
  tier: row.tier,
  label: TIER_LABEL[row.tier],
  play: `${row.play.lowest}–${row.play.highest}`,
  playKeeps: `${row.playKeeps.lowest}–${row.playKeeps.highest}`,
  scan: row.scan.toLocaleString("en-US"),
  scanKeeps: row.scanKeeps.toLocaleString("en-US"),
}));

function Rates({ spacing, className }: { spacing: LandingConfig["density"]; className?: string }) {
  const rows = RATE_ROWS;
  const share = 100 - economy.feePercent;
  return (
    <Section id="rates" spacing={spacing} className={className}>
      <Container>
        <SectionHeader
          eyebrow="What a play pays"
          headline="One number, both sides"
          lede={`An advertiser pays per play. ${project.name} keeps ${economy.feePercent}% as its fee, and the screen keeps ${share}%. The same number is on both dashboards.`}
        />
        <div className="rates-card mx-auto mt-14 max-w-3xl overflow-x-auto rounded-xl bg-card shadow-elev-2">
          <table className="rates-table">
            <thead>
              <tr>
                <th scope="col">Screen tier</th>
                <th scope="col" className="rates-num">
                  A play <span>advertiser pays</span>
                </th>
                <th scope="col" className="rates-num">
                  A play <span>you keep</span>
                </th>
                <th scope="col" className="rates-num">
                  A scan <span>advertiser pays</span>
                </th>
                <th scope="col" className="rates-num">
                  A scan <span>you keep</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.tier}>
                  <th scope="row">{row.label}</th>
                  <td className="rates-num">{row.play}</td>
                  <td className="rates-num rates-keep">{row.playKeeps}</td>
                  <td className="rates-num">{row.scan}</td>
                  <td className="rates-num rates-keep">{row.scanKeeps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-pretty text-sm text-muted-foreground">
          In {POINTS}. {PEG} {POINTS} are US$1. A person stamps the tier when the screen is
          approved, and a screen is paid for up to{" "}
          {economy.caps.dailyPlaysPerDevice.toLocaleString("en-US")} plays a day.
        </p>
      </Container>
    </Section>
  );
}

const ADVERTISER_POINTS = [
  {
    title: "Pay per play, at the peg",
    body: `${LOWEST_RATE}–${HIGHEST_RATE} ${POINTS} a play, by the tier of the screen. Set a daily budget from ${economy.caps.minDailyBudget.toLocaleString("en-US")} ${POINTS}; the campaign stops when it is spent and starts again tomorrow.`,
  },
  {
    title: "One verified domain",
    body: "Prove your site once with a token. Every listing under the campaign points at it, and a person reviews each one before it plays.",
  },
  {
    title: "Every impression on one chart",
    body: "Impressions, clicks, and spend, by day. The fee is its own line, never a spread.",
  },
] as const;

/** The two plots share one width and one height, so a glance compares shape. */
const SPARK_W = 320;
const SPARK_H = 56;

/**
 * One metric: the name and the total on the left, its own plot on the right.
 * Each metric has its own scale, because clicks are a few percent of
 * impressions and would lie flat on a shared one. The coloured mark beside the
 * name is the legend; the words stay in text ink.
 */
function Metric({
  label,
  value,
  series,
  className,
}: {
  label: string;
  value: number;
  series: readonly number[];
  className: string;
}) {
  const { line, area } = seriesPath(series, SPARK_W, SPARK_H);
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4">
      <div>
        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`size-2 rounded-full bg-current ${className}`} aria-hidden="true" />
          {label}
        </dt>
        <dd className="mt-1 font-mono text-2xl font-medium leading-none tabular-nums tracking-tight">
          {value.toLocaleString("en-US")}
        </dd>
      </div>
      <dd className={`pointer-events-none select-none ${className}`}>
        <svg
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          width={SPARK_W}
          height={SPARK_H}
          className="h-14 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label} by day`}
        >
          <title>{label} by day</title>
          <path d={area} fill="currentColor" opacity="0.1" />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </dd>
    </div>
  );
}

/**
 * A sample campaign's month, the way the advertiser's dashboard draws it:
 * impressions and clicks, each with its own plot, and the spend under them.
 * An impression is a play and a click is a scan; the card uses the words an
 * advertiser already knows.
 */
function SampleCard({ sample }: { sample: LandingSample }) {
  const ad = sample.ads[0];
  const rate = sample.plays > 0 ? (sample.scans / sample.plays) * 100 : 0;
  return (
    <div className="sample-card rounded-xl bg-card p-6 shadow-elev-2 sm:p-7">
      <p className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-muted-foreground">
        <span>Sample</span>
        <span className="normal-case tracking-normal">Last 30 days</span>
      </p>
      <div className="mt-3">
        <p className="text-sm font-medium tracking-tight">{ad?.name ?? "Campaign"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ad?.head ?? "Listing"} · {TIER_LABEL[sample.tier]} screens
        </p>
      </div>
      <dl className="mt-6 grid gap-5">
        <Metric
          label="Impressions"
          value={sample.plays}
          series={sample.series}
          className="text-primary"
        />
        <Metric
          label="Clicks"
          value={sample.scans}
          series={sample.scanSeries}
          className="sample-clicks"
        />
      </dl>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
        <div>
          <dt className="text-xs text-muted-foreground">Click rate</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums">{rate.toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{POINTS} spent</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums">
            {sample.spent.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Advertisers({
  sample,
  spacing,
  className,
}: {
  sample: LandingSample;
  spacing: LandingConfig["density"];
  className?: string;
}) {
  return (
    <Section id="advertisers" spacing={spacing} className={className}>
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Advertisers</p>
          <h2 className="landing-title landing-title-compact mt-3">
            Be on the screens people already look at
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            {ADVERTISER_POINTS.map((point) => (
              <li key={point.title} className="border-l-2 border-primary/30 pl-4">
                <h3 className="text-base font-medium tracking-tight">{point.title}</h3>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <SampleCard sample={sample} />
      </Container>
    </Section>
  );
}

/** The close: three words on three lines, and the capybara. Nothing else. */
const CLOSE = ["Play.", "Earn.", "Get paid."] as const;

function Cta({ slab }: { slab: boolean }) {
  return (
    <Section
      spacing="none"
      className={
        slab
          ? "cta overflow-hidden bg-slab text-slab-foreground"
          : "cta overflow-hidden bg-surface-tint"
      }
    >
      <Container className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.2fr_auto] lg:py-24">
        <h2 className="cta-title">
          {CLOSE.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        {slab && (
          <img
            src="/brand/capybara-fish.png"
            alt=""
            width={470}
            height={641}
            className="pointer-events-none mx-auto h-56 w-auto select-none sm:h-72 lg:h-80"
          />
        )}
      </Container>
    </Section>
  );
}

/* --- The page ----------------------------------------------------------- */

export function Landing({ config, ticker }: LandingProps) {
  const sample = sampleLanding(config);
  const style = {
    "--k-hero": config.heroScale,
    "--k-capy": `${config.capyWidth}px`,
    "--k-radius": config.radius,
  } as CSSProperties;

  // Sections alternate on the tint, or sit on one canvas with a rule between.
  const surface = (i: number) =>
    config.tint ? (i % 2 === 1 ? "bg-surface-tint" : "") : "border-t border-border";

  return (
    <div className="landing" data-mode={config.mode} data-density={config.density} style={style}>
      {config.mode === "float" && <HeroFloat config={config} ticker={ticker} />}
      {config.mode === "set" && <HeroSet sample={sample} config={config} />}
      {config.mode === "strap" && <HeroStrap sample={sample} ticker={ticker} />}

      <Steps
        sample={config.mode === "set" ? undefined : sample}
        config={config}
        className={surface(0)}
      />
      <Rates spacing={config.density} className={surface(1)} />
      <Advertisers sample={sample} spacing={config.density} className={surface(2)} />
      <Faq
        items={landingFaq(config.faqPerGroup).flatMap((group) => group.items)}
        spacing={config.density}
        className={surface(3)}
      />
      <Cta slab={config.ctaSlab} />
    </div>
  );
}
