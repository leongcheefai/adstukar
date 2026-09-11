import { usePolled } from "../lib/poll";
import { describeWeather } from "../lib/weather";

interface Reading {
  temperature: number;
  code: number;
}

/** How often a screen asks again. Weather does not move faster than this. */
const REFRESH_MS = 15 * 60_000;

function forecastUrl(latitude: number, longitude: number): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code");
  return url.toString();
}

/**
 * The weather where the screen is. Open-Meteo needs no key and no account, so the
 * device asks it directly — CapyTV is a browser on somebody else's wifi, and a
 * key on it would be a key anybody could read.
 */
export function Weather({ latitude, longitude }: { latitude: number; longitude: number }) {
  const reading = usePolled<Reading>(
    forecastUrl(latitude, longitude),
    async (res) => {
      const body = (await res.json()) as {
        current?: { temperature_2m?: number; weather_code?: number };
      };
      const temperature = body.current?.temperature_2m;
      const code = body.current?.weather_code;
      if (typeof temperature !== "number" || typeof code !== "number") return null;
      return { temperature, code };
    },
    REFRESH_MS,
  );

  if (!reading) return null;

  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-[5vw] leading-none font-medium tabular-nums">
        {Math.round(reading.temperature)}°
      </span>
      <span className="mt-[1vh] text-[1.8vw] text-white/55">{describeWeather(reading.code)}</span>
    </div>
  );
}
