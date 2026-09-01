import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { Label, cn } from "@repo/ui";
import { useTheme } from "../../lib/theme";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSection() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <Label id="appearance-theme-label">Theme</Label>

      <div
        role="radiogroup"
        aria-labelledby="appearance-theme-label"
        className="grid max-w-md grid-cols-3 gap-3"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = theme === value;
          return (
            <button
              key={value}
              type="button"
              // biome-ignore lint/a11y/useSemanticElements: a styled tile, not an input
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-accent text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {theme === "system"
          ? `Following your device setting — currently ${resolvedTheme}.`
          : `Always ${theme}.`}
      </p>
    </div>
  );
}
