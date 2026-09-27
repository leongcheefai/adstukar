import { useNetworkStats } from "../../lib/network-stats";
import { Ticker, type TickerProps } from "./Ticker";

/** The ticker with its figures: an island on the site, a plain component in the lab. */
export function LiveTicker({ variant }: Pick<TickerProps, "variant">) {
  const stats = useNetworkStats();
  return <Ticker stats={stats} variant={variant} />;
}
