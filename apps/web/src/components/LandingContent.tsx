import { project } from "@repo/config/project";
import { Badge, Button, FAQ } from "@repo/ui";
import {
  ArrowRight,
  Check,
  CreditCard,
  GitBranch,
  LayoutDashboard,
  Server,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType } from "react";
import { env } from "../lib/env";

const APP_URL = env.PUBLIC_APP_URL;

const stack = ["Vite", "Hono", "Better Auth", "Drizzle", "Postgres", "Stripe", "Astro", "Tailwind"];

const manifest = [
  { module: "auth", detail: "Better Auth + Google OAuth" },
  { module: "billing", detail: "Stripe subscriptions" },
  { module: "database", detail: "Postgres + Drizzle ORM" },
  { module: "dashboard", detail: "React 19 + analytics" },
  { module: "emails", detail: "React Email + Resend" },
];

interface Item {
  title: string;
  description: string;
}

interface Category {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  headline: string;
  blurb: string;
  items: Item[];
}

const authCategory: Category = {
  id: "auth",
  label: "Authentication & Users",
  icon: ShieldCheck,
  headline: "Sign people in. Keep their accounts safe.",
  blurb:
    "Better Auth wired end to end — registration, verification, sessions, roles, and account management you would otherwise spend a week assembling.",
  items: [
    {
      title: "Email & password",
      description: "Registration, login, email verification, and password reset out of the box.",
    },
    {
      title: "Google OAuth",
      description: "Social sign-in wired and ready — drop in credentials and ship.",
    },
    {
      title: "Sessions & devices",
      description: "Tokens track IP and user-agent. Revoke one session or sign out everywhere.",
    },
    {
      title: "Admin roles",
      description: "Role-based access with an admin plugin and route guards baked in.",
    },
    {
      title: "Account settings",
      description:
        "Profile editing, email change with re-verification, avatar upload, account delete.",
    },
    {
      title: "Transactional emails",
      description: "Welcome, verify, reset, and email-change messages fire on the right events.",
    },
  ],
};

const billingCategory: Category = {
  id: "billing",
  label: "Payments & Billing",
  icon: CreditCard,
  headline: "Charge customers on day one.",
  blurb:
    "A full Stripe subscription flow — checkout to dunning — with a webhook handler that survives retries, duplicates, and the whole lifecycle.",
  items: [
    {
      title: "Stripe checkout",
      description: "Checkout sessions with monthly or yearly price IDs and clean return URLs.",
    },
    {
      title: "Customer portal",
      description: "Self-service plan changes, payment methods, and cancellations via Stripe.",
    },
    {
      title: "Invoice history",
      description: "Paginated invoice list with status and PDF links in the dashboard.",
    },
    {
      title: "Hardened webhooks",
      description: "Deduplicated handler covers trialing, active, past_due, and canceled.",
    },
    {
      title: "Subscription state",
      description: "Status synced to your database and surfaced across the app.",
    },
    {
      title: "Dunning emails",
      description: "Failed payments flip the account to past_due and trigger an action email.",
    },
  ],
};

