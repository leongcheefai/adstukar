type Level = "info" | "warn" | "error";

export function log(level: Level, message: string, data?: Record<string, unknown>) {
  const entry = { level, message, time: new Date().toISOString(), ...data };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
