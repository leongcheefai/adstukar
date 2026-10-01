import { economy } from "@repo/config/economy";
import type { DeviceState, RingBand, RingLap } from "@repo/contracts/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { UnknownScreenError, fetchRing, sendReport } from "./api";
import { type QueuedReport, drainable, enqueue, forget, trim } from "./queue";
import { lapsLeft, merge, takePlay } from "./ring-batch";
import { clearScreen, loadKey, loadLaps, loadQueue, saveKey, saveLaps, saveQueue } from "./storage";

export type ScreenStatus = "none" | "elsewhere" | "pending" | "rejected" | "earning" | "offline";

export interface Screen {
  key: string | null;
  status: ScreenStatus;
  rejectionReason: string | null;
  /** Bands for the crawl when this tab plays a paid ring; null means "show /slots/loop". */
  bands: RingBand[] | null;
  /** Reports still waiting for the network. */
  pending: number;
  register(key: string): void;
  onCrossing(position: number): void;
}

/** One tab per browser reports for a key; another tab shows the unpaid crawl. */
const LOCK = "capychannel.screen";

/**
 * Runs a registered set (docs/adr/0016): holds the ring batch, turns each counted
 * crossing into a queued report, sends the queue whenever there is a network, and
 * refills before the batch runs out.
 */
export function useScreen(): Screen {
  const [key, setKey] = useState<string | null>(loadKey);
  const [laps, setLaps] = useState<RingLap[]>(loadLaps);
  const [queue, setQueue] = useState<QueuedReport[]>(loadQueue);
  const [review, setReview] = useState<{ state: DeviceState; reason: string | null } | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [holder, setHolder] = useState(false);

  // The timers read these, and a timer must not restart because state it only
  // reads changed.
  const lapsRef = useRef(laps);
  lapsRef.current = laps;
  const reviewRef = useRef(review);
  reviewRef.current = review;
  const fetching = useRef(false);

  useEffect(() => saveLaps(laps), [laps]);
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

  // Wait for the lock, then hold it until this tab closes or the key goes. A
  // browser without Web Locks has one tab as far as the set can tell.
  useEffect(() => {
    if (!key) return;
    if (!navigator.locks) {
      setHolder(true);
      return;
    }
    let release: (() => void) | undefined;
    let cancelled = false;
    void navigator.locks.request(LOCK, () => {
      if (cancelled) return undefined;
      setHolder(true);
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    });
    return () => {
      cancelled = true;
      release?.();
      setHolder(false);
    };
  }, [key]);

  const forgetScreen = useCallback(() => {
    clearScreen();
    setKey(null);
    setLaps([]);
    setQueue([]);
    setReview(null);
  }, []);

  const refill = useCallback(async () => {
    if (!key || fetching.current) return;
    fetching.current = true;
    try {
      const fresh = await fetchRing(key);
      setReview({ state: fresh.state, reason: fresh.rejectionReason });
      setLaps((held) => merge(held, fresh.laps, new Date()));
      setOnline(true);
    } catch (error) {
      if (error instanceof UnknownScreenError) forgetScreen();
      else setOnline(false);
    } finally {
      fetching.current = false;
    }
  }, [key, forgetScreen]);

  // A screen under review asks every interval: it opens no play, and it learns of
  // its approval within a minute. An approved screen asks only when its batch runs
  // low, because every call opens plays.
  useEffect(() => {
    if (!key || !holder) return;
    const tick = () => {
      const approved = reviewRef.current?.state === "approved";
      if (!approved || lapsLeft(lapsRef.current, new Date()) <= economy.ring.refillAtLaps) {
        void refill();
      }
    };
    tick();
    const id = setInterval(tick, economy.loop.refillIntervalSeconds * 1000);
    return () => clearInterval(id);
  }, [key, holder, refill]);

  // Send what the set owes, oldest first, whenever it has a network.
  useEffect(() => {
    if (!key || !holder || !online || queue.length === 0) return;
    let cancelled = false;
    void (async () => {
      const sending = drainable(queue, new Date());
      const sent: string[] = [];
      for (const report of sending) {
        if (cancelled) break;
        try {
          if (await sendReport(key, report)) sent.push(report.playId);
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
  }, [key, holder, online, queue]);

  const onCrossing = useCallback(
    (position: number) => {
      if (!holder) return;
      const now = new Date();
      const taken = takePlay(lapsRef.current, position, now);
      if (!taken.play) return;
      const { playId, expiresAt } = taken.play;
      lapsRef.current = taken.laps;
      setLaps(taken.laps);
      setQueue((held) =>
        trim(
          enqueue(held, { playId, playedAt: now.toISOString(), expiresAt }),
          economy.loop.maxPendingReports,
        ),
      );
    },
    [holder],
  );

  const register = useCallback((next: string) => {
    saveKey(next);
    setKey(next);
  }, []);

  const status: ScreenStatus = !key
    ? "none"
    : !holder
      ? "elsewhere"
      : review?.state === "pending"
        ? "pending"
        : review?.state === "rejected"
          ? "rejected"
          : online
            ? "earning"
            : "offline";

  // With a key and a cached batch but no answer yet (a reload with no network),
  // the cached laps play at once: a set that restarts offline keeps earning on
  // what it holds.
  const paid = status === "earning" || status === "offline";
  return {
    key,
    status,
    rejectionReason: review?.reason ?? null,
    bands: paid ? (laps[0]?.bands ?? null) : null,
    pending: queue.length,
    register,
    onCrossing,
  };
}
