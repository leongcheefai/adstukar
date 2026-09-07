# CapyTV ships as a PWA, and device attestation is deferred

CapyTV is our own content screen app — clock, weather, a local feed — with the
ad overlay composed on top. Content is the reason a venue leaves the screen on,
so we ship it rather than depending on partner apps that do not exist yet.

We ship it as a web app in a kiosk browser, not as a native Android or iOS app.
That reuses the existing Vite / React / TypeScript stack, runs on any smart TV,
stick, tablet, or old laptop, and needs no store review. The cost is real: Play
Integrity and App Attest exist only in a native app, so **there is no device
attestation**, and the device credential is an API key that a determined cheat
can copy.

## Consequences

Fraud is bounded by policy instead of by hardware:

- An admin approves each device, with a photo of the screen in place, a location,
  and a venue type. Approval also stamps the tier.
- A daily play cap limits what one device can ever earn.
- Earned points settle, then wait out a longer payout hold. An admin reviews the
  play and scan history before cash leaves.
- The scan-to-play ratio flags dead screens.

The exposure is therefore `cap x rate x approved devices`, which is a number we
choose. Revisit this ADR before removing the manual payout review, or before
raising the cap.
