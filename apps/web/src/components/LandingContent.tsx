import { distributorPercent, economy, playRateRange } from "@repo/config/economy";
import { Button, Container, FAQ, Section, SectionHeader } from "@repo/ui";
import { ArrowRight, Eye, ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import type { ComponentType } from "react";
import { env } from "../lib/env";
import { LANDING_FAQ } from "../lib/faq";

const SIGNUP_URL = `${env.PUBLIC_APP_URL}/signup`;

const { lowest: lowestPlayRate, highest: highestPlayRate } = playRateRange();
const distributorShare = distributorPercent();

/** Shared by both call-to-action buttons. Trailing icon, so the right padding
 *  runs 2px tighter than the left to sit optically centred. */
const CTA_CLASS =
  "rounded-full bg-white pl-7 pr-6 text-base font-medium text-brand-500 transition-[background-color,transform] duration-150 ease-out hover:bg-brand-100 focus-visible:ring-white/60";

interface Step {
  number: string;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    number: "1",
    title: "Sign up and get approved",
    body: "Tell us who you are and where you show ads. A person reviews it once.",
  },
  {
    number: "2",
    title: "Open CapyTV on a screen",
    body: "No app store. Any TV, stick, tablet, or old laptop opens the page and starts playing.",
  },
  {
    number: "3",
    title: "Earn CapyPoints",
    body: `${lowestPlayRate} to ${highestPlayRate} CapyPoints for every play, banked until cash-out opens.`,
  },
];

/** Where a distributor can put the card. Mixed on purpose: the point is that a
 *  screen is a screen, whether it is a blog or a tablet on a dashboard. */
const places: string[] = [
  "Café counters",
  "Shop windows",
  "Gyms and studios",
  "Salons and barbers",
  "Clinic waiting rooms",
  "Office receptions",
  "A tablet in your car",
  "Anywhere people look",
];

interface Stat {
  value: string;
  label: string;
}

const stats: Stat[] = [
  {
    value: `${lowestPlayRate}–${highestPlayRate}`,
    label: "CapyPoints for every play on your screen",
  },
  { value: `${distributorShare}%`, label: "of every play and scan stays with you" },
  {
    value: economy.pointsPerUsd.toLocaleString(),
    label: "CapyPoints are 1 US dollar, at a fixed rate",
  },
];

interface TrustItem {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const trust: TrustItem[] = [
  {
    icon: UserCheck,
    title: "Human moderation",
    body: "A person reviews every listing and every screen before a listing plays.",
  },
  {
    icon: Eye,
    title: "One listing at a time",
    body: "Your screen holds several regions, but only one paid listing is ever on it.",
  },
  {
    icon: ShieldCheck,
    title: "No tracking",
    body: "No camera, no microphone, no audience measurement. The screen only reports that it played.",
  },
  {
    icon: SlidersHorizontal,
    title: "Your rules",
    body: `Block up to ${economy.excludedTerms.max} terms. Set the dwell and the quiet time between plays.`,
  },
];

function StepCard({ step, connected }: { step: Step; connected: boolean }) {
  return (
    <li className="relative flex flex-col gap-4">
      {/* Runs from this circle to the next one. The grid gap is 2rem, so the
          rule reaches 2rem past the column edge to meet its neighbour. */}
      {connected && (
        <span
          aria-hidden
          className="absolute top-[1.375rem] right-[-2rem] left-[3.25rem] hidden h-px bg-border lg:block"
        />
      )}
      <span className="relative z-10 flex size-11 items-center justify-center rounded-full bg-primary font-mono text-base font-medium tabular-nums text-primary-foreground">
        {step.number}
      </span>
      <div>
        <h3 className="text-lg font-medium tracking-tight">{step.title}</h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.body}</p>
      </div>
    </li>
  );
}

