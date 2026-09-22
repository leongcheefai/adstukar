import { economy } from "@repo/config/economy";
import { useCallback, useEffect, useRef, useState } from "react";
import { PairingError, fetchLoop, sendReport } from "./api";
import { type QueuedReport, drainable, enqueue, forget, trim } from "./queue";
import { type CachedItem, dueAt, nextItem, playable } from "./schedule";
import { loadItems, loadQueue, saveItems, saveQueue } from "./storage";

export interface PlayerState {
  /** What is on screen right now, or null during the quiet gap. */
  current: CachedItem | null;
  /** Plays still cached. It is what tells a venue the screen can ride out a drop. */
  cached: number;
  /** Reports the screen still owes. */
  pending: number;
  online: boolean;
  /** Set only when the key itself is wrong; the screen then asks to be paired. */
  pairingError: string | null;
}

/**
 * Runs the screen.
 *
 * The batch is the whole point: CapyTV takes many plays at once, shows them one
 * at a time, and reports each one as it finishes. A screen that loses its network
 * keeps playing what it holds and keeps its reports, and the reports go out when
 * the network returns.
 */
export function usePlayer(deviceKey: string | null): PlayerState {
  const [items, setItems] = useState<CachedItem[]>(loadItems);
  const [queue, setQueue] = useState<QueuedReport[]>(loadQueue);
  const [current, setCurrent] = useState<CachedItem | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");
  const [pairingError, setPairingError] = useState<string | null>(null);

  // The timers read these, and a timer must never restart because a piece of
  // state it only reads happened to change.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const fetching = useRef(false);

  useEffect(() => saveItems(items), [items]);
  useEffect(() => saveQueue(queue), [queue]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // A hidden page is not a screen anybody sees. There is no attestation
  // (docs/adr/0003), so the honest client is the one that stops playing when it
  // is minimised or covered, and owes nothing for what nobody could have seen.
  useEffect(() => {
    const read = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, []);

  const refill = useCallback(async () => {
    if (!deviceKey || fetching.current) return;
    fetching.current = true;
    try {
      const fresh = await fetchLoop(deviceKey);
      setPairingError(null);
      // Keep what is still playable and append: a batch taken while the last one
      // was half spent must not throw away the plays that are still good.
      setItems((held) => {
        const kept = playable(held, new Date());
        const known = new Set(kept.map((i) => i.playId));
        return [...kept, ...fresh.filter((i) => !known.has(i.playId))];
      });
      setOnline(true);
    } catch (error) {
      if (error instanceof PairingError) setPairingError(error.message);
      else setOnline(false);
    } finally {
      fetching.current = false;
    }
  }, [deviceKey]);

  // Take a batch on start, and again whenever the cached one runs low. The
  // interval is what brings a screen back after its network returns.
  useEffect(() => {
    if (!deviceKey) return;
    const tick = () => {
      if (playable(itemsRef.current, new Date()).length <= economy.loop.refillAt) void refill();
    };
    tick();
    const id = setInterval(tick, economy.loop.refillIntervalSeconds * 1000);
    return () => clearInterval(id);
  }, [deviceKey, refill]);

  // Send what the screen owes, oldest first, whenever it has a network.
  useEffect(() => {
    if (!deviceKey || !online || queue.length === 0) return;
    let cancelled = false;
    void (async () => {
      const sending = drainable(queue, new Date());
      const sent: string[] = [];
      for (const report of sending) {
        if (cancelled) break;
        try {
          if (await sendReport(deviceKey, report)) sent.push(report.playId);
        } catch {
          setOnline(false);
          break;
        }
      }
      // An expired report earns nothing, so it goes with the ones that landed.
      const expired = queue.filter((r) => !sending.includes(r)).map((r) => r.playId);
      if (!cancelled && (sent.length > 0 || expired.length > 0)) {
        setQueue((held) => forget(held, [...sent, ...expired]));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceKey, online, queue]);

  // The play cycle: show one play for its dwell, owe a report for it, then hold
  // the device quiet for the gap before taking the next. It runs only while the
  // page is visible: a play cut short by a hidden page stays in the batch, is
  // owed nothing, and plays again when the page returns.
  useEffect(() => {
    if (!deviceKey || !visible) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const step = () => {
      if (stopped) return;
      const now = new Date();
      const item = nextItem(itemsRef.current, now);
      if (!item) {
        setCurrent(null);
        timer = setTimeout(step, 5_000);
        return;
      }

      setCurrent(item);
      timer = setTimeout(() => {
        if (stopped) return;
        // The play held its region for the full dwell, so it is owed a report and
        // is finished with: it leaves the batch either way.
        setItems((held) => held.filter((i) => i.playId !== item.playId));
        setQueue((held) =>
          trim(
            enqueue(held, {
              playId: item.playId,
              playedAt: new Date().toISOString(),
              expiresAt: item.expiresAt,
            }),
            economy.loop.maxPendingReports,
          ),
        );
        setCurrent(null);
        const wait = dueAt(now, item).getTime() - Date.now();
        timer = setTimeout(step, Math.max(wait, 0));
      }, item.dwellSeconds * 1000);
    };

    step();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      setCurrent(null);
    };
  }, [deviceKey, visible]);

  return {
    current,
    cached: playable(items, new Date()).length,
    pending: queue.length,
    online,
    pairingError,
  };
}
