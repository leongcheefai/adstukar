import { describe, expect, it } from "vitest";
import { describeWeather } from "./weather";

describe("describeWeather", () => {
  it("names the codes Open-Meteo sends", () => {
    expect(describeWeather(0)).toBe("Clear");
    expect(describeWeather(3)).toBe("Overcast");
    expect(describeWeather(61)).toBe("Rain");
    expect(describeWeather(95)).toBe("Thunderstorm");
  });
  it("falls back rather than showing a bare number on a screen", () => {
    expect(describeWeather(999)).toBe("Weather");
  });
});
