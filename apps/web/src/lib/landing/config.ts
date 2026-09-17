import { z } from "zod";
import { SEED_MAX } from "./prng";

/**
 * The landing page is a pure function of this config. The saved copy lives in
 * `src/lib/landing.config.json`; the lab at `/lab/landing` edits it and writes
 * it back. Every taste decision is a field here, so nothing below is a literal
 * in a component.
 */

export const MODES = ["float", "set", "strap"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_META: Record<Mode, { label: string; hint: string }> = {
  float: {
    label: "Float",
    hint: "The blue slab fills the first screen: the header floats on it, the lockup in the middle, the ticker at its foot. The set sits in its own section below.",
  },
  set: {
    label: "Set",
    hint: "The product is the picture. A light hero with the screen beside the headline.",
  },
  strap: {
    label: "On air",
    hint: "The hero is the screen: black, title-safe, with the ticker as its foot.",
  },
};

export const DENSITIES = ["tight", "default", "loose"] as const;
export type Density = (typeof DENSITIES)[number];

interface NumberKnob {
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint: string;
}

/**
 * One table for the bounds, the step, and the label. The schema below derives
 * from it, so a slider can never reach a value the page refuses to render.
 */
export const NUMBER_KNOBS = {
  crawlSeconds: {
    label: "Crawl lap",
    min: 24,
    max: 80,
    step: 1,
    unit: "s",
    hint: "Seconds for every listing to pass once in the drawn set. The screen app runs 52.",
  },
  adCount: {
    label: "Listings in the crawl",
    min: 3,
    max: 8,
    step: 1,
    hint: "Drawn from a pool of invented advertisers.",
  },
  heroScale: {
    label: "Headline size",
    min: 0.85,
    max: 1.15,
    step: 0.01,
    unit: "×",
    hint: "Scales the hero lockup only.",
  },
  capyWidth: {
    label: "Lockup width",
    min: 240,
    max: 560,
    step: 8,
    unit: "px",
    hint: "The base width of the hero lockup; the page scales it up from there.",
  },
  radius: {
    label: "Corner radius",
    min: 0.5,
    max: 1.5,
    step: 0.05,
    unit: "×",
    hint: "Scales every radius token on the page.",
  },
  faqPerGroup: {
    label: "Questions per group",
    min: 2,
    max: 5,
    step: 1,
    hint: "The rest stay on the FAQ page.",
  },
  chartTrend: {
    label: "Sample chart trend",
    min: -1,
    max: 1,
    step: 0.05,
    hint: "How the sample venue's month leans.",
  },
  chartNoise: {
    label: "Sample chart noise",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "Day-to-day wobble in the sample series.",
  },
} as const satisfies Record<string, NumberKnob>;

export type NumberKnobKey = keyof typeof NUMBER_KNOBS;

function numberField(knob: NumberKnob) {
  const base = z.number().min(knob.min).max(knob.max);
  return knob.step === 1 ? base.int() : base;
}

export const landingConfigSchema = z.object({
  version: z.literal(1),
  mode: z.enum(MODES),
  seed: z.number().int().min(0).max(SEED_MAX),
  /** The fixed strap at the foot of every marketing page. */
  footCrawl: z.boolean(),
  crawlSeconds: numberField(NUMBER_KNOBS.crawlSeconds),
  adCount: numberField(NUMBER_KNOBS.adCount),
  heroScale: numberField(NUMBER_KNOBS.heroScale),
  capyWidth: numberField(NUMBER_KNOBS.capyWidth),
  radius: numberField(NUMBER_KNOBS.radius),
  density: z.enum(DENSITIES),
  /** Alternate sections on the brand tint. Off: one off-white canvas with rules between. */
  tint: z.boolean(),
  /** The closing call to action on the blue slab. Off: on the tint, without the capybara. */
  ctaSlab: z.boolean(),
  faqPerGroup: numberField(NUMBER_KNOBS.faqPerGroup),
  chartTrend: numberField(NUMBER_KNOBS.chartTrend),
  chartNoise: numberField(NUMBER_KNOBS.chartNoise),
});

export type LandingConfig = z.infer<typeof landingConfigSchema>;

export const BOOLEAN_KNOBS: Record<
  "footCrawl" | "tint" | "ctaSlab",
  { label: string; hint: string }
> = {
  footCrawl: {
    label: "Foot ticker",
    hint: "The fixed strap at the bottom of every page: the welcome, and the live total.",
  },
  tint: {
    label: "Tinted sections",
    hint: "Alternate the brand tint down the page.",
  },
  ctaSlab: {
    label: "Blue closing slab",
    hint: "Off puts the last call to action on the tint.",
  },
};

/** What a mode wants when the lab switches to it. Only the fields that follow the mode. */
export const MODE_DEFAULTS: Record<Mode, Partial<LandingConfig>> = {
  float: { footCrawl: true },
  set: { footCrawl: false },
  strap: { footCrawl: false },
};

export const DEFAULT_CONFIG: LandingConfig = {
  version: 1,
  mode: "float",
  seed: 260915,
  footCrawl: true,
  crawlSeconds: 42,
  adCount: 5,
  heroScale: 1,
  capyWidth: 448,
  radius: 1,
  density: "default",
  tint: true,
  ctaSlab: true,
  faqPerGroup: 3,
  chartTrend: 0.35,
  chartNoise: 0.45,
};

/** Throws on a bad file. A page that renders a broken config would hide the bug. */
export function parseLandingConfig(input: unknown): LandingConfig {
  return landingConfigSchema.parse(input);
}
