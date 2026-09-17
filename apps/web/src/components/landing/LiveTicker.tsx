import { Ticker, type TickerProps } from "./Ticker";

/**
 * The network total the strap shows. Nothing measures it for the site yet, so
 * the strap carries the brand's own figure, the way it does for online users.
 */
const ADS_VIEWED = 2_314_566;

/** The ticker with its figure: an island on the site, a plain component in the lab. */
export function LiveTicker({ variant }: Pick<TickerProps, "variant">) {
  return <Ticker plays={ADS_VIEWED} variant={variant} />;
}