export function LandingContent() {
  return (
    <>
      {/* Hero. One centred column, with the capybara sitting inside the headline
          so the illustration is the thing the eye lands on first. */}
      <Section spacing="none" className="overflow-hidden bg-slab text-slab-foreground">
        <Container className="flex flex-col items-center py-16 text-center sm:py-20 lg:py-24">
          {/* 36px on phones, measured, not guessed: at 40px "and earn money"
              wraps on a 360px screen, which leaves the illustration sitting
              between a one-line half and a two-line half of its own headline. */}
          <h1 className="text-4xl font-medium leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            <span className="block">Play ads</span>
            {/* Decorative: alt is empty, so the heading still reads as one
                sentence. Inert, so it cannot swallow a click meant for a button. */}
            <img
              src="/brand/capybara-float.png"
              alt=""
              width={1137}
              height={468}
              className="capy-float pointer-events-none mx-auto my-3 w-full max-w-xs select-none sm:my-4 sm:max-w-sm lg:max-w-md"
            />
            <span className="block">and earn money</span>
          </h1>

          {/* The one line of fine print carries the hero on its own now, so it
              sits directly above the buttons rather than below them. */}
          <p className="mt-8 text-sm text-brand-200">
            Free to join. Earn CapyPoints for every play. Cash-out opens soon.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className={CTA_CLASS}>
              <a href={SIGNUP_URL}>
                Join free
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="rounded-full border border-white/35 px-7 text-base font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-white/60"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </Container>
      </Section>

      {/* How it works, ending on the two artefacts: what you paste, what they see. */}
      <Section id="how-it-works">
        <Container>
          <SectionHeader
            eyebrow="How it works"
            headline="Three steps to your first CapyPoints"
            lede="Sign up in minutes. After the review, the listings play and the points add up on their own."
          />
          <ol className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} connected={i < steps.length - 1} />
            ))}
          </ol>
        </Container>
      </Section>

      {/* Who can distribute. The one section that answers "is this for me?" for
          a person who does not own a website. */}
      <Section id="where">
        <Container>
          <SectionHeader
            eyebrow="Who earns"
            headline="If people look at it, you can earn from it"
            lede="A distributor is anyone with a screen in a room: a café owner, a gym, a salon, a clinic, a driver."
          />
          <ul className="mt-14 flex flex-wrap justify-center gap-3">
            {places.map((place) => (
              <li
                key={place}
                className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground"
              >
                {place}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* CapyPoints */}
      <Section id="points" className="bg-surface-tint">
        <Container>
          <SectionHeader
            eyebrow="CapyPoints"
            headline="CapyPoints are money you have not taken out yet"
            lede="Advertisers buy points and spend them on plays. Distributors earn points, and cash-out opens soon."
          />
          <ul className="mt-14 grid gap-5 sm:grid-cols-3">
            {stats.map((stat) => (
              <li key={stat.label} className="flex flex-col gap-3 rounded-xl bg-card p-7">
                <p className="font-mono text-5xl font-medium leading-none tabular-nums tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{stat.label}</p>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-center text-sm text-muted-foreground">
            Points settle after{" "}
            <span className="font-mono tabular-nums text-foreground">
              {economy.settlementDelayHours} hours
            </span>
            . Cash-out is not open yet; when it opens, earned points will wait out a{" "}
            <span className="font-mono tabular-nums text-foreground">
              {economy.payout.holdDays}-day
            </span>{" "}
            hold first. Unused points expire after{" "}
            <span className="font-mono tabular-nums text-foreground">
              {economy.expiryMonths} months
            </span>
            . Points you bought never expire.
          </p>
        </Container>
      </Section>

      {/* Built for trust */}
      <Section id="trust">
        <Container>
          <SectionHeader
            eyebrow="Built for trust"
            headline="Small, honest, and under your control"
            lede="The card is a band, a float, or a ticker, and it is always labelled."
          />
          <ul className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex flex-col gap-4">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-surface-tint text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-base font-medium tracking-tight">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <div className="border-t border-border">
        <FAQ eyebrow="FAQ" headline="Common questions" items={LANDING_FAQ} />
      </div>

      {/* Final CTA — the second and last brand slab. */}
      <Section spacing="none" className="overflow-hidden bg-slab text-slab-foreground">
        <Container className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.2fr_auto] lg:py-24">
          <div>
            <h2 className="text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl">
              Get paid for the screen you already have.
            </h2>
            <p className="mt-5 max-w-sm text-lg text-brand-200">
              Sign up free, open CapyTV on a screen, and start banking CapyPoints.
            </p>
            <Button asChild size="lg" className={`mt-8 ${CTA_CLASS}`}>
              <a href={SIGNUP_URL}>
                Join free
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
          <img
            src="/brand/capybara-fish.png"
            alt=""
            width={470}
            height={641}
            className="pointer-events-none mx-auto h-56 w-auto select-none sm:h-72 lg:h-80"
          />
        </Container>
      </Section>
    </>
  );
}
