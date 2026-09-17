import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOOLEAN_KNOBS,
  DENSITIES,
  type Density,
  type LandingConfig,
  MODES,
  MODE_DEFAULTS,
  MODE_META,
  type Mode,
  NUMBER_KNOBS,
  type NumberKnobKey,
  parseLandingConfig,
} from "../../lib/landing/config";
import { randomSeed } from "../../lib/landing/prng";
import { Landing } from "./Landing";
import { LiveTicker } from "./LiveTicker";

/**
 * The generator. The stage renders the real `Landing` from a live config; the
 * panel holds every knob. A click on the page draws a new seed. Save copies
 * the config, writes it to the file the site reads (dev server only), and
 * keeps it on a rail in this browser so two variations can be compared.
 */

const STORAGE_KEY = "capyads.lab.landing.v1";
const RAIL_MAX = 24;
const WIDTHS = { phone: 390, tablet: 820, desktop: 1280 } as const;
type Width = keyof typeof WIDTHS;
type BooleanKnobKey = keyof typeof BOOLEAN_KNOBS;

/** A click on one of these is a click on the page, not a request for a new seed. */
const INTERACTIVE = "a,button,summary,input,select,textarea,label,[role=slider],[role=switch]";

interface SavedEntry {
  id: string;
  at: string;
  path?: string;
  config: LandingConfig;
}

const isMode = (v: string): v is Mode => (MODES as readonly string[]).includes(v);
const isDensity = (v: string): v is Density => (DENSITIES as readonly string[]).includes(v);
const isWidth = (v: string): v is Width => v in WIDTHS;

function toEntry(raw: unknown): SavedEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const { id, at, path, config } = raw as Record<string, unknown>;
  if (typeof id !== "string" || typeof at !== "string") return null;
  try {
    return {
      id,
      at,
      config: parseLandingConfig(config),
      ...(typeof path === "string" ? { path } : {}),
    };
  } catch {
    return null;
  }
}

function loadRail(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map(toEntry).filter((e): e is SavedEntry => e !== null);
  } catch {
    return [];
  }
}

function storeRail(entries: SavedEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Private mode or a full store. The rail then lives for this page only.
  }
}

function snap(value: number, step: number): number {
  const snapped = Math.round(value / step) * step;
  return step >= 1 ? Math.round(snapped) : Number(snapped.toFixed(4));
}

