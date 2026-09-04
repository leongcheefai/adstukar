import { economy } from "@repo/config/economy";
import { Button, Container, FAQ, Section, SectionHeader } from "@repo/ui";
import { ArrowRight, Eye, ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import type { ComponentType } from "react";
import { env } from "../lib/env";
import { LANDING_FAQ } from "../lib/faq";

const SIGNUP_URL = `${env.PUBLIC_APP_URL}/signup`;

const { small, medium } = economy.cardSizes;
const viewablePercent = Math.round(economy.viewability.minRatio * 100);
const viewableSeconds = economy.viewability.minMs / 1000;

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
    title: "Show the card",
    body: "Paste one snippet on your site, or open your display page on any screen.",
  },
  {
    number: "3",
    title: "Earn and cash out",
    body: `+${economy.earnPerImpression} credit for every verified view. Turn your credits into money.`,
  },
];

/** Where a distributor can put the card. Mixed on purpose: the point is that a
 *  screen is a screen, whether it is a blog or a tablet on a dashboard. */
const places: string[] = [
  "Websites and apps",
  "Blogs and newsletters",
  "YouTube and TikTok",
  "Live streams",
  "A tablet in your car",
  "Café and shop screens",
  "Community boards",
  "Anywhere people look",
];

interface Stat {
  value: string;
  label: string;
}

const stats: Stat[] = [
  { value: `+${economy.earnPerImpression}`, label: "credit for every verified view you show" },
  { value: `−${economy.spendPerImpression}`, label: "credits for every verified view of your ad" },
  { value: `+${economy.grants.productApproval}`, label: "welcome credits, once you are approved" },
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
    body: "A person reviews every advertiser and every distributor before an ad runs.",
  },
  {
    icon: Eye,
    title: "You get paid for real views",
    body: `${viewablePercent}% visible for ${viewableSeconds} second, or the view earns nothing.`,
  },
  {
    icon: ShieldCheck,
    title: "No tracking",
    body: "No cookies, no fingerprinting, no third-party calls.",
  },
  {
    icon: SlidersHorizontal,
    title: "Your rules",
    body: `Block up to ${economy.excludedTerms.max} terms. Decide how often your own ad fills the slot.`,
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
            <span className="block">Show ads</span>
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
            Free to join. Earn credits for real views. Cash out when you want.
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
            headline="Three steps to your first payout"
            lede="Sign up in minutes. After the review, the ads run and the credits add up on their own."
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
            lede="A distributor is anyone with an audience or a screen: a blogger, a YouTuber, a café owner, a driver, a librarian."
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

      {/* Credits */}
      <Section id="credits" className="bg-surface-tint">
        <Container>
          <SectionHeader
            eyebrow="Credits"
            headline="Credits are money you have not taken out yet"
            lede="Advertisers spend credits to run their ads. Distributors earn credits and cash them out."
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
            Credits settle after{" "}
            <span className="font-mono tabular-nums text-foreground">
              {economy.settlementDelayHours} hours
            </span>
            . Cash out your settled credits at any time. Unused credits expire after{" "}
            <span className="font-mono tabular-nums text-foreground">
              {economy.expiryMonths} months
            </span>
            .
          </p>
        </Container>
      </Section>

      {/* Built for trust */}
      <Section id="trust">
        <Container>
          <SectionHeader
            eyebrow="Built for trust"
            headline="Small, honest, and under your control"
            lede={`The card is ${small.width}×${small.height} or ${medium.width}×${medium.height}, and always labelled.`}
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
              Get paid for the space you already have.
            </h2>
            <p className="mt-5 max-w-sm text-lg text-brand-200">
              Sign up free, show one card, and cash out your credits.
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
