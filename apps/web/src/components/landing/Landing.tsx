import { economy } from "@repo/config/economy";
import { usdCents } from "@repo/config/money";
import { project } from "@repo/config/project";
import { Container, Logo, Section } from "@repo/ui";
import type { CSSProperties, ReactNode } from "react";
import { landingFaq } from "../../lib/faq";
import type { LandingConfig } from "../../lib/landing/config";
import { type LandingSample, sampleLanding } from "../../lib/landing/sample";
import { Faq } from "./Faq";
import { Screen } from "./Screen";
import { SlotSample } from "./SlotSample";
import { StepArt, type StepArtName } from "./StepArt";

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

const STEPS: readonly { art: StepArtName; title: string; body: string; note?: string }[] = [
  {
    art: "open",
    title: `Open ${project.name}`,
    body: "In a browser, on a device of your choice.",
  },
  {
    art: "channel",
    title: "Select a channel",
    body: "Pick images or a video to show.",
  },
  {
    art: "earn",
    title: "Earn",
    body: "Set up Stripe, earn, and cash out.",
    note: "Terms and conditions apply.",
  },
];

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
        <h2 className="landing-title pt-8 text-center">How it works</h2>
        <ol className="steps-row mt-16 grid lg:mt-20 justify-center gap-12 lg:grid-cols-[repeat(3,max-content)] lg:gap-16">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="step-card flex flex-col items-center gap-4 text-left"
              style={{ ["--n" as string]: i }}
            >
              <StepArt name={step.art} className="text-on-air" />
              <div>
                <h3 className="flex items-center gap-2.5 text-lg font-medium tracking-tight">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-medium tabular-nums text-primary-foreground"
                  >
                    {i + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                  {step.note && <span className="block">{step.note}</span>}
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

const ADVERTISER_CLAIMS = [
  {
    title: "Choose a slot",
    body: `${economy.slot.count} slots. Pick one. Unlimited campaigns.`,
  },
  {
    title: `${economy.slot.termDays} days`,
    body: "Starts when the campaign is approved.",
  },
  {
    title: "One flat fee",
    body: `${usdCents(economy.slot.priceUsdCents)}. No per-play bill.`,
  },
] as const;

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
          <p className="inline-flex h-7 items-center rounded-full bg-on-air px-3 text-xs font-medium uppercase tracking-widest text-on-air-foreground">
            Advertisers
          </p>
          <h2 className="landing-title landing-title-compact mt-3">
            Be on the screens people already look at
          </h2>
          <ul className="grid sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-1 lg:gap-x-0">
            {ADVERTISER_CLAIMS.map((claim) => (
              <li
                key={claim.title}
                className="pb-5 last:pb-0 before:mb-5 before:block before:h-px before:w-32 before:bg-primary/40 first:before:hidden"
              >
                <h3 className="text-base font-medium tracking-tight">{claim.title}</h3>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {claim.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <SlotSample sample={sample} />
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
      <Advertisers sample={sample} spacing={config.density} className={surface(1)} />
      <Faq
        items={landingFaq(config.faqPerGroup).flatMap((group) => group.items)}
        spacing={config.density}
        className={surface(2)}
      />
      <Cta slab={config.ctaSlab} />
    </div>
  );
}