function formatKnob(value: number, key: NumberKnobKey): string {
  const knob = NUMBER_KNOBS[key];
  const digits = knob.step >= 1 ? 0 : 2;
  const unit = "unit" in knob ? knob.unit : "";
  return `${value.toFixed(digits)}${unit}`;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function LandingLab({ initial }: { initial: LandingConfig }) {
  const [config, setConfig] = useState<LandingConfig>(initial);
  const [width, setWidth] = useState<Width>("desktop");
  const [rail, setRail] = useState<SavedEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState("Nothing saved yet this session.");
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRail(loadRail());
  }, []);

  const update = useCallback(<K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setActiveId(null);
  }, []);

  const shuffle = useCallback(() => update("seed", randomSeed()), [update]);

  // A click anywhere on the page that is not a control draws a new seed. The
  // listener is attached by hand so the stage stays a plain scroll box rather
  // than a widget with a role it does not have.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element) || target.closest(INTERACTIVE)) return;
      shuffle();
    }
    stage.addEventListener("click", onClick);
    return () => stage.removeEventListener("click", onClick);
  }, [shuffle]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest(`${INTERACTIVE},[role=tab]`)) return;
      if (event.key === " " || event.key === "r") {
        event.preventDefault();
        shuffle();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shuffle]);

  function switchMode(mode: Mode) {
    setConfig((c) => ({ ...c, mode, ...MODE_DEFAULTS[mode] }));
    setActiveId(null);
  }

  async function save() {
    const body = JSON.stringify(config, null, 2);
    const entry: SavedEntry = { id: String(Date.now()), at: new Date().toISOString(), config };
    const notes: string[] = [];
    try {
      await navigator.clipboard.writeText(body);
      notes.push("copied to the clipboard");
    } catch {
      notes.push("the clipboard refused");
    }
    try {
      const res = await fetch("/__lab/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (res.ok) {
        const data: unknown = await res.json();
        const path =
          data && typeof data === "object" && "path" in data && typeof data.path === "string"
            ? data.path
            : null;
        if (path) {
          entry.path = path;
          notes.push(`written to ${path}`);
        }
      } else {
        notes.push(`the file write was refused: ${await res.text()}`);
      }
    } catch {
      notes.push("no dev server, so no file was written");
    }
    const next = [entry, ...rail].slice(0, RAIL_MAX);
    setRail(next);
    storeRail(next);
    setActiveId(entry.id);
    setStatus(`Saved: ${notes.join("; ")}.`);
  }

  function apply(entry: SavedEntry) {
    setConfig(entry.config);
    setActiveId(entry.id);
  }

  function forget(entry: SavedEntry) {
    const next = rail.filter((e) => e.id !== entry.id);
    setRail(next);
    storeRail(next);
    if (activeId === entry.id) setActiveId(null);
  }

  const json = useMemo(() => JSON.stringify(config, null, 2), [config]);

  return (
    <div className="lab">
      <div
        ref={stageRef}
        className="lab-stage"
        style={{ ["--lab-w" as string]: `${WIDTHS[width]}px` }}
      >
        <div className="lab-frame">
          <Landing config={config} ticker={<LiveTicker variant="hero" />} />
          {config.footCrawl && <LiveTicker variant="foot" />}
        </div>
      </div>

      <aside className="lab-panel" aria-label="Landing lab controls">
        <div>
          <h1>Landing lab</h1>
          <p className="lab-hint">
            Click the page for a new seed, or press Space. Knobs re-render live. Save writes the
            config the site reads.
          </p>
        </div>

        <section className="lab-section">
          <h2>Mode</h2>
          <Tabs
            value={config.mode}
            onValueChange={(v) => {
              if (isMode(v)) switchMode(v);
            }}
          >
            <TabsList className="w-full">
              {MODES.map((mode) => (
                <TabsTrigger key={mode} value={mode}>
                  {MODE_META[mode].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="lab-hint">{MODE_META[config.mode].hint}</p>
        </section>

        <section className="lab-section">
          <h2>Seed</h2>
          <div className="lab-seed">
            <span>{config.seed}</span>
            <Button size="sm" variant="secondary" onClick={shuffle}>
              Shuffle
            </Button>
          </div>
        </section>

        <section className="lab-section">
          <h2>Knobs</h2>
          {(Object.keys(NUMBER_KNOBS) as NumberKnobKey[]).map((key) => {
            const knob = NUMBER_KNOBS[key];
            return (
              <div key={key} className="lab-row">
                <div className="lab-row-head">
                  <span>{knob.label}</span>
                  <output>{formatKnob(config[key], key)}</output>
                </div>
                <Slider
                  aria-label={knob.label}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  value={[config[key]]}
                  onValueChange={([v]) => {
                    if (v !== undefined) update(key, snap(v, knob.step));
                  }}
                />
                <p className="lab-hint">{knob.hint}</p>
              </div>
            );
          })}
          {(Object.keys(BOOLEAN_KNOBS) as BooleanKnobKey[]).map((key) => (
            <div key={key} className="lab-switch">
              <div>
                <span className="font-medium">{BOOLEAN_KNOBS[key].label}</span>
                <p className="lab-hint">{BOOLEAN_KNOBS[key].hint}</p>
              </div>
              <Switch
                aria-label={BOOLEAN_KNOBS[key].label}
                checked={config[key]}
                onCheckedChange={(v) => update(key, v)}
              />
            </div>
          ))}
          <div className="lab-row">
            <div className="lab-row-head">
              <span>Section spacing</span>
            </div>
            <Select
              value={config.density}
              onValueChange={(v) => {
                if (isDensity(v)) update("density", v);
              }}
            >
              <SelectTrigger className="w-full" aria-label="Section spacing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DENSITIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="lab-section">
          <h2>Stage</h2>
          <Tabs
            value={width}
            onValueChange={(v) => {
              if (isWidth(v)) setWidth(v);
            }}
          >
            <TabsList className="w-full">
              {(Object.keys(WIDTHS) as Width[]).map((w) => (
                <TabsTrigger key={w} value={w}>
                  {w}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="lab-hint">Lab only. The width is not part of the config.</p>
        </section>

        <section className="lab-section">
          <h2>Save</h2>
          <Button onClick={save}>Save config</Button>
          <p className="lab-status">{status}</p>
          {rail.length > 0 && (
            <div className="lab-rail">
              {rail.map((entry) => (
                <div
                  key={entry.id}
                  className="lab-rail-item"
                  data-active={entry.id === activeId ? "" : undefined}
                >
                  <button type="button" onClick={() => apply(entry)}>
                    <span>
                      {MODE_META[entry.config.mode].label} <code>{entry.config.seed}</code>
                    </span>
                    <span>{timeLabel(entry.at)}</span>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Forget this one"
                    onClick={() => forget(entry)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
          <details>
            <summary className="lab-hint cursor-pointer">Current JSON</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] leading-relaxed">
              {json}
            </pre>
          </details>
        </section>
      </aside>
    </div>
  );
}
