/**
 * Open-Meteo's WMO weather codes, in the words a screen across a room can read.
 * The service needs no key and no account, so CapyTV calls it straight from the
 * device (see `docs/adr/0003`: the screen is a browser, not a server).
 */
const LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

/** A code we have no word for still has to read as something on a screen. */
export function describeWeather(code: number): string {
  return LABELS[code] ?? "Weather";
}
