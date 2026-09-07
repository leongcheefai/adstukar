/**
 * The numbers the old web embed runs on.
 *
 * They used to come from `@repo/config/economy`. That file now holds the play
 * economy for screens, and none of it applies to a card on a web page. The embed
 * is unmaintained, so its constants live here and change with nothing else.
 */
export const embedConfig = {
  viewability: {
    /** Fraction of the card that must be visible. */
    minRatio: 0.5,
    /** Milliseconds the card must stay visible. */
    minMs: 1000,
  },
  cardSizes: {
    small: { width: 320, height: 64 },
    medium: { width: 300, height: 120 },
  },
} as const;
