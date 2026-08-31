import { economy } from "@repo/config/economy";
import { project } from "@repo/config/project";
import { AdCard, Button, Container, Eyebrow, FAQ, Section, SectionHeader } from "@repo/ui";
import { ArrowRight, Eye, ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import type { ComponentType } from "react";
import { env } from "../lib/env";
import { LANDING_FAQ } from "../lib/faq";

const SIGNUP_URL = `${env.PUBLIC_APP_URL}/signup`;

const snippet = [
  `<div data-${project.slug}-key="pk_…"></div>`,
  `<script async src="${project.siteUrl}/embed/${project.slug}.js"></script>`,
].join("\n");

const { small, medium } = economy.cardSizes;
const viewablePercent = Math.round(economy.viewability.minRatio * 100);
const viewableSeconds = economy.viewability.minMs / 1000;

interface Step {
  number: string;
  title: string;
  body: string;
  detail?: string;
}

const steps: Step[] = [
  {
    number: "1",
    title: "Register your product",
    body: "Name, URL, tagline, and logo. Prove you own the domain with a one-time token.",
  },
  {
    number: "2",
    title: "Paste one snippet",
    body: "One <script> tag and one <div>. The card renders inside the div and nowhere else.",
    detail: snippet,
  },
  {
    number: "3",
    title: "Earn and spend points",
    body: `Each verified impression you show earns +${economy.earnPerImpression}. Each impression you receive costs −${economy.spendPerImpression}.`,
  },
];

interface Stat {
  value: string;
  label: string;
}

const stats: Stat[] = [
  { value: `+${economy.earnPerImpression}`, label: "earned per impression you show" },
  { value: `−${economy.spendPerImpression}`, label: "spent per impression you receive" },
  { value: `+${economy.grants.productApproval}`, label: "welcome grant on approval" },
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
    body: "A person reviews every product before it serves. No automated approval.",
  },
  {
    icon: Eye,
    title: "Verified impressions",
    body: `At least ${viewablePercent}% of the card must stay visible for ${viewableSeconds} second before anything counts.`,
  },
  {
    icon: ShieldCheck,
    title: "No tracking",
    body: "No cookies, no fingerprinting, and no third-party calls from the snippet.",
  },
  {
    icon: SlidersHorizontal,
    title: "Your rules",
    body: `Exclude up to ${economy.excludedTerms.max} terms. Set a house-ad share so your own card fills the slot as often as you want.`,
  },
];

function StepCard({ step }: { step: Step }) {
  return (
    <li className="relative flex flex-col gap-4">
      <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-primary bg-background font-mono text-sm font-semibold text-primary">
        {step.number}
      </span>
      <div>
        <h3 className="text-base font-semibold">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
      </div>
      {step.detail && (
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
          <code>{step.detail}</code>
        </pre>
      )}
    </li>
  );
}

export function LandingContent() {
  return (
    <>
      {/* Hero: pitch on the left, the actual card on the right */}
      <Section spacing="tight" className="border-b border-border">
        <Container className="grid items-center gap-12 py-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>Cross-promotion for indie hackers</Eyebrow>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              {project.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Show one small sponsored card for another member's product on your site. Every
              verified impression you show earns a point. Spend points to show your product on
              theirs. No money moves.
            </p>
            <div className="mt-9">
              <Button asChild size="lg">
                <a href={SIGNUP_URL}>
                  Join free
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          <figure className="flex flex-col items-start gap-4 lg:items-end">
            <div className="rounded-xl border border-border bg-muted/30 p-6 sm:p-8">
              <AdCard
                name="Craftlog"
                tagline="Ship notes for indie makers. Free while in beta."
                size="medium"
                href="#"
              />
            </div>
            <figcaption className="max-w-xs text-sm text-muted-foreground lg:text-right">
              This is what a placement looks like.{" "}
              <span className="font-mono">
                {medium.width}×{medium.height}
              </span>
              , clearly labeled, never louder than your site.
            </figcaption>
          </figure>
        </Container>
      </Section>

      {/* How it works */}
      <Section id="how-it-works">
        <Container>
          <SectionHeader
            eyebrow="How it works"
            headline="Three steps, one snippet"
            lede="Registration takes a few minutes. Moderation takes a person. After that the exchange runs on its own."
          />
          <div className="relative mt-16">
            <div
              aria-hidden
              className="absolute top-5 left-[calc(16.67%+1.25rem)] right-[calc(16.67%+1.25rem)] hidden h-px bg-border lg:block"
            />
            <ol className="grid gap-10 lg:grid-cols-3 lg:gap-8">
              {steps.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* Points economy */}
      <Section id="points" className="border-y border-border bg-muted/30">
        <Container>
          <SectionHeader
            eyebrow="The points economy"
            headline="One currency. No money."
            lede="You cannot buy points. You earn them by showing cards, and you spend them when other members show yours."
          />
          <dl className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card px-6 py-7 text-center"
              >
                <dd className="font-mono text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
                  {stat.value}
                </dd>
                <dt className="mt-3 text-sm text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            Points settle after{" "}
            <span className="font-mono text-foreground">{economy.settlementDelayHours} hours</span>{" "}
            and expire after{" "}
            <span className="font-mono text-foreground">{economy.expiryMonths} months</span>.
            Balances are always derived from the ledger.
          </p>
        </Container>
      </Section>

      {/* Built for trust */}
      <Section id="trust">
        <Container>
          <SectionHeader
            eyebrow="Built for trust"
            headline="Small, honest, and under your control"
            lede={`The card is ${small.width}×${small.height} or ${medium.width}×${medium.height}, always labeled, and never a surprise to your visitors.`}
          />
          <ul className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex flex-col gap-3 border-t border-border pt-5">
                  <Icon className="size-5 text-primary" />
                  <h3 className="text-base font-semibold">{item.title}</h3>
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

      {/* Final CTA */}
      <Section spacing="tight" className="border-t border-border bg-muted/30">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trade impressions, not invoices.
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground">
            Register your product, paste the snippet, and start earning points today.
          </p>
          <Button asChild size="lg">
            <a href={SIGNUP_URL}>
              Join free
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </Container>
      </Section>
    </>
  );
}
