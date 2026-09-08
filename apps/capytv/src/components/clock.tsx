import { useEffect, useState } from "react";

/**
 * The clock. It is the reason a venue leaves the screen on, so it takes the
 * space and reads from across a room.
 */
export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col items-start">
      <span className="font-mono text-[13vw] leading-none font-semibold tracking-tight tabular-nums">
        {time}
      </span>
      <span className="mt-[1.5vh] text-[2.2vw] text-white/55">{date}</span>
    </div>
  );
}