const specCategories: Category[] = [
  {
    id: "backend",
    label: "Backend & Data",
    icon: Server,
    headline: "A typed backend you can trust",
    blurb: "",
    items: [
      { title: "Hono REST API", description: "Modular route modules, middleware, error handling." },
      {
        title: "Postgres + Drizzle",
        description: "Type-safe ORM, generated migrations, Studio browser.",
      },
      {
        title: "Type-safe env",
        description: "Every secret validated through @repo/env with Zod.",
      },
      {
        title: "S3 / R2 uploads",
        description: "Presigned avatar URLs — works with S3 or Cloudflare R2.",
      },
      {
        title: "Structured logging",
        description: "Request context, leveled logger, consistent errors.",
      },
      { title: "Health checks", description: "Readiness endpoint for your load balancer." },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard & UI",
    icon: LayoutDashboard,
    headline: "A polished app shell, included",
    blurb: "",
    items: [
      {
        title: "React dashboard",
        description: "Vite + React 19, React Router, TanStack Query, guards.",
      },
      {
        title: "Analytics charts",
        description: "MRR, signups, DAU/WAU/MAU, plan mix, funnel, geo.",
      },
      {
        title: "Design system",
        description: "Shared shadcn/ui on Tailwind v4 — retheme in one file.",
      },
      { title: "Email templates", description: "React Email + Resend, no-op until you add a key." },
      { title: "Dark mode", description: "Light/dark toggle across site and dashboard." },
      {
        title: "Auto OG images",
        description: "Per-page social images generated at build with Satori.",
      },
    ],
  },
  {
    id: "devx",
    label: "Integrations & DevX",
    icon: GitBranch,
    headline: "Tooling that keeps you fast",
    blurb: "",
    items: [
      { title: "GitHub releases", description: "Sync repo releases into a public changelog page." },
      { title: "Feedback → issues", description: "In-app feedback auto-opens a GitHub issue." },
      { title: "Turborepo + pnpm", description: "Cached builds across three apps, six packages." },
      {
        title: "Biome only",
        description: "One fast linter and formatter. No ESLint, no Prettier.",
      },
      { title: "No lock-in", description: "No Next.js, Prisma, Clerk, or tRPC. A stack you own." },
      {
        title: "Component browser",
        description: "Dev-only /_dev/components route previews every primitive.",
      },
    ],
  },
];

const faqItems = [
  {
    question: "What's actually included?",
    answer:
      "Auth, Stripe billing, a React dashboard with charts, transactional emails, file uploads, GitHub integration, and a typed Hono API — wired together across a pnpm + Turborepo monorepo.",
  },
  {
    question: "What's the stack?",
    answer:
      "Vite + Hono + Better Auth, Postgres with Drizzle ORM, Tailwind v4 with shadcn/ui, and Astro for the marketing site. Type-safe end to end.",
  },
  {
    question: "Is there vendor lock-in?",
    answer:
      "No. There's no Next.js, Prisma, Clerk, or tRPC. The stack is deliberately locked to swappable, well-understood pieces you own.",
  },
  {
    question: "Can I self-host?",
    answer:
      "Yes. It's a standard Node + Postgres app. Uploads use any S3-compatible store (AWS S3 or Cloudflare R2). Deploy it wherever you like.",
  },
  {
    question: "How do I rebrand it?",
    answer:
      "Edit packages/config/src/project.ts for product identity and packages/ui/src/styles/tokens.css for the visual theme. The internal @repo/* package scope stays unchanged.",
  },
];

function LeadCategory({ category, flip }: { category: Category; flip: boolean }) {
  const Icon = category.icon;
  return (
    <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
      <div className={`lg:col-span-5 ${flip ? "lg:order-2" : ""} lg:sticky lg:top-24`}>
        <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Icon className="h-4 w-4" />
          {category.label}
        </div>
        <h3 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          {category.headline}
        </h3>
        <p className="mt-4 max-w-md text-muted-foreground">{category.blurb}</p>
      </div>
      <dl
        className={`grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:col-span-7 ${flip ? "lg:order-1" : ""}`}
      >
        {category.items.map((item) => (
          <div key={item.title} className="border-t border-border pt-4">
            <dt className="text-[15px] font-semibold">{item.title}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SpecColumn({ category }: { category: Category }) {
  const Icon = category.icon;
  return (
    <div className="border-t-2 border-foreground pt-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {category.label}
      </div>
      <h3 className="mt-1 text-base text-muted-foreground">{category.headline}</h3>
      <dl className="mt-5 divide-y divide-border">
        {category.items.map((item) => (
          <div key={item.title} className="py-3.5">
            <dt className="text-sm font-semibold">{item.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function LandingContent() {
  return (
    <>
      {/* Hero — asymmetric split, content left, manifest right */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16">
          <div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Production-ready SaaS boilerplate
            </Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Auth, billing, and a dashboard — already wired together.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {project.name} is a Vite + Hono + Better Auth monorepo. Clone it, point it at your
              database, and start on feature one instead of plumbing.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <a href={`${APP_URL}/signup`}>
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#features">See what's inside</a>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {stack.map((name) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {name}
                </li>
              ))}
            </ul>
          </div>

          {/* Manifest panel — concrete, not decorative */}
          <div className="lg:justify-self-end lg:[transform:rotate(-0.6deg)]">
            <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-[var(--elev-2)]">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <span className="text-sm font-semibold">{project.slug}</span>
                <span className="text-xs text-muted-foreground">3 apps · 6 packages</span>
              </div>
              <ul className="divide-y divide-border">
                {manifest.map((row) => (
                  <li key={row.module} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="w-24 text-sm font-medium">{row.module}</span>
                    <span className="text-sm text-muted-foreground">{row.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-3 text-xs text-muted-foreground">
                Everything below ships in the box.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead categories — zig-zag */}
      <div id="features" className="mx-auto max-w-6xl space-y-24 px-6 py-24 sm:py-28">
        <LeadCategory category={authCategory} flip={false} />
        <LeadCategory category={billingCategory} flip />
      </div>

      {/* Spec sheet — the rest, grouped by rule lines not cards */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              And the rest
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Plus everything you'd otherwise rebuild
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The unglamorous parts — a typed API, a real dashboard, and the tooling that keeps a
              monorepo sane — already done.
            </p>
          </div>
          <div className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-3">
            {specCategories.map((category) => (
              <SpecColumn key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Honest value band — replaces fabricated testimonials */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <div className="grid items-end gap-8 lg:grid-cols-2">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What you're not building this month.
            </h2>
            <p className="text-lg text-muted-foreground lg:text-right">
              No glue code. No mystery dependencies. No framework you'll be fighting in six months.
            </p>
          </div>
          <ul className="mt-12 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {[
              "A password reset flow that actually verifies email",
              "Stripe webhooks that don't double-charge on retry",
              "A migrations setup you trust in production",
              "Presigned upload URLs with the right size limits",
              "Six analytics charts wired to real queries",
              "A linter config you stopped arguing about",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 border-t border-border pt-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} />
                <span className="text-[15px]">{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <Button asChild size="lg">
              <a href={`${APP_URL}/signup`}>
                Start your project
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t border-border">
        <FAQ eyebrow="FAQ" headline="Common questions" items={faqItems} />
      </div>
    </>
  );
}
