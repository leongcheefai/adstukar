import { project } from "@repo/config/project";
import type { LoopItem } from "@repo/contracts/types";
import { QRCodeSVG } from "qrcode.react";

/**
 * One listing drawn in one overlay region.
 *
 * Three regions exist and only one paid listing is ever on screen at a time, so
 * this component is the whole ad surface: the region decides where it sits and
 * how loud it is, never how many of them there are.
 */

type Region = LoopItem["format"];
type Size = LoopItem["size"];

interface SpotContent {
  name: string;
  tagline: string;
  logoUrl: string | null;
  /** The code on screen. Null on the CapyAds card, which has nothing to scan. */
  codeUrl: string | null;
  paid: boolean;
}

/** What the region shows: a paid listing, the venue's own promotion, or our card. */
export function contentFor(item: LoopItem): SpotContent {
  if (item.listing) {
    return {
      name: item.listing.name,
      tagline: item.listing.tagline,
      logoUrl: item.listing.logoUrl,
      codeUrl: item.listing.scanUrl,
      paid: true,
    };
  }
  if (item.promotion) {
    return {
      name: item.promotion.name,
      tagline: item.promotion.tagline,
      logoUrl: item.promotion.logoUrl,
      codeUrl: item.promotion.url,
      paid: false,
    };
  }
  return {
    name: project.name,
    tagline: project.tagline,
    logoUrl: null,
    codeUrl: project.siteUrl,
    paid: false,
  };
}

const REGION_CLASS: Record<Region, string> = {
  // A strip across the foot of the screen. The default, and the quietest.
  band: "inset-x-0 bottom-0 flex-row items-center gap-[2vw] px-[3vw]",
  // A card in the corner. It takes the most attention, and costs the most.
  float: "right-[3vw] bottom-[3vw] max-w-[34vw] flex-col items-start gap-[1.5vh] rounded-2xl",
  // A single line. It is the least a screen can give, and the cheapest.
  ticker: "inset-x-0 bottom-0 flex-row items-center gap-[1.5vw] px-[3vw]",
};

const REGION_HEIGHT: Record<Region, Record<Size, string>> = {
  band: { small: "py-[2vh]", medium: "py-[3vh]", large: "py-[4.5vh]" },
  float: { small: "p-[2vh]", medium: "p-[2.5vh]", large: "p-[3.5vh]" },
  ticker: { small: "py-[1vh]", medium: "py-[1.4vh]", large: "py-[2vh]" },
};

/**
 * A code on every region. A ticker gets a small one rather than none: a region
 * that cannot be scanned could never earn the scan bonus, and the rate card
 * already prices a ticker as the cheapest thing a screen can sell.
 */
const CODE_PX: Record<Region, number> = { band: 108, float: 132, ticker: 64 };

export function Spot({ item }: { item: LoopItem }) {
  const content = contentFor(item);
  const region = item.format;
  const codePx = CODE_PX[region];

  return (
    <div
      className={`pointer-events-none absolute z-10 flex bg-black/72 backdrop-blur-md ${REGION_CLASS[region]} ${REGION_HEIGHT[region][item.size]}`}
    >
      {content.logoUrl && region !== "ticker" ? (
        <img
          src={content.logoUrl}
          alt=""
          className="h-[7vh] w-[7vh] shrink-0 rounded-xl object-cover"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[1.2vw] tracking-widest text-white/45 uppercase">
          {content.name}
          {content.paid ? null : <span className="ml-[1vw] text-white/25">House</span>}
        </p>
        <p
          className={`mt-[0.4vh] truncate text-white ${
            region === "ticker" ? "text-[1.9vw]" : "text-[2.6vw] font-medium"
          }`}
        >
          {content.tagline}
        </p>
      </div>

      {/* A viewer scans the code with a phone. On a paid listing the scan goes
          through the API and pays the bonus; on a house card it goes straight to
          the address and moves nothing. */}
      {content.codeUrl ? (
        <div className="shrink-0 rounded-lg bg-white p-[0.8vh]">
          <QRCodeSVG value={content.codeUrl} size={codePx} level="M" />
        </div>
      ) : null}
    </div>
  );
}
